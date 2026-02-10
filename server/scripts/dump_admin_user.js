import pool from '../config/db.js';

(async function(){
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute("SELECT ID, Username, Password, Role FROM user WHERE Username = 'admin' LIMIT 1");
    console.log(rows);
    conn.release();
  } catch (err) {
    console.error('Query error:', err);
  } finally {
    process.exit(0);
  }
})();
