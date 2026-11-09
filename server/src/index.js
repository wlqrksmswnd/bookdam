import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import checkSchema from './checkSchema.js';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';
import reviewsRouter from './routes/reviews.js';
import usersRouter from './routes/users.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET 이 .env 에 없습니다. .env.example 을 참고하세요.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => res.status(404).json({ message: '존재하지 않는 API 입니다.' }));

// Express 5 는 async 핸들러의 에러를 자동으로 여기로 보냄
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || '서버 오류가 발생했습니다.' });
});

const PORT = Number(process.env.PORT) || 5000;

try {
  await pool.query('SELECT 1');
  await checkSchema();
  console.log(`MySQL 연결 성공: ${process.env.DB_NAME}`);
  app.listen(PORT, () => console.log(`북담 서버 실행 중: http://localhost:${PORT}`));
} catch (err) {
  console.error('MySQL 연결 실패:', err.message);
  process.exit(1);
}
