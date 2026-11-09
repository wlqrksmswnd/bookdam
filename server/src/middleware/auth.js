import jwt from 'jsonwebtoken';

// Authorization: Bearer <token> 헤더를 검사해 req.user 에 { userId, username, nickname } 저장
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: '로그인이 만료되었거나 유효하지 않습니다.' });
  }
}

export function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, nickname: user.nickname },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}
