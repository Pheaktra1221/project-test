import express from "express";
import pool from "../config/db.js";

const router = express.Router();

const emitRefresh = (req, resource) => {
  const io = req.app.get('io');
  if (io) io.emit('data_refresh', { resource });
};

// Test connection endpoint
router.get("/test", async (req, res) => {
  try {
    await pool.getConnection();
    res.json({ success: true, message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// 1. Get all homeroom teachers (for dropdown selection)
router.get("/homeroom-teachers", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        TeacherID,
        TeacherFirstName,
        TeacherLastName,
        TeacherSex,
        TeacherAge,
        Diploma,
        CONCAT(TeacherFirstName, ' ', TeacherLastName) as FullName
      FROM teacher
      WHERE TeacherID IS NOT NULL
      ORDER BY TeacherLastName, TeacherFirstName
    `;

    const [result] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: result,
      count: result.length,
    });
  } catch (error) {
    console.error("Error fetching homeroom teachers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch homeroom teachers",
      error: error.message,
    });
  }
});

const getDrivePreviewUrl = (url) => {
  if (!url) return null;
  let fileId = null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{25,})$/
  ];
  for (const pattern of patterns) {
    const match = String(url).match(pattern);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  }
  return url;
};

// Helper function to extract class number from class name
const extractClassNumber = (className) => {
  if (!className) return null;

  // Try to extract number from formats like "ថ្នាក់ទី 7A" or "ថ្នាក់ទី7A"
  const match = className.match(/ថ្នាក់ទី\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// Helper function to extract class letter from class name
const extractClassLetter = (className) => {
  if (!className) return null;

  // Try to extract letter from formats like "ថ្នាក់ទី 7A"
  const match = className.match(/ថ្នាក់ទី\s*\d+([A-Za-z])/);
  return match ? match[1].toUpperCase() : null;
};

// 2. Create a new class with ID gap reuse
router.post("/", async (req, res) => {
  let connection;
  try {
    const { classNumber, classLetter, homeroomTeacherId } = req.body;

    // Validate required fields
    if (!classNumber || !classLetter) {
      return res.status(400).json({
        success: false,
        message: "Class number and class letter are required",
      });
    }

    // Generate ClassName
    const classNameValue = classNumber.toString();

    connection = await pool.getConnection();

    // First, check for available gaps in ClassId
    const findGapQuery = `
      SELECT 
        t1.ClassId + 1 AS AvailableId
      FROM class AS t1
      LEFT JOIN class AS t2 ON t1.ClassId + 1 = t2.ClassId
      WHERE t2.ClassId IS NULL
      ORDER BY t1.ClassId
      LIMIT 1
    `;

    const [gapResult] = await connection.query(findGapQuery);
    let classIdToUse = null;

    if (gapResult.length > 0 && gapResult[0].AvailableId > 1) {
      // Use the first available gap
      classIdToUse = gapResult[0].AvailableId;
    }

    // If no gap found, get max ID + 1
    if (!classIdToUse) {
      const maxIdQuery =
        "SELECT COALESCE(MAX(ClassId), 0) + 1 as nextId FROM class";
      const [maxResult] = await connection.query(maxIdQuery);
      classIdToUse = maxResult[0].nextId;
    }

    // Check if class already exists
    const checkQuery = `
     SELECT ClassId FROM class 
  WHERE ClassName = ? AND ClassLetter = ?
`;

    const [existing] = await connection.query(checkQuery, [
      classNameValue,
      classLetter.toUpperCase(),
    ]);

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: "Class already exists",
      });
    }

    // Also check for classes with same number and letter in the name
    const checkAllClassesQuery = `
      SELECT ClassId, ClassName FROM class
    `;

    const [allClasses] = await connection.query(checkAllClassesQuery);

    const duplicate = allClasses.some((cls) => {
      const existingClassNumber = extractClassNumber(cls.ClassName);
      const existingClassLetter = extractClassLetter(cls.ClassName);

      return (
        existingClassNumber === parseInt(classNumber) &&
        existingClassLetter === classLetter.toUpperCase()
      );
    });

    if (duplicate) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: "A class with this number and letter already exists",
      });
    }

    // Insert with specific ClassId if we found a gap
    let insertQuery, queryParams;

    if (classIdToUse) {
      insertQuery = `
        INSERT INTO class (
          ClassId,
          ClassName, 
          ClassLetter, 
          HomeroomTeacherID, 
          CreatedAt, 
          UpdatedAt
        ) VALUES (?, ?, ?, ?, NOW(), NOW())
      `;
      queryParams = [
        classIdToUse,
        classNameValue,
        classLetter.toUpperCase(),
        homeroomTeacherId || null,
      ];
    } else {
      insertQuery = `
        INSERT INTO class (
          ClassName, 
          ClassLetter, 
          HomeroomTeacherID, 
          CreatedAt, 
          UpdatedAt
        ) VALUES (?, ?, ?, NOW(), NOW())
      `;
      queryParams = [
        classNameValue,
        classLetter.toUpperCase(),
        homeroomTeacherId || null,
      ];
    }

    const [result] = await connection.query(insertQuery, queryParams);

    const actualInsertId = classIdToUse || result.insertId;

    connection.release();

    res.json({
      success: true,
      message: "Class created successfully",
      data: {
        classId: actualInsertId,
        className: classNameValue,
        classLetter: classLetter.toUpperCase(),
        homeroomTeacherId,
        reusedGapId: !!classIdToUse,
      },
    });
    emitRefresh(req, 'classes');
  } catch (error) {
    console.error("Error creating class:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to create class",
      error: error.message,
    });
  }
});

// 3. Get all classes with teacher information
router.get("/", async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const offset = (pageNumber - 1) * pageSize;

    const connection = await pool.getConnection();

    // Base query
    let query = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.ClassLetter,
        c.HomeroomTeacherID,
        c.CreatedAt,
        c.UpdatedAt,
        t.TeacherFirstName,
        t.TeacherLastName,
        t.TeacherSex,
        t.Diploma,
        t.TeacherPic,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName,
        (SELECT COUNT(*) FROM student s WHERE s.ClassID = c.ClassId) as student_count
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
    `;

    // Add sorting
    const validSortColumns = [
      "ClassName",
      "ClassLetter",
      "CreatedAt",
      "student_count",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "ClassName";
    const order = sortOrder === "desc" ? "DESC" : "ASC";

    query += ` ORDER BY ${sortColumn} ${order}`;

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;

    const [result] = await connection.query(query, [pageSize, offset]);

    // Get total count
    const countQuery = "SELECT COUNT(*) as total FROM class";
    const [countResult] = await connection.query(countQuery);
    const total = countResult[0].total;

    // Add extracted class number to each result
    const classesWithNumber = result.map((cls) => ({
      ...cls,
      classNumber: extractClassNumber(cls.ClassName),
      TeacherPicPreview: cls.TeacherPic ? getDrivePreviewUrl(cls.TeacherPic) : null
    }));

    connection.release();

    res.json({
      success: true,
      data: classesWithNumber,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
      error: error.message,
    });
  }
});

// 4. Get class by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        c.*,
        t.TeacherFirstName,
        t.TeacherLastName,
        t.TeacherSex,
        t.TeacherAge,
        t.Diploma,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName,
        (SELECT COUNT(*) FROM student s WHERE s.ClassID = c.ClassId) as student_count,
        (SELECT GROUP_CONCAT(CONCAT(s.StudentFirstname, ' ', s.StudentLastname) SEPARATOR ', ') 
         FROM student s 
         WHERE s.ClassID = c.ClassId 
         LIMIT 5) as top_students
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE c.ClassId = ?
    `;

    const [result] = await connection.query(query, [id]);
    connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const classData = {
      ...result[0],
      classNumber: extractClassNumber(result[0].ClassName),
    };

    res.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class",
      error: error.message,
    });
  }
});

// 5. Update class
router.put("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { className, classLetter, homeroomTeacherId } = req.body;

    if (!className) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    connection = await pool.getConnection();

    // Check if class exists
    const checkDuplicateQuery = `
  SELECT ClassId FROM class 
  WHERE ClassName = ? AND ClassLetter = ? AND ClassId != ?
`;

    const [duplicate] = await connection.query(checkDuplicateQuery, [
      className,
      classLetter.toUpperCase(),
      id,
    ]);

    if (duplicate.length > 0) {
      connection.release();
      return res.status(409).json({
        success: false,
        message: "មានថ្នាក់ផ្សេងដែលប្រើឈ្មោះ និងអក្សរនេះរួចហើយ",
      });
    }

    // Update class
    const updateQuery = `
      UPDATE class 
      SET 
        ClassName = ?,
        ClassLetter = ?,
        HomeroomTeacherID = ?,
        UpdatedAt = NOW()
      WHERE ClassId = ?
    `;

    const [result] = await connection.query(updateQuery, [
      className,
      classLetter || extractClassLetter(className) || "",
      homeroomTeacherId || null,
      id,
    ]);

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found or no changes made",
      });
    }

    res.json({
      success: true,
      message: "Class updated successfully",
      affectedRows: result.affectedRows,
    });
    emitRefresh(req, 'classes');
  } catch (error) {
    console.error("Error updating class:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to update class",
      error: error.message,
    });
  }
});

// 6. Delete class
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await pool.getConnection();

    // Check if class exists
    const checkClassQuery = "SELECT ClassId FROM class WHERE ClassId = ?";
    const [classExists] = await connection.query(checkClassQuery, [id]);

    if (classExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check if class has students
    const checkStudentsQuery =
      "SELECT COUNT(*) as student_count FROM student WHERE ClassID = ?";
    const [studentCheck] = await connection.query(checkStudentsQuery, [id]);

    if (studentCheck[0].student_count > 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete class that has students assigned. Please reassign students first.",
      });
    }

    // Delete class
    const deleteQuery = "DELETE FROM class WHERE ClassId = ?";
    const [result] = await connection.query(deleteQuery, [id]);

    connection.release();

    res.json({
      success: true,
      message: "Class deleted successfully",
      affectedRows: result.affectedRows,
    });
    emitRefresh(req, 'classes');
  } catch (error) {
    console.error("Error deleting class:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to delete class",
      error: error.message,
    });
  }
});

// 7. Get classes with statistics (for dashboard)
router.get("/statistics/summary", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        c.ClassId,
        c.ClassName,
        c.ClassLetter,
        COUNT(s.StudentID) as total_students,
        SUM(CASE WHEN s.StudentSex = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN s.StudentSex = 'F' THEN 1 ELSE 0 END) as female_count,
        SUM(CASE WHEN s.StudentSex = 'O' OR s.StudentSex IS NULL THEN 1 ELSE 0 END) as other_count,
        t.TeacherFirstName,
        t.TeacherLastName,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as homeroom_teacher
      FROM class c
      LEFT JOIN student s ON c.ClassId = s.ClassID
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      GROUP BY c.ClassId, c.ClassName, c.ClassLetter, t.TeacherID
      ORDER BY LENGTH(c.ClassName), c.ClassName, c.ClassLetter
    `;

    const [result] = await connection.query(query);

    // Get overall statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_classes,
        SUM(total_students) as total_students,
        AVG(total_students) as avg_students_per_class,
        COUNT(CASE WHEN homeroom_teacher IS NULL THEN 1 END) as classes_without_teacher
      FROM (
        SELECT 
          c.ClassId,
          COUNT(s.StudentID) as total_students,
          CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as homeroom_teacher
        FROM class c
        LEFT JOIN student s ON c.ClassId = s.ClassID
        LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
        GROUP BY c.ClassId
      ) as subquery
    `;

    const [statsResult] = await connection.query(statsQuery);

    connection.release();

    const summary = {
      total_classes: statsResult[0].total_classes || 0,
      total_students: statsResult[0].total_students || 0,
      average_students_per_class: statsResult[0].avg_students_per_class
        ? parseFloat(statsResult[0].avg_students_per_class).toFixed(2)
        : "0.00",
      classes_without_teacher: statsResult[0].classes_without_teacher || 0,
    };

    res.json({
      success: true,
      data: result,
      summary: summary,
      message: "Class statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching class statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class statistics",
      error: error.message,
    });
  }
});

// 8. Search classes by name or letter
router.get("/search/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        c.*,
        t.TeacherFirstName,
        t.TeacherLastName,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName,
        (SELECT COUNT(*) FROM student s WHERE s.ClassID = c.ClassId) as student_count
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE 
        c.ClassName LIKE ? OR 
        c.ClassLetter LIKE ? OR
        t.TeacherFirstName LIKE ? OR
        t.TeacherLastName LIKE ? OR
        c.ClassId LIKE ?
      ORDER BY LENGTH(c.ClassName), c.ClassName, c.ClassLetter
    `;

    const searchTerm = `%${keyword}%`;
    const [result] = await connection.query(query, [
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
    ]);

    // Add extracted class number
    const classesWithNumber = result.map((cls) => ({
      ...cls,
      classNumber: extractClassNumber(cls.ClassName),
    }));

    connection.release();

    res.json({
      success: true,
      data: classesWithNumber,
      count: classesWithNumber.length,
    });
  } catch (error) {
    console.error("Error searching classes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search classes",
      error: error.message,
    });
  }
});

