import pool from '../config/db.js';

async function debug() {
  try {
    console.log('Testing DB connection...');
    const connection = await pool.getConnection();
    console.log('DB Connection successful!');

    console.log('Checking user table structure...');
    const [columns] = await connection.query('DESCRIBE user');
    console.log('Columns in user table:', columns.map(c => c.Field).join(', '));

    console.log('Attempting to query a user (corrected)...');
    // Try to select just one user to see if the query fails
    try {
      const [rows] = await connection.query('SELECT ID, Username, Role, create_date FROM user LIMIT 1');
      console.log('Query successful. Rows found:', rows.length);
      if (rows.length > 0) console.log('Sample user:', rows[0]);
    } catch (err) {
      console.error('Query failed:', err.message);
    }

    connection.release();
  } catch (err) {
    console.error('DB Connection failed:', err);
  } finally {
    process.exit();
  }
}

debug();
