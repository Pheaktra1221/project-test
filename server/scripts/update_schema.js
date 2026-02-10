
import pool from '../config/db.js';

async function updateSchema() {
  try {
    const connection = await pool.getConnection();
    console.log('Updating attendance_sessions table...');
    
    // Check if columns exist first to avoid errors
    const [columns] = await connection.query(`DESCRIBE attendance_sessions`);
    const columnNames = columns.map(c => c.Field);
    
    if (!columnNames.includes('SubjectID')) {
      console.log('Adding SubjectID...');
      await connection.query('ALTER TABLE attendance_sessions ADD COLUMN SubjectID INT');
    }
    
    if (!columnNames.includes('CreatedBy')) {
      console.log('Adding CreatedBy...');
      await connection.query('ALTER TABLE attendance_sessions ADD COLUMN CreatedBy VARCHAR(50)');
    }
    
    if (!columnNames.includes('CreatorRole')) {
      console.log('Adding CreatorRole...');
      await connection.query('ALTER TABLE attendance_sessions ADD COLUMN CreatorRole VARCHAR(20)');
    }

    console.log('Schema update complete!');
    connection.release();
  } catch (err) {
    console.error('Schema update failed:', err);
  } finally {
    process.exit();
  }
}

updateSchema();