// 9. Get classes without homeroom teacher
router.get("/without-teacher", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM student s WHERE s.ClassID = c.ClassId) as student_count
      FROM class c
      WHERE c.HomeroomTeacherID IS NULL
      ORDER BY LENGTH(c.ClassName), c.ClassName, c.ClassLetter
    `;

    const [result] = await connection.query(query);

    // Add extracted class number
    const classesWithNumber = result.map((cls) => ({
      ...cls,
      classNumber: extractClassNumber(cls.ClassName),
    }));

    connection.release();

    res.json({
      success: true,
      data: classesWithNumber,
      count: classesWithNumber.length,
    });
  } catch (error) {
    console.error("Error fetching classes without teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes without teacher",
      error: error.message,
    });
  }
});

// 10. Assign teacher to multiple classes (bulk update)
router.post("/assign-teacher", async (req, res) => {
  let connection;
  try {
    const { teacherId, classIds } = req.body;

    if (!teacherId || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and array of class IDs are required",
      });
    }

    connection = await pool.getConnection();

    // Verify teacher exists
    const teacherCheckQuery =
      "SELECT TeacherID FROM teacher WHERE TeacherID = ?";
    const [teacherExists] = await connection.query(teacherCheckQuery, [
      teacherId,
    ]);

    if (teacherExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Verify all classes exist
    const placeholders = classIds.map(() => "?").join(",");
    const classesCheckQuery = `SELECT ClassId FROM class WHERE ClassId IN (${placeholders})`;
    const [classesExist] = await connection.query(classesCheckQuery, classIds);

    if (classesExist.length !== classIds.length) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: `Only ${classesExist.length} of ${classIds.length} classes found`,
      });
    }

    // Update multiple classes
    const updateQuery = `
      UPDATE class 
      SET HomeroomTeacherID = ?, UpdatedAt = NOW()
      WHERE ClassId IN (${placeholders})
    `;

    const [result] = await connection.query(updateQuery, [
      teacherId,
      ...classIds,
    ]);

    connection.release();

    res.json({
      success: true,
      message: `Teacher assigned to ${result.affectedRows} class(es) successfully`,
      affectedRows: result.affectedRows,
    });
    emitRefresh(req, 'classes');
  } catch (error) {
    console.error("Error assigning teacher to classes:", error);
    if (connection) connection.release();
    res.status(500).json({
      success: false,
      message: "Failed to assign teacher to classes",
      error: error.message,
    });
  }
});

// 11. Get available class numbers (for dropdown)
router.get("/available/numbers", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT DISTINCT 
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(ClassName, 'ទី ', -1), SUBSTRING(SUBSTRING_INDEX(ClassName, 'ទី ', -1), 2), 1) AS UNSIGNED) as class_number
      FROM class
      WHERE ClassName LIKE '%ទី%'
      ORDER BY class_number
    `;

    const [result] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: result.map((r) => r.class_number).filter((n) => n),
    });
  } catch (error) {
    console.error("Error fetching available class numbers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class numbers",
      error: error.message,
    });
  }
});

