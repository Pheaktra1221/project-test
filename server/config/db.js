import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: process.env.DB_PORT || 4000,
  user: process.env.DB_USER || '2qJrradHz8YKtmV.root',
  password: process.env.DB_PASSWORD || 'rjW9iNn6GzSVg7Vy',
  database: process.env.DB_NAME || 'hunsentreang_school',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  ssl: { rejectUnauthorized: false },
  decimalNumbers: true,
});

export default pool;
