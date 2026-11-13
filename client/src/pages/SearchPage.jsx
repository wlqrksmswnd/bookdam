import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import BookCover from '../components/BookCover.jsx'
import Dropdown from '../components/Dropdown.jsx'
import Pagination from '../components/Pagination.jsx'

const SEARCH_TYPES = [
  { value: 'title', label: '제목', placeholder: '도서 제목을 입력하세요' },
  { value: 'isbn', label: 'ISBN', placeholder: 'ISBN 10자리 또는 13자리를 입력하세요' },
]

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const type = params.get('type') === 'isbn' ? 'isbn' : 'title'
  const page = Number(params.get('page')) || 1
  const requestKey = q ? `${type}|${page}|${q}` : ''

  const [input, setInput] = useState(q)
  const [searchType, setSearchType] = useState(type)
  const [synced, setSynced] = useState({ q, type })
  if (synced.q !== q || synced.type !== type) {
    setSynced({ q, type })
    setInput(q)
    setSearchType(type)
  }

  const [response, setResponse] = useState({ key: '', data: null, error: '' })

  useEffect(() => {
    if (!requestKey) return
    let ignore = false
    api
      .searchBooks({ q, type, page })
      .then((data) => !ignore && setResponse({ key: requestKey, data, error: '' }))
      .catch((err) => !ignore && setResponse({ key: requestKey, data: null, error: err.message }))
    return () => {
      ignore = true
    }
  }, [requestKey, q, type, page])

  const current = response.key === requestKey ? response : null
  const loading = Boolean(requestKey) && !current
  const result = current?.data
  const error = current?.error

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setParams({ q: input.trim(), type: searchType, page: '1' })
  }

  const totalPages = result?.totalPages ?? 0
  const goPage = (p) => {
    setParams({ q, type, page: String(p) })
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      <section className="py-10 text-center">
        <h1 className="font-serif text-4xl font-bold">책에 대한 이야기, 북담</h1>
        <p className="mt-2 text-stone-500">읽은 책을 찾아 별점과 리뷰를 남겨보세요.</p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-xl gap-2">
          <Dropdown
            options={SEARCH_TYPES}
            value={searchType}
            onChange={setSearchType}
            ariaLabel="검색 기준"
            className="w-24 shrink-0 sm:w-28"
          />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={SEARCH_TYPES.find((t) => t.value === searchType).placeholder}
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-accent focus:outline-none"
          />
          <button className="shrink-0 rounded-lg bg-ink px-5 text-paper hover:bg-stone-700">검색</button>
        </form>
      </section>

      {loading && <p className="text-center text-stone-500">검색 중…</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {result && (
        <>
          <p className="mb-4 text-sm text-stone-500">
            &lsquo;{q}&rsquo; 검색 결과 {result.total.toLocaleString()}건
          </p>

          {result.books.length === 0 ? (
            <p className="py-10 text-center text-stone-500">검색 결과가 없습니다.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
              {result.books.map((b) => (
                <li key={b.isbn}>
                  <Link to={`/books/${b.isbn}`} className="group block">
                    <BookCover
                      src={b.cover_url}
                      title={b.title}
                      className="w-full transition group-hover:-translate-y-1"
                    />
                    <h3 className="mt-2 line-clamp-2 font-serif font-bold group-hover:text-accent">{b.title}</h3>
                    <p className="line-clamp-1 text-sm text-stone-500">{b.author}</p>
                    <p className="text-xs text-stone-400">{b.publisher}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={goPage} className="mt-10" />
        </>
      )}
    </div>
  )
}
