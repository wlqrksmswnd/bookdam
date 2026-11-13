const TOKEN_KEY = 'bookdam_token'
export const LOGOUT_EVENT = 'bookdam:logout'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error('서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.')
    err.status = 0
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.clear()
      window.dispatchEvent(new Event(LOGOUT_EVENT))
    }
    const err = new Error(data.message || '요청에 실패했습니다.')
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: () => request('/auth/me'),
  updateMe: (body) => request('/auth/me', { method: 'PUT', body }),
  deleteAccount: (password) => request('/auth/me', { method: 'DELETE', body: { password } }),

  searchBooks: ({ q, type, page }) => request(`/books/search?${new URLSearchParams({ q, type, page })}`),
  getBook: (isbn) => request(`/books/${isbn}`),
  getBookReviews: (isbn, { sort, page }) => request(`/books/${isbn}/reviews?${new URLSearchParams({ sort, page })}`),

  createReview: (body) => request('/reviews', { method: 'POST', body }),
  updateReview: (id, body) => request(`/reviews/${id}`, { method: 'PUT', body }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),

  myReviews: ({ sort, page }) => request(`/users/me/reviews?${new URLSearchParams({ sort, page })}`),
  userReviews: (userId, { sort, page }) => request(`/users/${userId}/reviews?${new URLSearchParams({ sort, page })}`),
}
