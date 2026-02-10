// ClassListAPI.js
import express from "express";
import pool from "../config/db.js";
import { google } from 'googleapis';

const router = express.Router();

const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Google Drive API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials if available
if (process.env.GOOGLE_ACCESS_TOKEN) {
  oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });
}

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// Helper function to get Google Drive preview URL
const getDrivePreviewUrl = (url) => {
  if (!url) return null;
  
  // Extract file ID from various Google Drive URL formats
  let fileId = null;
  
  // Standard Google Drive URLs
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }
  
  if (fileId) {
    // Return direct thumbnail URL
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  
  return url;
};

// 1. Get class by ID with teacher information
router.get("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();

    const query = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.ClassLetter,
        c.HomeroomTeacherID,
        t.TeacherID,
        t.TeacherFirstName,
        t.TeacherLastName,
        t.TeacherSex,
        t.TeacherAge,
        t.TeacherBirthDate,
        t.TeacherBirthVillage,
        t.TeacherBirthCommune,
        t.TeacherBirthDistrict,
        t.TeacherBirthProvince,
        t.TeacherCurrentVillage,
        t.TeacherCurrentCommune,
        t.TeacherCurrentDistrict,
        t.TeacherCurrentProvince,
        t.JoinDate,
        t.Diploma,
        t.Subject1,
        t.Subject2,
        t.TeacherPic,
        t.CreatedAt,
        t.UpdatedAt,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName,
        (SELECT COUNT(*) FROM student WHERE ClassID = c.ClassId) as student_count
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE c.ClassId = ?
    `;

    const [classData] = await connection.query(query, [id]);

    if (classData.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញថ្នាក់នេះទេ",
      });
    }

    // Process teacher picture if exists
    if (classData[0].TeacherPic) {
      classData[0].TeacherPicPreview = getDrivePreviewUrl(classData[0].TeacherPic);
    }

    connection.release();

    res.json({
      success: true,
      data: classData[0],
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចទាញយកព័ត៌មានថ្នាក់បានទេ",
      error: error.message,
    });
  }
});

// 2. Get students in a specific class with pagination and search
router.get("/:id/students", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      search = "", 
      gender = "",
      sortBy = "StudentLastname",
      sortOrder = "asc" 
    } = req.query;
    
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const offset = (pageNumber - 1) * pageSize;

    connection = await pool.getConnection();

    // Check if class exists with teacher info
    const classCheckQuery = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.ClassLetter,
        c.HomeroomTeacherID,
        t.TeacherID,
        t.TeacherFirstName,
        t.TeacherLastName,
        t.TeacherSex,
        t.TeacherAge,
        t.TeacherBirthDate,
        t.TeacherBirthVillage,
        t.TeacherBirthCommune,
        t.TeacherBirthDistrict,
        t.TeacherBirthProvince,
        t.TeacherCurrentVillage,
        t.TeacherCurrentCommune,
        t.TeacherCurrentDistrict,
        t.TeacherCurrentProvince,
        t.JoinDate,
        t.Diploma,
        t.Subject1,
        t.Subject2,
        t.TeacherPic,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE c.ClassId = ?
    `;

    const [classExists] = await connection.query(classCheckQuery, [id]);

    if (classExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញថ្នាក់នេះទេ",
      });
    }

    // Process teacher picture
    if (classExists[0].TeacherPic) {
      classExists[0].TeacherPicPreview = getDrivePreviewUrl(classExists[0].TeacherPic);
    }

    // Build WHERE clause for students query
    let whereClause = "WHERE s.ClassID = ?";
    const queryParams = [id];

    if (search) {
      whereClause += ` AND (
        s.StudentFirstname LIKE ? OR 
        s.StudentLastname LIKE ? OR 
        s.StudentID LIKE ? OR 
        s.StudentFathernumber LIKE ? OR 
        s.StudentMothernumber LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (gender) {
      let genderCode = '';
      switch(gender) {
        case 'ប្រុស': genderCode = 'M'; break;
        case 'ស្រី': genderCode = 'F'; break;
        case 'ផ្សេងៗ': genderCode = 'O'; break;
        default: genderCode = gender;
      }
      whereClause += ` AND s.StudentSex = ?`;
      queryParams.push(genderCode);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM student s
      ${whereClause}
    `;

    const [countResult] = await connection.query(countQuery, queryParams);
    const total = countResult[0].total;

    // Build ORDER BY clause
    const validSortColumns = [
      "StudentID", 
      "StudentLastname", 
      "StudentFirstname", 
      "StudentSex", 
      "StudentBirthdate",
      "Enrolldate"
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "StudentLastname";
    const order = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

    // Get students with pagination
    const studentsQuery = `
      SELECT 
        s.StudentID,
        s.StudentFirstname,
        s.StudentLastname,
        s.StudentSex,
        s.StudentBirthdate,
        s.StudentAge,
        s.StudentBirthvillage,
        s.StudentBirthcommune,
        s.StudentBirthdistrict,
        s.StudentBirthProvince,
        s.StudentCurrentvillage,
        s.StudentCurrentcommune,
        s.StudentCurrentdistrict,
        s.Studentcurrentprovince,
        s.StudentFathername,
        s.StudentMothername,
        s.StudentFathernumber,
        s.StudentMothernumber,
        s.StudentFatherjob,
        s.StudentMotherJob,
        s.Enrolldate,
        s.Fromschool,
        s.StudentPicture,
        s.CreatedAt,
        s.ClassID,
        CONCAT(s.StudentFirstname, ' ', s.StudentLastname) as FullName,
        CASE 
          WHEN s.StudentSex = 'M' THEN 'ប្រុស'
          WHEN s.StudentSex = 'F' THEN 'ស្រី'
          ELSE 'ផ្សេងៗ'
        END as GenderKhmer
      FROM student s
      ${whereClause}
      ORDER BY ${sortColumn} ${order}
      LIMIT ? OFFSET ?
    `;

    const studentsParams = [...queryParams, pageSize, offset];
    const [students] = await connection.query(studentsQuery, studentsParams);

    // Process student pictures for Google Drive URLs
    const processedStudents = students.map(student => {
      if (student.StudentPicture) {
        student.StudentPicturePreview = getDrivePreviewUrl(student.StudentPicture);
      }
      return student;
    });

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_students,
        SUM(CASE WHEN StudentSex = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN StudentSex = 'F' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN StudentSex = 'O' THEN 1 ELSE 0 END) as other_count,
        AVG(StudentAge) as avg_age
      FROM student
      WHERE ClassID = ?
    `;

    const [statsResult] = await connection.query(statsQuery, [id]);

    connection.release();

    res.json({
      success: true,
      data: {
        class: classExists[0],
        students: processedStudents,
        statistics: {
          total_students: statsResult[0].total_students || 0,
          male_count: statsResult[0].male_count || 0,
          female_count: statsResult[0].female_count || 0,
          other_count: statsResult[0].other_count || 0,
          avg_age: statsResult[0].avg_age ? parseFloat(statsResult[0].avg_age).toFixed(1) : 0
        },
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching class students:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចទាញយកទិន្នន័យសិស្សបានទេ",
      error: error.message,
    });
  }
});

// 3. Add new student to class
router.post("/:id/students", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const {
      StudentFirstname,
      StudentLastname,
      StudentSex,
      StudentBirthdate,
      StudentAge,
      StudentBirthvillage,
      StudentBirthcommune,
      StudentBirthdistrict,
      StudentBirthProvince,
      StudentCurrentvillage = StudentBirthvillage,
      StudentCurrentcommune = StudentBirthcommune,
      StudentCurrentdistrict = StudentBirthdistrict,
      Studentcurrentprovince = StudentBirthProvince,
      StudentFathername = "",
      StudentMothername = "",
      StudentFathernumber = "",
      StudentMothernumber = "",
      StudentFatherjob = "",
      StudentMotherJob = "",
      Enrolldate = new Date().toISOString().split('T')[0],
      Fromschool = "",
      StudentPicture = ""
    } = req.body;

    // Required fields validation
    if (!StudentFirstname || !StudentLastname || !StudentSex) {
      return res.status(400).json({
        success: false,
        message: "សូមបំពេញព័ត៌មានចាំបាច់៖ នាមត្រកូល នាមខ្លួន និងភេទ",
      });
    }

    // Check if class exists
    connection = await pool.getConnection();
    const classCheckQuery = "SELECT ClassId FROM class WHERE ClassId = ?";
    const [classExists] = await connection.query(classCheckQuery, [id]);

    if (classExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញថ្នាក់នេះទេ",
      });
    }

    // Generate StudentID
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Get the last student ID for this year/month
    const lastIdQuery = `
      SELECT StudentID 
      FROM student 
      WHERE StudentID LIKE 'ST${year}${month}%' 
      ORDER BY StudentID DESC 
      LIMIT 1
    `;
    
    const [lastIdResult] = await connection.query(lastIdQuery);
    let nextNumber = 1;
    
    if (lastIdResult.length > 0) {
      const lastId = lastIdResult[0].StudentID;
      const lastNumber = parseInt(lastId.slice(-3)) || 0;
      nextNumber = lastNumber + 1;
    }
    
    const StudentID = `ST${year}${month}${nextNumber.toString().padStart(3, '0')}`;

    // Calculate age if not provided
    let calculatedAge = StudentAge;
    if (!StudentAge && StudentBirthdate) {
      const birthDate = new Date(StudentBirthdate);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    // Insert student
    const insertQuery = `
      INSERT INTO student (
        StudentID,
        StudentFirstname,
        StudentLastname,
        StudentSex,
        ClassID,
        StudentBirthdate,
        StudentAge,
        StudentBirthvillage,
        StudentBirthcommune,
        StudentBirthdistrict,
        StudentBirthProvince,
        StudentCurrentvillage,
        StudentCurrentcommune,
        StudentCurrentdistrict,
        Studentcurrentprovince,
        StudentFathername,
        StudentMothername,
        StudentFathernumber,
        StudentMothernumber,
        StudentFatherjob,
        StudentMotherJob,
        Enrolldate,
        Fromschool,
        StudentPicture,
        CreatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const insertParams = [
      StudentID,
      StudentFirstname,
      StudentLastname,
      StudentSex,
      id,
      StudentBirthdate || null,
      calculatedAge || null,
      StudentBirthvillage || "",
      StudentBirthcommune || "",
      StudentBirthdistrict || "",
      StudentBirthProvince || "",
      StudentCurrentvillage || "",
      StudentCurrentcommune || "",
      StudentCurrentdistrict || "",
      Studentcurrentprovince || "",
      StudentFathername || "",
      StudentMothername || "",
      StudentFathernumber || "",
      StudentMothernumber || "",
      StudentFatherjob || "",
      StudentMotherJob || "",
      Enrolldate || null,
      Fromschool || "",
      StudentPicture || ""
    ];

    const [result] = await connection.query(insertQuery, insertParams);

    // Get the inserted student
    const selectQuery = `
      SELECT * FROM student WHERE StudentID = ?
    `;

    const [newStudent] = await connection.query(selectQuery, [StudentID]);

    connection.release();

    res.json({
      success: true,
      message: "សិស្សថ្មីត្រូវបានបន្ថែមដោយជោគជ័យ!",
      data: {
        StudentID,
        insertId: result.insertId,
        student: newStudent[0],
      },
    });
    emitRefresh(req, 'students');
  } catch (error) {
    console.error("Error adding student:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចបន្ថែមសិស្សបានទេ",
      error: error.message,
    });
  }
});

