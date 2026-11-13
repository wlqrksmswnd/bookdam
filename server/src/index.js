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
  console.error('JWT_SECRET 이 .env 에 없습니다. README 의 환경 변수 목록을 참고하세요.');
  process.exit(1);
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/books', booksRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/users', usersRouter);

app.use((req, res) => res.status(404).json({ message: '존재하지 않는 API 입니다.' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: '요청 형식이 올바르지 않습니다.' });
  }
  if (err.status && err.expose !== false) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  res.status(500).json({ message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
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
