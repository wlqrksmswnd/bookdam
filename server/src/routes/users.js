import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { parseReviewListQuery, pageInfo } from '../listQuery.js';

const router = Router();

async function getUserWithReviews(userId, query) {
  const [users] = await pool.query(
    `SELECT u.user_id, u.nickname, u.created_at,
            COUNT(r.review_id) AS review_count, ROUND(AVG(r.rating), 1) AS avg_rating
       FROM users u
       LEFT JOIN reviews r ON r.user_id = u.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id`,
    [userId],
  );
  if (users.length === 0) return null;

  const u = users[0];
  const list = parseReviewListQuery(query);

  const [rows] = await pool.query(
    `SELECT r.review_id, r.rating, r.content, r.created_at, r.updated_at,
            b.book_id, b.isbn, b.title, b.author, b.publisher, b.cover_url
       FROM reviews r
       JOIN books b ON b.book_id = r.book_id
      WHERE r.user_id = ?
      ORDER BY ${list.orderBy}
      LIMIT ? OFFSET ?`,
    [userId, list.limit, list.offset],
  );

  const reviews = rows.map((r) => ({
    review_id: r.review_id,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
    updated_at: r.updated_at,
    book: {
      book_id: r.book_id,
      isbn: r.isbn,
      title: r.title,
      author: r.author,
      publisher: r.publisher,
      cover_url: r.cover_url,
    },
  }));

  const reviewCount = Number(u.review_count);
  return {
    user: { userId: u.user_id, nickname: u.nickname, createdAt: u.created_at },
    stats: { reviewCount, avgRating: u.avg_rating === null ? null : Number(u.avg_rating) },
    reviews,
    ...pageInfo(reviewCount, list),
  };
}

router.get('/me/reviews', requireAuth, async (req, res) => {
  const data = await getUserWithReviews(req.user.userId, req.query);
  if (!data) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
  res.json(data);
});

router.get('/:userId/reviews', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ message: '잘못된 회원 번호입니다.' });

  const data = await getUserWithReviews(userId, req.query);
  if (!data) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  res.json(data);
});

export default router;
