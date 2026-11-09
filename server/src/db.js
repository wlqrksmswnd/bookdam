import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'bookdam',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE/DATETIME 을 문자열로 받기 (타임존 밀림 방지)
  charset: 'utf8mb4',
});

export default pool;
