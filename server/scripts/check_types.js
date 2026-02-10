
import pool from '../config/db.js';

async function debug() {
  try {
    const connection = await pool.getConnection();
    
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hunsentreang_school' 
      AND TABLE_NAME IN ('student', 'teacher', 'subject')
    `);
    
    console.log('Column Types:');
    columns.forEach(c => {
      if (['StudentID', 'TeacherID', 'SubjectId'].includes(c.COLUMN_NAME)) {
        console.log(`${c.COLUMN_NAME}: ${c.COLUMN_TYPE}`);
      }
    });

    connection.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

debug();
