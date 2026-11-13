import { Router } from 'express';
import pool from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { searchBooks, getBookByIsbn, normalizeIsbn } from '../services/kakao.js';
import { parseReviewListQuery, pageInfo } from '../listQuery.js';

const router = Router();

const PAGE_SIZE = 12;

router.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const type = req.query.type === 'isbn' ? 'isbn' : 'title';
  const page = Math.max(1, Number(req.query.page) || 1);

  if (!q) return res.status(400).json({ message: '검색어를 입력하세요.' });
  if (type === 'isbn' && ![10, 13].includes(normalizeIsbn(q).length)) {
    return res.status(400).json({ message: 'ISBN 은 숫자 10자리 또는 13자리로 입력하세요. (하이픈은 있어도 됩니다)' });
  }

  res.json(await searchBooks({ query: q, type, page, size: PAGE_SIZE }));
});

const EMPTY_STATS = { avgRating: null, reviewCount: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

async function findStoredBook(isbn) {
  const [rows] = await pool.query(
    `SELECT b.*, ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(r.review_id) AS review_count
       FROM books b
       LEFT JOIN reviews r ON r.book_id = b.book_id
      WHERE b.isbn = ?
      GROUP BY b.book_id`,
    [isbn],
  );
  if (rows.length === 0) return null;

  const { avg_rating, review_count, ...book } = rows[0];

  const [dist] = await pool.query(
    'SELECT rating, COUNT(*) AS n FROM reviews WHERE book_id = ? GROUP BY rating',
    [book.book_id],
  );
  const distribution = { ...EMPTY_STATS.distribution };
  for (const row of dist) distribution[row.rating] = Number(row.n);

  return {
    book,
    stats: {
      avgRating: avg_rating === null ? null : Number(avg_rating),
      reviewCount: Number(review_count),
      distribution,
    },
  };
}

function withDetail(book, detail) {
  if (!detail) return book;
  return {
    ...book,
    translator: detail.translator,
    description: detail.description,
    detail_url: detail.detail_url,
  };
}

router.get('/:isbn', async (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);

  const stored = await findStoredBook(isbn);
  if (stored) {
    const detail = await getBookByIsbn(stored.book.isbn).catch(() => null);
    return res.json({ book: withDetail(stored.book, detail), stats: stored.stats });
  }

  const book = await getBookByIsbn(isbn);
  if (!book) return res.status(404).json({ message: '도서를 찾을 수 없습니다.' });

  if (book.isbn !== isbn) {
    const storedByCanonical = await findStoredBook(book.isbn);
    if (storedByCanonical) {
      return res.json({ book: withDetail(storedByCanonical.book, book), stats: storedByCanonical.stats });
    }
  }

  res.json({ book, stats: EMPTY_STATS });
});

const REVIEW_COLUMNS = `r.review_id, r.rating, r.content, r.created_at, r.updated_at, u.user_id, u.nickname`;

router.get('/:isbn/reviews', optionalAuth, async (req, res) => {
  const isbn = normalizeIsbn(req.params.isbn);
  const list = parseReviewListQuery(req.query);
  const myId = req.user?.userId ?? 0;

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
       FROM reviews r
       JOIN books b ON b.book_id = r.book_id
      WHERE b.isbn = ? AND r.user_id <> ?`,
    [isbn, myId],
  );

  const [reviews] = await pool.query(
    `SELECT ${REVIEW_COLUMNS}
       FROM reviews r
       JOIN books b ON b.book_id = r.book_id
       JOIN users u ON u.user_id = r.user_id
      WHERE b.isbn = ? AND r.user_id <> ?
      ORDER BY ${list.orderBy}
      LIMIT ? OFFSET ?`,
    [isbn, myId, list.limit, list.offset],
  );

  let myReview = null;
  if (req.user) {
    const [mine] = await pool.query(
      `SELECT ${REVIEW_COLUMNS}
         FROM reviews r
         JOIN books b ON b.book_id = r.book_id
         JOIN users u ON u.user_id = r.user_id
        WHERE b.isbn = ? AND r.user_id = ?`,
      [isbn, req.user.userId],
    );
    myReview = mine[0] || null;
  }

  res.json({ reviews, myReview, ...pageInfo(Number(total), list) });
});

export default router;
