const BASE_URL = 'https://dapi.kakao.com/v3/search/book';
const MAX_PAGE = 50;

export function normalizeIsbn(isbn) {
  return String(isbn || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function isbnList(value) {
  return String(value || '')
    .split(/\s+/)
    .map(normalizeIsbn)
    .filter(Boolean);
}

function pickIsbn(value) {
  const list = isbnList(value);
  return list.find((s) => s.length === 13) || list[0] || '';
}

function toDate(value) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value || ''));
  return m ? m[1] : null;
}

function toCoverUrl(thumbnail) {
  const thumb = String(thumbnail || '').trim();
  if (!thumb) return null;
  try {
    const original = new URL(thumb).searchParams.get('fname');
    if (original && /^https?:\/\/[^/]*daumcdn\.net\//.test(original)) {
      return original.replace(/^http:/, 'https:');
    }
  } catch {
    return thumb;
  }
  return thumb;
}

function toBook(doc) {
  return {
    isbn: pickIsbn(doc.isbn),
    title: (doc.title || '').trim(),
    author: (doc.authors || []).join(', ') || null,
    publisher: (doc.publisher || '').trim() || null,
    publish_date: toDate(doc.datetime),
    cover_url: toCoverUrl(doc.thumbnail),
  };
}

function toDetail(doc) {
  return {
    ...toBook(doc),
    translator: (doc.translators || []).join(', ') || null,
    description: (doc.contents || '').trim() || null,
    detail_url: doc.url || null,
  };
}

function apiError(message) {
  const err = new Error(message);
  err.status = 502;
  return err;
}

async function request(params) {
  const key = process.env.KAKAO_API_KEY;
  if (!key) throw new Error('KAKAO_API_KEY 가 .env 에 설정되지 않았습니다.');

  const url = new URL(BASE_URL);
  url.search = new URLSearchParams(params).toString();

  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `KakaoAK ${key}` },
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw apiError('도서 검색 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`카카오 책 검색 API 오류 (HTTP ${res.status})`, data);
    if (res.status === 429) throw apiError('검색 요청이 많아 잠시 후 다시 시도해 주세요.');
    throw apiError('도서 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
  }
  return data;
}

export async function searchBooks({ query, type = 'title', page = 1, size = 12 }) {
  const safePage = Math.min(Math.max(1, page), MAX_PAGE);
  const data = await request({
    query: type === 'isbn' ? normalizeIsbn(query) : query,
    target: type,
    page: String(safePage),
    size: String(size),
  });

  const books = (data.documents || []).map(toBook).filter((b) => b.isbn && b.title);
  const pageable = Math.min(Number(data.meta?.pageable_count) || 0, MAX_PAGE * size);

  return {
    total: Number(data.meta?.total_count) || 0,
    totalPages: Math.ceil(pageable / size),
    page: safePage,
    books,
  };
}

export async function getBookByIsbn(isbn) {
  const target = normalizeIsbn(isbn);
  if (![10, 13].includes(target.length)) return null;

  const data = await request({ query: target, target: 'isbn', page: '1', size: '5' });
  const doc = (data.documents || []).find((d) => isbnList(d.isbn).includes(target));
  if (!doc) return null;

  const book = toDetail(doc);
  return book.isbn && book.title ? book : null;
}
