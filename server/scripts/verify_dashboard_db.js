
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent dir
dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyDashboardData() {
  let connection;
  try {
    const config = {
      host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
      port: process.env.DB_PORT || 4000,
      user: process.env.DB_USER || '2qJrradHz8YKtmV.root',
      password: process.env.DB_PASSWORD || 'rjW9iNn6GzSVg7Vy',
      database: process.env.DB_NAME || 'hunsentreang_school',
      ssl: { rejectUnauthorized: false }
    };
    
    console.log('Connecting to DB:', config.host, config.database);
    connection = await mysql.createConnection(config);
    
    // Gender Query
    const genderQuery = `
      SELECT 
        SUM(CASE WHEN StudentSex = 'M' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN StudentSex = 'F' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN StudentSex = 'O' OR StudentSex IS NULL THEN 1 ELSE 0 END) as other,
        COUNT(*) as total
      FROM student
      WHERE StudentID IS NOT NULL
    `;
    const [genderResult] = await connection.query(genderQuery);
    console.log('Gender Result (Raw):', JSON.stringify(genderResult, null, 2));
    
    // Class Query
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
    const [classResult] = await connection.query(classQuery);
    console.log('Class Result (Raw):', JSON.stringify(classResult, null, 2));

    // Age Query
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
    const [ageResult] = await connection.query(ageQuery);
    console.log('Age Result (Raw):', JSON.stringify(ageResult, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

verifyDashboardData();
