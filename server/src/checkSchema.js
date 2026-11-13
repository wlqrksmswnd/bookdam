import pool from './db.js';

const REQUIRED = {
  users: ['user_id', 'username', 'password_hash', 'nickname', 'created_at'],
  books: ['book_id', 'isbn', 'title', 'author', 'publisher', 'publish_date', 'cover_url'],
  reviews: ['review_id', 'user_id', 'book_id', 'rating', 'content', 'created_at', 'updated_at'],
};

export default async function checkSchema() {
  const [rows] = await pool.query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
    [Object.keys(REQUIRED)],
  );

  const existing = new Set(rows.map((r) => `${r.t.toLowerCase()}.${r.c.toLowerCase()}`));
  const missing = Object.entries(REQUIRED).flatMap(([table, cols]) =>
    cols.filter((c) => !existing.has(`${table}.${c}`)).map((c) => `${table}.${c}`),
  );

  if (missing.length > 0) {
    throw new Error(`DB 에 다음 컬럼이 없습니다 (DB_NAME 이 맞는지도 확인하세요): ${missing.join(', ')}`);
  }
}