// 4. Update student information
router.put("/students/:studentId", async (req, res) => {
  let connection;
  try {
    const { studentId } = req.params;
    const {
      StudentFirstname,
      StudentLastname,
      StudentSex,
      StudentBirthdate,
      StudentAge,
      StudentBirthvillage,
      StudentBirthcommune,
      StudentBirthdistrict,
      StudentBirthProvince,
      StudentCurrentvillage,
      StudentCurrentcommune,
      StudentCurrentdistrict,
      Studentcurrentprovince,
      StudentFathername,
      StudentMothername,
      StudentFathernumber,
      StudentMothernumber,
      StudentFatherjob,
      StudentMotherJob,
      ClassID,
      Enrolldate,
      Fromschool,
      StudentPicture
    } = req.body;

    connection = await pool.getConnection();

    // Check if student exists
    const studentCheckQuery = "SELECT StudentID FROM student WHERE StudentID = ?";
    const [studentExists] = await connection.query(studentCheckQuery, [studentId]);

    if (studentExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញសិស្សនេះទេ",
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];

    if (StudentFirstname !== undefined) {
      updateFields.push("StudentFirstname = ?");
      updateParams.push(StudentFirstname);
    }
    if (StudentLastname !== undefined) {
      updateFields.push("StudentLastname = ?");
      updateParams.push(StudentLastname);
    }
    if (StudentSex !== undefined) {
      updateFields.push("StudentSex = ?");
      updateParams.push(StudentSex);
    }
    if (StudentBirthdate !== undefined) {
      updateFields.push("StudentBirthdate = ?");
      updateParams.push(StudentBirthdate || null);
    }
    if (StudentAge !== undefined) {
      updateFields.push("StudentAge = ?");
      updateParams.push(StudentAge || null);
    }
    if (StudentBirthvillage !== undefined) {
      updateFields.push("StudentBirthvillage = ?");
      updateParams.push(StudentBirthvillage || "");
    }
    if (StudentBirthcommune !== undefined) {
      updateFields.push("StudentBirthcommune = ?");
      updateParams.push(StudentBirthcommune || "");
    }
    if (StudentBirthdistrict !== undefined) {
      updateFields.push("StudentBirthdistrict = ?");
      updateParams.push(StudentBirthdistrict || "");
    }
    if (StudentBirthProvince !== undefined) {
      updateFields.push("StudentBirthProvince = ?");
      updateParams.push(StudentBirthProvince || "");
    }
    if (StudentCurrentvillage !== undefined) {
      updateFields.push("StudentCurrentvillage = ?");
      updateParams.push(StudentCurrentvillage || "");
    }
    if (StudentCurrentcommune !== undefined) {
      updateFields.push("StudentCurrentcommune = ?");
      updateParams.push(StudentCurrentcommune || "");
    }
    if (StudentCurrentdistrict !== undefined) {
      updateFields.push("StudentCurrentdistrict = ?");
      updateParams.push(StudentCurrentdistrict || "");
    }
    if (Studentcurrentprovince !== undefined) {
      updateFields.push("Studentcurrentprovince = ?");
      updateParams.push(Studentcurrentprovince || "");
    }
    if (StudentFathername !== undefined) {
      updateFields.push("StudentFathername = ?");
      updateParams.push(StudentFathername || "");
    }
    if (StudentMothername !== undefined) {
      updateFields.push("StudentMothername = ?");
      updateParams.push(StudentMothername || "");
    }
    if (StudentFathernumber !== undefined) {
      updateFields.push("StudentFathernumber = ?");
      updateParams.push(StudentFathernumber || "");
    }
    if (StudentMothernumber !== undefined) {
      updateFields.push("StudentMothernumber = ?");
      updateParams.push(StudentMothernumber || "");
    }
    if (StudentFatherjob !== undefined) {
      updateFields.push("StudentFatherjob = ?");
      updateParams.push(StudentFatherjob || "");
    }
    if (StudentMotherJob !== undefined) {
      updateFields.push("StudentMotherJob = ?");
      updateParams.push(StudentMotherJob || "");
    }
    if (ClassID !== undefined) {
      updateFields.push("ClassID = ?");
      updateParams.push(ClassID);
    }
    if (Enrolldate !== undefined) {
      updateFields.push("Enrolldate = ?");
      updateParams.push(Enrolldate || null);
    }
    if (Fromschool !== undefined) {
      updateFields.push("Fromschool = ?");
      updateParams.push(Fromschool || "");
    }
    if (StudentPicture !== undefined) {
      updateFields.push("StudentPicture = ?");
      updateParams.push(StudentPicture || "");
    }

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message: "គ្មានទិន្នន័យដើម្បីធ្វើបច្ចុប្បន្នភាព",
      });
    }

    updateParams.push(studentId);

    const updateQuery = `
      UPDATE student 
      SET ${updateFields.join(", ")}
      WHERE StudentID = ?
    `;

    const [result] = await connection.query(updateQuery, updateParams);

    // Get updated student
    const selectQuery = `
      SELECT * FROM student WHERE StudentID = ?
    `;

    const [updatedStudent] = await connection.query(selectQuery, [studentId]);

    connection.release();

    res.json({
      success: true,
      message: "ព័ត៌មានសិស្សត្រូវបានកែប្រែដោយជោគជ័យ!",
      data: {
        affectedRows: result.affectedRows,
        student: updatedStudent[0],
      },
    });
    emitRefresh(req, 'students');
  } catch (error) {
    console.error("Error updating student:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចកែប្រែព័ត៌មានសិស្សបានទេ",
      error: error.message,
    });
  }
});

