import { Router } from 'express';
import pool from '../db.js';
import { searchBooks, getBookByIsbn, normalizeIsbn } from '../services/nlk.js';

const router = Router();

// 도서 제목 검색: GET /api/books/search?q=어린왕자&page=1
//   외부 API 결과를 그대로 돌려주고 DB 에는 저장하지 않음
router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const page = Math.max(1, Number(req.query.page) || 1);

  if (!q) return res.status(400).json({ message: '검색어를 입력하세요.' });

  const result = await searchBooks({ query: q, type: 'title', page, size: 12 });
  res.json(result);
});

// 도서 상세: GET /api/books/:isbn
//   DB 에 있으면(리뷰가 있는 책) DB 값을, 없으면 외부 API 값을 사용
//   평균 별점/리뷰 수도 함께 반환
router.get('/:isbn', async (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);

  const [rows] = await pool.query(
    `SELECT b.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.review_id) AS review_count
       FROM books b
       LEFT JOIN reviews r ON r.book_id = b.book_id
      WHERE b.isbn = ?
      GROUP BY b.book_id`,
    [isbn],
  );

  if (rows.length > 0) {
    const { avg_rating, review_count, ...book } = rows[0];
    return res.json({
      book,
      stats: { avgRating: avg_rating === null ? null : Number(avg_rating), reviewCount: Number(review_count) },
    });
  }

  const book = await getBookByIsbn(isbn);
  if (!book) return res.status(404).json({ message: '도서를 찾을 수 없습니다.' });
  res.json({ book, stats: { avgRating: null, reviewCount: 0 } });
});

// 도서별 리뷰 목록: GET /api/books/:isbn/reviews
router.get('/:isbn/reviews', async (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);
  const [rows] = await pool.query(
    `SELECT r.review_id, r.rating, r.content, r.created_at, r.updated_at,
            u.user_id, u.nickname
       FROM reviews r
       JOIN books b ON b.book_id = r.book_id
       JOIN users u ON u.user_id = r.user_id
      WHERE b.isbn = ?
      ORDER BY r.created_at DESC`,
    [isbn],
  );
  res.json({ reviews: rows });
});

export default router;
