import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getBookByIsbn, normalizeIsbn } from '../services/nlk.js';

const router = Router();

function validate(body) {
  const rating = Number(body.rating);
  const content = String(body.content || '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: '별점은 1~5 사이 정수여야 합니다.' };
  if (content.length < 1) return { error: '리뷰 내용을 입력하세요.' };
  if (content.length > 2000) return { error: '리뷰는 2000자 이하로 입력하세요.' };
  return { rating, content };
}

// 리뷰 작성: POST /api/reviews  { isbn, rating, content }
//   책이 books 에 없으면 이때 처음으로 외부 API 에서 가져와 저장
router.post('/', requireAuth, async (req, res) => {
  const isbn = normalizeIsbn(req.body.isbn);
  const v = validate(req.body);
  if (v.error) return res.status(400).json({ message: v.error });
  if (!isbn) return res.status(400).json({ message: 'ISBN 이 필요합니다.' });

  // 1) DB 에서 책 찾기
  let [rows] = await pool.query('SELECT book_id FROM books WHERE isbn = ?', [isbn]);
  let bookId = rows[0]?.book_id;

  // 2) 없으면 외부 API 로 조회해서 저장 (클라이언트가 보낸 책 정보는 신뢰하지 않음)
  if (!bookId) {
    const book = await getBookByIsbn(isbn);
    if (!book) return res.status(404).json({ message: '도서를 찾을 수 없습니다.' });

    // 동시에 두 명이 같은 책에 처음 리뷰를 쓰는 경우도 안전하게 처리
    const [result] = await pool.query(
      `INSERT INTO books (isbn, title, author, publisher, publish_date, cover_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE book_id = LAST_INSERT_ID(book_id)`,
      [book.isbn, book.title, book.author, book.publisher, book.publish_date, book.cover_url],
    );
    bookId = result.insertId;
  }

  // 3) 같은 책에 이미 쓴 리뷰가 있는지 확인
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

// 본인 리뷰인지 확인하는 공통 함수
async function findOwnReview(reviewId, userId) {
  const [rows] = await pool.query('SELECT review_id, user_id FROM reviews WHERE review_id = ?', [reviewId]);
  if (rows.length === 0) return { status: 404, message: '리뷰를 찾을 수 없습니다.' };
  if (rows[0].user_id !== userId) return { status: 403, message: '본인이 작성한 리뷰만 수정·삭제할 수 있습니다.' };
  return null;
}

// 리뷰 수정: PUT /api/reviews/:id  { rating, content }
router.put('/:id', requireAuth, async (req, res) => {
  const err = await findOwnReview(req.params.id, req.user.userId);
  if (err) return res.status(err.status).json({ message: err.message });

  const v = validate(req.body);
  if (v.error) return res.status(400).json({ message: v.error });

  await pool.query('UPDATE reviews SET rating = ?, content = ?, updated_at = NOW() WHERE review_id = ?', [
    v.rating,
    v.content,
    req.params.id,
  ]);
  res.json({ message: '수정되었습니다.' });
});

// 리뷰 삭제: DELETE /api/reviews/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const err = await findOwnReview(req.params.id, req.user.userId);
  if (err) return res.status(err.status).json({ message: err.message });

  await pool.query('DELETE FROM reviews WHERE review_id = ?', [req.params.id]);
  res.json({ message: '삭제되었습니다.' });
});

export default router;