// 5. Delete student
router.delete("/students/:studentId", async (req, res) => {
  let connection;
  try {
    const { studentId } = req.params;

    connection = await pool.getConnection();

    // Check if student exists
    const studentCheckQuery = "SELECT StudentID, StudentFirstname, StudentLastname FROM student WHERE StudentID = ?";
    const [studentExists] = await connection.query(studentCheckQuery, [studentId]);

    if (studentExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញសិស្សនេះទេ",
      });
    }

    // Delete student
    const deleteQuery = "DELETE FROM student WHERE StudentID = ?";
    const [result] = await connection.query(deleteQuery, [studentId]);

    connection.release();

    res.json({
      success: true,
      message: "សិស្សត្រូវបានលុបដោយជោគជ័យ!",
      data: {
        affectedRows: result.affectedRows,
        deletedStudent: studentExists[0],
      },
    });
    emitRefresh(req, 'students');
  } catch (error) {
    console.error("Error deleting student:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចលុបសិស្សបានទេ",
      error: error.message,
    });
  }
});

// 6. Get Google Drive preview URL
router.get("/preview/drive", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required"
      });
    }

    const previewUrl = getDrivePreviewUrl(url);
    
    res.json({
      success: true,
      previewUrl
    });
  } catch (error) {
    console.error("Error getting Drive preview:", error);
    res.status(500).json({
      success: false,
      message: "មិនអាចទាញយករូបភាពបានទេ",
      error: error.message
    });
  }
});

