import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

// 회원가입: POST /api/auth/register  { username, password, nickname }
router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const nickname = String(req.body.nickname || '').trim();

  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username)) {
    return res.status(400).json({ message: '아이디는 영문/숫자/_ 4~20자로 입력하세요.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: '비밀번호는 8자 이상이어야 합니다.' });
  }
  if (nickname.length < 1 || nickname.length > 20) {
    return res.status(400).json({ message: '닉네임은 1~20자로 입력하세요.' });
  }

  const [exists] = await pool.query('SELECT user_id FROM users WHERE username = ?', [username]);
  if (exists.length > 0) {
    return res.status(409).json({ message: '이미 사용 중인 아이디입니다.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, password_hash, nickname, created_at) VALUES (?, ?, ?, NOW())',
    [username, passwordHash, nickname],
  );

  const user = { user_id: result.insertId, username, nickname };
  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
});

// 로그인: POST /api/auth/login  { username, password } → JWT 발급
router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];

  // 아이디/비밀번호 중 무엇이 틀렸는지 알려주지 않음 (보안)
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

// 내 정보: GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT user_id, username, nickname, created_at FROM users WHERE user_id = ?',
    [req.user.userId],
  );
  if (rows.length === 0) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
  res.json({ user: toPublicUser(rows[0]) });
});

function toPublicUser(u) {
  return { userId: u.user_id, username: u.username, nickname: u.nickname, createdAt: u.created_at };
}

export default router;
