// fetch 래퍼: JWT 자동 첨부 + 에러 메시지 통일
const TOKEN_KEY = 'bookdam_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || '요청에 실패했습니다.')
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  // 인증
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),

  // 도서
  searchBooks: ({ q, page }) => request(`/books/search?${new URLSearchParams({ q, page })}`),
  getBook: (isbn) => request(`/books/${isbn}`),
  getBookReviews: (isbn) => request(`/books/${isbn}/reviews`),

  // 리뷰
  createReview: (body) => request('/reviews', { method: 'POST', body }),
  updateReview: (id, body) => request(`/reviews/${id}`, { method: 'PUT', body }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  // 회원별 리뷰
  myReviews: () => request('/users/me/reviews'),
  userReviews: (userId) => request(`/users/${userId}/reviews`),
}