// 7. Export students to Excel
router.get("/:id/export/excel", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await pool.getConnection();

    // Get class info
    const classQuery = `
      SELECT 
        c.ClassName,
        c.ClassLetter,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherName
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE c.ClassId = ?
    `;

    const [classInfo] = await connection.query(classQuery, [id]);

    if (classInfo.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "រកមិនឃើញថ្នាក់នេះទេ",
      });
    }

    // Get all students in class
    const studentsQuery = `
      SELECT 
        StudentID as 'លេខកូដ',
        StudentFirstname as 'នាមខ្លួន',
        StudentLastname as 'នាមត្រកូល',
        CASE 
          WHEN StudentSex = 'M' THEN 'ប្រុស'
          WHEN StudentSex = 'F' THEN 'ស្រី'
          ELSE 'ផ្សេងៗ'
        END as 'ភេទ',
        StudentAge as 'អាយុ',
        StudentBirthdate as 'ថ្ងៃខែឆ្នាំកំណើត',
        CONCAT(StudentBirthvillage, ', ', StudentBirthcommune, ', ', StudentBirthdistrict, ', ', StudentBirthProvince) as 'ទីកន្លែងកំណើត',
        StudentFathernumber as 'ទូរស័ព្ទឪពុក',
        StudentMothernumber as 'ទូរស័ព្ទម្តាយ'
      FROM student
      WHERE ClassID = ?
      ORDER BY StudentLastname, StudentFirstname
    `;

    const [students] = await connection.query(studentsQuery, [id]);

    connection.release();

    // Convert to CSV format
    const headers = Object.keys(students[0] || {});
    const csvRows = [
      `ថ្នាក់: ${classInfo[0].ClassName}${classInfo[0].ClassLetter}`,
      `គ្រូបន្ទប់: ${classInfo[0].TeacherName || 'មិនទាន់មាន'}`,
      `កាលបរិច្ឆេទនាំចេញ: ${new Date().toLocaleDateString('km-KH')}`,
      '', // Empty line
      headers.join(','),
      ...students.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special characters for CSV
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const fileName = `សិស្ស_${classInfo[0].ClassName}${classInfo[0].ClassLetter}_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);

  } catch (error) {
    console.error("Error exporting to Excel:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "មិនអាចនាំចេញទិន្នន័យបានទេ",
      error: error.message,
    });
  }
});

export default router;
