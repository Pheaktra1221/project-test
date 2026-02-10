import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// 1. Get gender distribution statistics - FIXED
router.get('/gender-distribution', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        SUM(CASE WHEN StudentSex = 'M' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN StudentSex = 'F' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN StudentSex = 'O' OR StudentSex IS NULL THEN 1 ELSE 0 END) as other,
        COUNT(*) as total
      FROM student
      WHERE StudentID IS NOT NULL
    `;
    
    const [result] = await connection.query(query);
    connection.release();
    
    res.json({
      success: true,
      data: {
        male: result[0]?.male || 0,
        female: result[0]?.female || 0,
        other: result[0]?.other || 0,
        total: result[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Error fetching gender distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gender distribution',
      error: error.message
    });
  }
});

// 2. Get comprehensive dashboard statistics - FIXED
router.get('/dashboard', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Gender Statistics - FIXED
    const genderQuery = `
      SELECT 
        SUM(CASE WHEN StudentSex = 'M' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN StudentSex = 'F' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN StudentSex = 'O' OR StudentSex IS NULL THEN 1 ELSE 0 END) as other,
        COUNT(*) as total
      FROM student
      WHERE StudentID IS NOT NULL
    `;
    
    // Class Statistics - FIXED
    const classQuery = `
      SELECT 
        c.ClassName,
        c.ClassLetter,
        COUNT(s.StudentID) as student_count
      FROM class c
      LEFT JOIN student s ON c.ClassId = s.ClassID
      WHERE s.StudentID IS NOT NULL
      GROUP BY c.ClassId, c.ClassName, c.ClassLetter
      ORDER BY student_count DESC
      LIMIT 10
    `;
    
    // Age Statistics - FIXED (assuming StudentAge exists)
    const ageQuery = `
      SELECT 
        COUNT(*) as total,
        AVG(StudentAge) as average_age,
        MIN(StudentAge) as min_age,
        MAX(StudentAge) as max_age,
        SUM(CASE WHEN StudentAge < 18 THEN 1 ELSE 0 END) as under_18
      FROM student
      WHERE StudentID IS NOT NULL AND StudentAge IS NOT NULL
    `;
    
    // New: Enrollment statistics by year/month
    const enrollmentQuery = `
      SELECT 
        YEAR(Enrolldate) as enrollment_year,
        MONTH(Enrolldate) as enrollment_month,
        COUNT(*) as student_count
      FROM student
      WHERE Enrolldate IS NOT NULL
      GROUP BY YEAR(Enrolldate), MONTH(Enrolldate)
      ORDER BY enrollment_year DESC, enrollment_month DESC
      LIMIT 12
    `;
    
    // New: Birth Province statistics
    const provinceQuery = `
      SELECT 
        StudentBirthProvince,
        COUNT(*) as student_count
      FROM student
      WHERE StudentBirthProvince IS NOT NULL AND StudentBirthProvince != ''
      GROUP BY StudentBirthProvince
      ORDER BY student_count DESC
      LIMIT 10
    `;
    
    // Execute queries sequentially to prevent connection protocol errors
    const genderRaw = await connection.query(genderQuery);
    const classRaw = await connection.query(classQuery);
    const ageRaw = await connection.query(ageQuery);
    const enrollmentRaw = await connection.query(enrollmentQuery);
    const provinceRaw = await connection.query(provinceQuery);
    
    // Helper to extract rows regardless of driver version (handling [rows, fields] vs rows)
    const getRows = (result) => {
      if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
        return result[0];
      }
      return Array.isArray(result) ? result : [];
    };

    const genderResult = getRows(genderRaw);
    const classResult = getRows(classRaw);
    const ageResult = getRows(ageRaw);
    const enrollmentResult = getRows(enrollmentRaw);
    const provinceResult = getRows(provinceRaw);
    
    connection.release();
    
    // Format response
    const responseData = {
      gender: {
        male: genderResult[0]?.male || 0,
        female: genderResult[0]?.female || 0,
        other: genderResult[0]?.other || 0,
        total: genderResult[0]?.total || 0
      },
      classes: classResult || [],
      age: {
        total: ageResult[0]?.total || 0,
        average_age: ageResult[0]?.average_age ? parseFloat(ageResult[0].average_age).toFixed(2) : 0,
        min_age: ageResult[0]?.min_age || 0,
        max_age: ageResult[0]?.max_age || 0,
        under_18: ageResult[0]?.under_18 || 0
      },
      enrollment: enrollmentResult || [],
      provinces: provinceResult || []
    };
    
    res.json({
      success: true,
      data: responseData,
      message: 'Dashboard statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// 3. Additional statistics endpoint: Get student count by class
router.get('/students-by-class', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        c.ClassName,
        c.ClassLetter,
        COUNT(s.StudentID) as student_count,
        SUM(CASE WHEN s.StudentSex = 'M' THEN 1 ELSE 0 END) as male_count,
        SUM(CASE WHEN s.StudentSex = 'F' THEN 1 ELSE 0 END) as female_count
      FROM class c
      LEFT JOIN student s ON c.ClassId = s.ClassID
      GROUP BY c.ClassId, c.ClassName, c.ClassLetter
      ORDER BY c.ClassName, c.ClassLetter
    `;
    
    const [result] = await connection.query(query);
    connection.release();
    
    res.json({
      success: true,
      data: result,
      total: result.reduce((sum, item) => sum + item.student_count, 0)
    });
    
  } catch (error) {
    console.error('Error fetching students by class:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students by class',
      error: error.message
    });
  }
});

// 4. Get age distribution statistics
router.get('/age-distribution', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        CASE 
          WHEN StudentAge < 10 THEN 'Under 10'
          WHEN StudentAge BETWEEN 10 AND 14 THEN '10-14'
          WHEN StudentAge BETWEEN 15 AND 19 THEN '15-19'
          WHEN StudentAge BETWEEN 20 AND 24 THEN '20-24'
          WHEN StudentAge >= 25 THEN '25+'
          ELSE 'Unknown'
        END as age_group,
        COUNT(*) as student_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM student WHERE StudentAge IS NOT NULL), 2) as percentage
      FROM student
      WHERE StudentAge IS NOT NULL
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN 'Under 10' THEN 1
          WHEN '10-14' THEN 2
          WHEN '15-19' THEN 3
          WHEN '20-24' THEN 4
          WHEN '25+' THEN 5
          ELSE 6
        END
    `;
    
    const [result] = await connection.query(query);
    connection.release();
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error fetching age distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch age distribution',
      error: error.message
    });
  }
});

export default router;