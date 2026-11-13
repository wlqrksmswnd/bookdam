import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getBookByIsbn, normalizeIsbn } from '../services/kakao.js';

const router = Router();

function validate(body) {
  const rating = Number(body.rating);
  const content = String(body.content || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: '별점은 1~5 사이 정수여야 합니다.' };
  if (content.length < 1) return { error: '리뷰 내용을 입력하세요.' };
  if (content.length > 2000) return { error: '리뷰는 2000자 이하로 입력하세요.' };
  return { rating, content };
}

router.post('/', requireAuth, async (req, res) => {
  const isbn = normalizeIsbn(req.body.isbn);
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ message: v.error });
  if (!isbn) return res.status(400).json({ message: 'ISBN 이 필요합니다.' });

  let [rows] = await pool.query('SELECT book_id FROM books WHERE isbn = ?', [isbn]);
  let bookId = rows[0]?.book_id;

  if (!bookId) {
    const book = await getBookByIsbn(isbn);
    if (!book) return res.status(404).json({ message: '도서를 찾을 수 없습니다.' });

    const [result] = await pool.query(
      `INSERT INTO books (isbn, title, author, publisher, publish_date, cover_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE book_id = LAST_INSERT_ID(book_id)`,
      [book.isbn, book.title, book.author, book.publisher, book.publish_date, book.cover_url],
    );
    bookId = result.insertId;
  }

  [rows] = await pool.query('SELECT review_id FROM reviews WHERE user_id = ? AND book_id = ?', [
    req.user.userId,
    bookId,
  ]);
  if (rows.length > 0) {
    return res.status(409).json({ message: '이미 이 책에 리뷰를 작성했습니다. 기존 리뷰를 수정해 주세요.' });
  }

  const [result] = await pool.query(
    'INSERT INTO reviews (user_id, book_id, rating, content, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [req.user.userId, bookId, v.rating, v.content],
  );
  res.status(201).json({ reviewId: result.insertId });
});

async function findOwnReview(reviewId, userId) {
  if (!Number.isInteger(reviewId) || reviewId < 1) return { status: 404, message: '리뷰를 찾을 수 없습니다.' };
  const [rows] = await pool.query('SELECT review_id, user_id FROM reviews WHERE review_id = ?', [reviewId]);
  if (rows.length === 0) return { status: 404, message: '리뷰를 찾을 수 없습니다.' };
  if (rows[0].user_id !== userId) return { status: 403, message: '본인이 작성한 리뷰만 수정·삭제할 수 있습니다.' };
  return null;
}

router.put('/:id', requireAuth, async (req, res) => {
  const reviewId = Number(req.params.id);
  const err = await findOwnReview(reviewId, req.user.userId);
  if (err) return res.status(err.status).json({ message: err.message });

  const v = validate(req.body);
  if (v.error) return res.status(400).json({ message: v.error });

  await pool.query('UPDATE reviews SET rating = ?, content = ?, updated_at = NOW() WHERE review_id = ?', [
    v.rating,
    v.content,
    reviewId,
  ]);
  res.json({ message: '수정되었습니다.' });
});

router.delete('/:id', requireAuth, async (req, res) => {
  const reviewId = Number(req.params.id);
  const err = await findOwnReview(reviewId, req.user.userId);
  if (err) return res.status(err.status).json({ message: err.message });

  await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
  res.json({ message: '삭제되었습니다.' });
});

export default router;
