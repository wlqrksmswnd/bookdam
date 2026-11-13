import jwt from 'jsonwebtoken';
import pool from '../db.js';

async function resolveUser(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return { error: '로그인이 필요합니다.' };

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { error: '로그인이 만료되었거나 유효하지 않습니다.' };
  }

  const [rows] = await pool.query('SELECT user_id, username, nickname FROM users WHERE user_id = ?', [
    payload.userId,
  ]);
  if (rows.length === 0) return { error: '탈퇴했거나 존재하지 않는 회원입니다. 다시 로그인해 주세요.' };

  return { user: { userId: rows[0].user_id, username: rows[0].username, nickname: rows[0].nickname } };
}

export async function requireAuth(req, res, next) {
  const { user, error } = await resolveUser(req);
  if (error) return res.status(401).json({ message: error });
  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  const { user } = await resolveUser(req);
  req.user = user || null;
  next();
}

export function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, nickname: user.nickname },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}