// 12. Get available class letters (for dropdown)
router.get("/available/letters", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    const query = `
      SELECT DISTINCT ClassLetter
      FROM class
      WHERE ClassLetter IS NOT NULL AND ClassLetter != ''
      ORDER BY ClassLetter
    `;

    const [result] = await connection.query(query);
    connection.release();

    res.json({
      success: true,
      data: result.map((r) => r.ClassLetter),
    });
  } catch (error) {
    console.error("Error fetching available class letters:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class letters",
      error: error.message,
    });
  }
});

// 13. Get students in a class
router.get("/:id/students", async (req, res) => {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const offset = (pageNumber - 1) * pageSize;

    const connection = await pool.getConnection();

    // Check if class exists
    const classCheckQuery =
      "SELECT ClassId, ClassName FROM class WHERE ClassId = ?";
    const [classExists] = await connection.query(classCheckQuery, [id]);

    if (classExists.length === 0) {
      connection.release();
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Get students with pagination
    const studentsQuery = `
      SELECT 
        s.*,
        CONCAT(s.StudentFirstname, ' ', s.StudentLastname) as FullName
      FROM student s
      WHERE s.ClassID = ?
      ORDER BY s.StudentLastname, s.StudentFirstname
      LIMIT ? OFFSET ?
    `;

    const [students] = await connection.query(studentsQuery, [
      id,
      pageSize,
      offset,
    ]);

    // Get total count
    const countQuery =
      "SELECT COUNT(*) as total FROM student WHERE ClassID = ?";
    const [countResult] = await connection.query(countQuery, [id]);
    const total = countResult[0].total;

    connection.release();

    res.json({
      success: true,
      data: {
        class: classExists[0],
        students: students,
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
    res.status(500).json({
      success: false,
      message: "Failed to fetch class students",
      error: error.message,
    });
  }
});

// 14. Get class by number and letter
router.get("/number/:number/letter/:letter", async (req, res) => {
  try {
    const { number, letter } = req.params;
    const connection = await pool.getConnection();

    const query = `
      SELECT 
        c.*,
        t.TeacherFirstName,
        t.TeacherLastName,
        CONCAT(t.TeacherFirstName, ' ', t.TeacherLastName) as TeacherFullName,
        (SELECT COUNT(*) FROM student s WHERE s.ClassID = c.ClassId) as student_count
      FROM class c
      LEFT JOIN teacher t ON c.HomeroomTeacherID = t.TeacherID
      WHERE c.ClassName LIKE CONCAT('%ទី ', ?, '%') 
        AND (c.ClassLetter = ? OR c.ClassName LIKE CONCAT('%', ?))
      LIMIT 1
    `;

    const [result] = await connection.query(query, [number, letter, letter]);
    connection.release();

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const classData = {
      ...result[0],
      classNumber: extractClassNumber(result[0].ClassName),
    };

    res.json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Error fetching class by number and letter:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class",
      error: error.message,
    });
  }
});

// 15. Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query("SELECT 1 as status");
    connection.release();

    res.json({
      status: "ok",
      database: result.length > 0 ? "connected" : "disconnected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      message: "Service unavailable",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
