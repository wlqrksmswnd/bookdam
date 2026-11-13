import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

function validateNickname(nickname) {
  if (nickname.length < 1 || nickname.length > 20) return '닉네임은 1~20자로 입력하세요.';
  return null;
}

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
  const nicknameError = validateNickname(nickname);
  if (nicknameError) return res.status(400).json({ message: nicknameError });

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

router.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }

  res.json({ token: signToken(user), user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT user_id, username, nickname, created_at FROM users WHERE user_id = ?',
    [req.user.userId],
  );
  if (rows.length === 0) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });

  const [[stats]] = await pool.query(
    'SELECT COUNT(*) AS reviewCount, AVG(rating) AS avgRating FROM reviews WHERE user_id = ?',
    [req.user.userId],
  );

  res.json({
    user: toPublicUser(rows[0]),
    stats: {
      reviewCount: Number(stats.reviewCount),
      avgRating: stats.avgRating == null ? null : Number(stats.avgRating),
    },
  });
});

router.put('/me', requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const nickname = String(req.body.nickname || '').trim();
  const newPassword = String(req.body.newPassword || '');

  if (!currentPassword) return res.status(400).json({ message: '현재 비밀번호를 입력하세요.' });
  const nicknameError = validateNickname(nickname);
  if (nicknameError) return res.status(400).json({ message: nicknameError });
  if (newPassword && newPassword.length < 8) {
    return res.status(400).json({ message: '새 비밀번호는 8자 이상이어야 합니다.' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [req.user.userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(400).json({ message: '현재 비밀번호가 올바르지 않습니다.' });
  }

  const passwordHash = newPassword ? await bcrypt.hash(newPassword, 10) : user.password_hash;
  await pool.query('UPDATE users SET nickname = ?, password_hash = ? WHERE user_id = ?', [
    nickname,
    passwordHash,
    user.user_id,
  ]);

  const updated = { ...user, nickname };
  res.json({ token: signToken(updated), user: toPublicUser(updated) });
});

router.delete('/me', requireAuth, async (req, res) => {
  const password = String(req.body.password || '');
  if (!password) return res.status(400).json({ message: '비밀번호를 입력하세요.' });

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE user_id = ?', [req.user.userId]);
  if (rows.length === 0) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
  if (!(await bcrypt.compare(password, rows[0].password_hash))) {
    return res.status(400).json({ message: '비밀번호가 올바르지 않습니다.' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM reviews WHERE user_id = ?', [req.user.userId]);
    await conn.query('DELETE FROM users WHERE user_id = ?', [req.user.userId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  res.json({ message: '회원 탈퇴가 완료되었습니다.' });
});

function toPublicUser(u) {
  return { userId: u.user_id, username: u.username, nickname: u.nickname, createdAt: u.created_at };
}

export default router;
