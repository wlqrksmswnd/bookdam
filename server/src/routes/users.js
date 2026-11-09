import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// users ⨝ reviews ⨝ books 를 JOIN 해서 회원 정보 + 리뷰 + 도서 정보를 한 번에 조회
const REVIEWS_BY_USER_SQL = `
  SELECT u.user_id, u.username, u.nickname, u.created_at AS user_created_at,
         r.review_id, r.rating, r.content, r.created_at, r.updated_at,
         b.book_id, b.isbn, b.title, b.author, b.publisher, b.cover_url
    FROM users u
    LEFT JOIN reviews r ON r.user_id = u.user_id
    LEFT JOIN books   b ON b.book_id = r.book_id
   WHERE u.user_id = ?
   ORDER BY r.created_at DESC`;

async function getUserWithReviews(userId) {
  const [rows] = await pool.query(REVIEWS_BY_USER_SQL, [userId]);
  if (rows.length === 0) return null;

  const first = rows[0];
  const user = {
    userId: first.user_id,
    nickname: first.nickname,
    createdAt: first.user_created_at,
  };

  // LEFT JOIN 이라 리뷰가 없는 회원은 review_id 가 NULL 인 행 1개가 나옴
  const reviews = rows
    .filter((r) => r.review_id !== null)
    .map((r) => ({
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

  return { user, reviews };
}

// 내 리뷰: GET /api/users/me/reviews
router.get('/me/reviews', requireAuth, async (req, res) => {
  const data = await getUserWithReviews(req.user.userId);
  if (!data) return res.status(404).json({ message: '회원 정보를 찾을 수 없습니다.' });
  res.json(data);
});

// 회원별 리뷰: GET /api/users/:userId/reviews
router.get('/:userId/reviews', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId)) return res.status(400).json({ message: '잘못된 회원 번호입니다.' });

  const data = await getUserWithReviews(userId);
  if (!data) return res.status(404).json({ message: '회원을 찾을 수 없습니다.' });
  res.json(data);
});

export default router;
