// 국립중앙도서관 ISBN 서지정보 API 래퍼
// 문서: https://www.nl.go.kr/NL/contents/N31101030500.do
const BASE_URL = 'https://www.nl.go.kr/seoji/SearchApi.do';

// "20240115" → "2024-01-15", 형식이 안 맞으면 null
function toDate(value) {
  const s = String(value || '').replace(/\D/g, '');
  if (s.length !== 8) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

// ISBN 에서 하이픈/공백 제거
export function normalizeIsbn(isbn) {
  return String(isbn || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

// API 응답 한 건 → books 테이블 형태
function toBook(doc) {
  return {
    isbn: normalizeIsbn(doc.EA_ISBN),
    title: (doc.TITLE || '').trim(),
    author: (doc.AUTHOR || '').trim() || null,
    publisher: (doc.PUBLISHER || '').trim() || null,
    publish_date: toDate(doc.REAL_PUBLISH_DATE) || toDate(doc.PUBLISH_PREDATE),
    cover_url: (doc.TITLE_URL || '').trim() || null,
  };
}

async function request(params) {
  const key = process.env.NLK_CERT_KEY;
  if (!key) throw new Error('NLK_CERT_KEY 가 .env 에 설정되지 않았습니다.');

  const url = new URL(BASE_URL);
  url.search = new URLSearchParams({
    cert_key: key,
    result_style: 'json',
    ...params,
  }).toString();

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`국립중앙도서관 API 오류 (HTTP ${res.status})`);

  const data = await res.json();
  if (data.RESULT === 'ERROR' || data.ERR_CODE) {
    throw new Error(`국립중앙도서관 API 오류: ${data.ERR_MESSAGE || data.ERR_CODE}`);
  }
  return data;
}

// 제목 또는 ISBN 으로 검색
export async function searchBooks({ query, type = 'title', page = 1, size = 10 }) {
  const params = { page_no: String(page), page_size: String(size) };
  if (type === 'isbn') params.isbn = normalizeIsbn(query);
  else params.title = query;

  const data = await request(params);
  const books = (data.docs || [])
    .map(toBook)
    .filter((b) => b.isbn && b.title); // ISBN 없는 항목은 리뷰 대상이 될 수 없으므로 제외

  return {
    total: Number(data.TOTAL_COUNT) || 0,
    page: Number(data.PAGE_NO) || page,
    books,
  };
}

// ISBN 한 권 조회 (없으면 null)
export async function getBookByIsbn(isbn) {
  const { books } = await searchBooks({ query: isbn, type: 'isbn', page: 1, size: 1 });
  return books[0] || null;
}
