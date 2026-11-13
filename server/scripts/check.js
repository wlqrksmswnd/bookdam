import 'dotenv/config';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pool from '../src/db.js';
import checkSchema from '../src/checkSchema.js';

const PORT = 4999;
const BASE = `http://localhost:${PORT}/api`;
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let passed = 0;
let failed = 0;
const ok = (name) => {
  passed++;
  console.log(`  ✔ ${name}`);
};
const fail = (name, detail) => {
  failed++;
  console.log(`  ✘ ${name}\n      → ${detail}`);
};
function expect(name, cond, detail) {
  cond ? ok(name) : fail(name, detail);
}

async function call(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function waitForServer(child) {
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  for (let i = 0; i < 50; i++) {
    if (child.exitCode !== null) throw new Error(`서버가 바로 종료됨:\n${output}`);
    const up = await fetch(`${BASE}/health`)
      .then((r) => r.ok)
      .catch(() => false);
    if (up) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`서버가 10초 안에 뜨지 않음:\n${output}`);
}

const tag = Date.now().toString(36).slice(-6);
const userA = { username: `chk_a_${tag}`, password: 'check-pass-1234', nickname: `검사A_${tag}` };
const userB = { username: `chk_b_${tag}`, password: 'check-pass-1234', nickname: `검사B_${tag}` };
const testIsbn = `979999${String(Date.now()).slice(-7)}`;
const createdUserIds = [];
let testBookId = null;
let server = null;

async function run() {
  console.log('\n[1] DB 연결 / 테이블 구조');
  try {
    await pool.query('SELECT 1');
    ok(`MySQL 연결 (${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME})`);
  } catch (err) {
    fail('MySQL 연결', err.message);
    return;
  }
  try {
    await checkSchema();
    ok('users / books / reviews 필요한 컬럼 모두 존재');
  } catch (err) {
    fail('테이블 구조', err.message);
    return;
  }

  const [idx] = await pool.query(
    `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = 'isbn' AND NON_UNIQUE = 0`,
  );
  expect('books.isbn UNIQUE 제약', idx[0].n > 0, 'isbn 에 UNIQUE 를 걸어야 같은 책이 중복 저장되지 않습니다.');

  const [ai] = await pool.query(
    `SELECT TABLE_NAME AS t FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND EXTRA LIKE '%auto_increment%'
        AND ((TABLE_NAME='users' AND COLUMN_NAME='user_id') OR (TABLE_NAME='books' AND COLUMN_NAME='book_id')
          OR (TABLE_NAME='reviews' AND COLUMN_NAME='review_id'))`,
  );
  const aiTables = ai.map((r) => r.t.toLowerCase());
  expect(
    'PK AUTO_INCREMENT (users, books, reviews)',
    ['users', 'books', 'reviews'].every((t) => aiTables.includes(t)),
    `AUTO_INCREMENT 가 켜진 테이블: ${aiTables.join(', ') || '없음'}`,
  );

  console.log('\n[2] 서버 기동');
  server = spawn(process.execPath, ['src/index.js'], {
    cwd: serverDir,
    env: { ...process.env, PORT: String(PORT) },
  });
  try {
    await waitForServer(server);
    ok(`검사용 서버 실행 (포트 ${PORT})`);
  } catch (err) {
    fail('서버 기동', err.message);
    return;
  }

  console.log('\n[3] 회원가입 / 로그인');
  let r = await call('POST', '/auth/register', { body: userA });
  expect('회원가입 A', r.status === 201 && r.data.token, `${r.status} ${JSON.stringify(r.data)}`);
  if (r.data.user) createdUserIds.push(r.data.user.userId);
  const idA = r.data.user?.userId;

  r = await call('POST', '/auth/register', { body: userB });
  expect('회원가입 B', r.status === 201, `${r.status} ${JSON.stringify(r.data)}`);
  if (r.data.user) createdUserIds.push(r.data.user.userId);
  const idB = r.data.user?.userId;
  const tokenB = r.data.token;

  r = await call('POST', '/auth/register', { body: userA });
  expect('같은 아이디 재가입 → 409', r.status === 409, `${r.status}`);

  r = await call('POST', '/auth/register', { body: { username: 'ab', password: '1', nickname: '' } });
  expect('잘못된 입력 → 400', r.status === 400, `${r.status}`);

  const [[row]] = await pool.query('SELECT password_hash, created_at FROM users WHERE user_id = ?', [idA]);
  expect('비밀번호가 해시로 저장됨', row?.password_hash?.startsWith('$2'), `저장값: ${row?.password_hash}`);
  expect('users.created_at 저장됨', Boolean(row?.created_at), 'created_at 이 비어 있음');

  r = await call('POST', '/auth/login', { body: { username: userA.username, password: 'wrong-password' } });
  expect('틀린 비밀번호 → 401', r.status === 401, `${r.status}`);

  r = await call('POST', '/auth/login', { body: { username: userA.username, password: userA.password } });
  expect('로그인 → JWT 발급', r.status === 200 && r.data.token, `${r.status} ${JSON.stringify(r.data)}`);
  const tokenA = r.data.token;

  r = await call('GET', '/auth/me', { token: tokenA });
  expect('내 정보 조회', r.status === 200 && r.data.user?.username === userA.username, JSON.stringify(r.data));

  r = await call('GET', '/auth/me', { token: 'invalid.token.value' });
  expect('잘못된 토큰 → 401', r.status === 401, `${r.status}`);

  console.log('\n[4] 도서 상세');
  const [ins] = await pool.query(
    `INSERT INTO books (isbn, title, author, publisher, publish_date, cover_url)
     VALUES (?, '[검사용] 북담 테스트 도서', '검사 저자', '검사 출판사', '2026-01-01', NULL)`,
    [testIsbn],
  );
  testBookId = ins.insertId;

  r = await call('GET', `/books/${testIsbn}`);
  expect(
    '도서 상세 (DB) + 리뷰 0개',
    r.status === 200 && r.data.book?.title?.includes('검사용') && r.data.stats?.reviewCount === 0,
    `${r.status} ${JSON.stringify(r.data)}`,
  );
  expect('publish_date 형식 YYYY-MM-DD', r.data.book?.publish_date === '2026-01-01', `받은 값: ${r.data.book?.publish_date}`);

  console.log('\n[5] 리뷰 작성');
  r = await call('POST', '/reviews', { body: { isbn: testIsbn, rating: 4, content: '검사' } });
  expect('로그인 없이 작성 → 401', r.status === 401, `${r.status}`);

  r = await call('POST', '/reviews', { token: tokenA, body: { isbn: testIsbn, rating: 9, content: '검사' } });
  expect('별점 범위 밖 → 400', r.status === 400, `${r.status}`);

  r = await call('POST', '/reviews', {
    token: tokenA,
    body: { isbn: testIsbn, rating: 4, content: '검사용 리뷰입니다.' },
  });
  expect('리뷰 작성 → 201', r.status === 201 && r.data.reviewId, `${r.status} ${JSON.stringify(r.data)}`);
  const reviewId = r.data.reviewId;

  r = await call('POST', '/reviews', { token: tokenA, body: { isbn: testIsbn, rating: 5, content: '두 번째' } });
  expect('같은 책 중복 리뷰 → 409', r.status === 409, `${r.status}`);

  r = await call('GET', `/books/${testIsbn}`);
  expect(
    '평균 별점 4.0 / 리뷰 1개',
    r.data.stats?.avgRating === 4 && r.data.stats?.reviewCount === 1,
    JSON.stringify(r.data.stats),
  );

  r = await call('GET', `/books/${testIsbn}/reviews`);
  expect(
    '도서별 리뷰 목록에 닉네임 포함',
    r.data.reviews?.length === 1 && r.data.reviews[0].nickname === userA.nickname,
    JSON.stringify(r.data),
  );
  const created = r.data.reviews?.[0];
  expect('reviews.created_at / updated_at 저장됨', created?.created_at && created?.updated_at, JSON.stringify(created));

  console.log('\n[6] 리뷰 수정');
  r = await call('PUT', `/reviews/${reviewId}`, { token: tokenB, body: { rating: 1, content: '남의 리뷰 수정' } });
  expect('다른 사람이 수정 → 403', r.status === 403, `${r.status}`);

  await new Promise((res) => setTimeout(res, 1100));
  r = await call('PUT', `/reviews/${reviewId}`, { token: tokenA, body: { rating: 5, content: '수정된 리뷰' } });
  expect('본인 수정 → 200', r.status === 200, `${r.status} ${JSON.stringify(r.data)}`);

  r = await call('GET', `/books/${testIsbn}/reviews`);
  const updated = r.data.reviews?.[0];
  expect('수정 내용 반영', updated?.content === '수정된 리뷰' && updated?.rating === 5, JSON.stringify(updated));
  expect('updated_at 갱신', updated?.updated_at !== updated?.created_at, JSON.stringify(updated));

  r = await call('PUT', '/reviews/999999999', { token: tokenA, body: { rating: 3, content: 'x' } });
  expect('없는 리뷰 수정 → 404', r.status === 404, `${r.status}`);

  console.log('\n[7] 내 리뷰 / 회원별 리뷰');
  r = await call('GET', '/users/me/reviews', { token: tokenA });
  expect(
    '내 리뷰 1개 + 도서 정보 JOIN',
    r.status === 200 && r.data.reviews?.length === 1 && r.data.reviews[0].book?.isbn === testIsbn,
    `${r.status} ${JSON.stringify(r.data)}`,
  );

  r = await call('GET', '/users/me/reviews');
  expect('로그인 없이 내 리뷰 → 401', r.status === 401, `${r.status}`);

  r = await call('GET', `/users/${idA}/reviews`);
  expect(
    '회원별 리뷰 (A) — 회원 정보 + 리뷰',
    r.status === 200 && r.data.user?.nickname === userA.nickname && r.data.reviews?.length === 1,
    JSON.stringify(r.data),
  );

  r = await call('GET', `/users/${idB}/reviews`);
  expect(
    '리뷰 없는 회원 (B) — 회원 정보만, 리뷰 0개',
    r.status === 200 && r.data.user?.nickname === userB.nickname && r.data.reviews?.length === 0,
    JSON.stringify(r.data),
  );

  r = await call('GET', '/users/999999999/reviews');
  expect('없는 회원 → 404', r.status === 404, `${r.status}`);

  console.log('\n[8] 리뷰 삭제');
  r = await call('DELETE', `/reviews/${reviewId}`, { token: tokenB });
  expect('다른 사람이 삭제 → 403', r.status === 403, `${r.status}`);

  r = await call('DELETE', `/reviews/${reviewId}`, { token: tokenA });
  expect('본인 삭제 → 200', r.status === 200, `${r.status}`);

  r = await call('GET', `/books/${testIsbn}`);
  expect('삭제 후 리뷰 0개', r.data.stats?.reviewCount === 0, JSON.stringify(r.data.stats));

  console.log('\n[8-0] 리뷰 정렬 / 내 리뷰 분리 / 별점 분포');
  await call('POST', '/reviews', { token: tokenA, body: { isbn: testIsbn, rating: 5, content: 'A 다시 작성' } });
  await call('POST', '/reviews', { token: tokenB, body: { isbn: testIsbn, rating: 2, content: 'B 작성' } });

  r = await call('GET', `/books/${testIsbn}/reviews?sort=rating_asc`);
  expect('별점 낮은순 → B 먼저', r.data.reviews?.[0]?.rating === 2 && r.data.total === 2, JSON.stringify(r.data));

  r = await call('GET', `/books/${testIsbn}/reviews?sort=rating_desc`);
  expect('별점 높은순 → A 먼저', r.data.reviews?.[0]?.rating === 5, JSON.stringify(r.data));

  r = await call('GET', `/books/${testIsbn}/reviews`, { token: tokenA });
  expect(
    '로그인 시 내 리뷰는 myReview 로 분리',
    r.data.myReview?.user_id === idA && r.data.reviews?.length === 1 && r.data.reviews[0].user_id === idB,
    JSON.stringify(r.data),
  );

  r = await call('GET', `/books/${testIsbn}/reviews?page=2`);
  expect('없는 페이지 → 빈 목록', r.status === 200 && r.data.reviews?.length === 0, JSON.stringify(r.data));

  r = await call('GET', `/books/${testIsbn}`);
  expect(
    '별점 분포 (5점 1, 2점 1)',
    r.data.stats?.distribution?.[5] === 1 && r.data.stats?.distribution?.[2] === 1,
    JSON.stringify(r.data.stats),
  );

  r = await call('GET', `/users/${idA}/reviews`);
  expect('회원별 리뷰 통계', r.data.stats?.reviewCount === 1 && r.data.stats?.avgRating === 5, JSON.stringify(r.data));

  console.log('\n[8-1] 회원 정보 수정 / 탈퇴');
  r = await call('PUT', '/auth/me', { token: tokenB, body: { currentPassword: 'wrong-password', nickname: 'x' } });
  expect('정보 수정 - 틀린 현재 비밀번호 → 400', r.status === 400, `${r.status}`);

  const newNick = `검사B2_${tag}`;
  r = await call('PUT', '/auth/me', {
    token: tokenB,
    body: { currentPassword: userB.password, nickname: newNick, newPassword: 'check-pass-5678' },
  });
  expect(
    '정보 수정 → 새 토큰 + 닉네임 반영',
    r.status === 200 && r.data.token && r.data.user?.nickname === newNick,
    JSON.stringify(r.data),
  );
  const tokenB2 = r.data.token;

  r = await call('POST', '/auth/login', { body: { username: userB.username, password: 'check-pass-5678' } });
  expect('바뀐 비밀번호로 로그인', r.status === 200, `${r.status}`);

  r = await call('DELETE', '/auth/me', { token: tokenB2, body: { password: userB.password } });
  expect('탈퇴 - 틀린 비밀번호 → 400', r.status === 400, `${r.status}`);

  r = await call('DELETE', '/auth/me', { token: tokenB2, body: { password: 'check-pass-5678' } });
  expect('회원 탈퇴 → 200', r.status === 200, `${r.status} ${JSON.stringify(r.data)}`);

  r = await call('GET', '/auth/me', { token: tokenB2 });
  expect('탈퇴한 회원의 토큰 → 401', r.status === 401, `${r.status}`);

  r = await call('POST', '/reviews', { token: tokenB2, body: { isbn: testIsbn, rating: 3, content: '탈퇴 후 작성' } });
  expect('탈퇴한 회원은 리뷰 작성 불가 → 401', r.status === 401, `${r.status}`);

  const badJson = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  expect('깨진 JSON → 400', badJson.status === 400, `${badJson.status}`);

  const noBody = await fetch(`${BASE}/auth/login`, { method: 'POST' });
  expect('본문 없는 요청도 500 이 아님 → 401', noBody.status === 401, `${noBody.status}`);

  console.log('\n[9] 도서 검색 (카카오 책 검색 API)');
  if (!process.env.KAKAO_API_KEY) {
    console.log('  - 건너뜀: KAKAO_API_KEY 가 비어 있음');
  } else {
    r = await call('GET', `/books/search?${new URLSearchParams({ q: '어린왕자', page: 1 })}`);
    expect('제목 검색', r.status === 200 && Array.isArray(r.data.books), `${r.status} ${JSON.stringify(r.data)}`);
    const withCover = (r.data.books || []).filter((b) => b.cover_url).length;
    console.log(`    (첫 페이지 ${r.data.books?.length ?? 0}권 중 표지 있는 책 ${withCover}권)`);
    const first = r.data.books?.[0];
    if (first) {
      r = await call('GET', `/books/${first.isbn}`);
      expect('검색 결과 도서 상세', r.status === 200 && r.data.book?.isbn === first.isbn, JSON.stringify(r.data));

      r = await call('GET', `/books/search?${new URLSearchParams({ q: first.isbn, type: 'isbn', page: 1 })}`);
      expect('ISBN 검색', r.status === 200 && r.data.books?.[0]?.isbn === first.isbn, JSON.stringify(r.data));
    }

    r = await call('GET', `/books/search?${new URLSearchParams({ q: '12345', type: 'isbn', page: 1 })}`);
    expect('잘못된 ISBN 검색 → 400', r.status === 400, `${r.status}`);

    r = await call('GET', '/books/9790000000001');
    expect('없는 ISBN 상세 → 404', r.status === 404, `${r.status} ${JSON.stringify(r.data)}`);
  }
}

async function cleanup() {
  try {
    if (createdUserIds.length) {
      await pool.query('DELETE FROM reviews WHERE user_id IN (?)', [createdUserIds]);
      await pool.query('DELETE FROM users WHERE user_id IN (?)', [createdUserIds]);
    }
    if (testBookId) {
      await pool.query('DELETE FROM reviews WHERE book_id = ?', [testBookId]);
      await pool.query('DELETE FROM books WHERE book_id = ?', [testBookId]);
    }
    console.log('\n검사용 데이터 삭제 완료');
  } catch (err) {
    console.log(`\n검사용 데이터 삭제 실패: ${err.message}`);
    console.log(`  직접 지울 것: users.username LIKE 'chk_%_${tag}', books.isbn = '${testIsbn}'`);
  }
  server?.kill();
  await pool.end();
}

try {
  await run();
} catch (err) {
  fail('예상하지 못한 오류', err.stack || err.message);
} finally {
  await cleanup();
  console.log(`\n결과: 통과 ${passed} / 실패 ${failed}`);
  process.exit(failed ? 1 : 0);
}
