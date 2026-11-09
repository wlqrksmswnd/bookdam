import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import BookCover from '../components/BookCover.jsx'

const PAGE_SIZE = 12

// 도서 제목 검색. 검색 조건을 URL(?q=&page=)에 저장해서 뒤로가기/새로고침해도 결과 유지
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') || ''
  const page = Number(params.get('page')) || 1

  const [input, setInput] = useState(q)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!q) return
    let ignore = false
    setLoading(true)
    setError('')
    api
      .searchBooks({ q, page })
      .then((data) => !ignore && setResult(data))
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [q, page])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setParams({ q: input.trim(), page: '1' })
  }

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0
  const goPage = (p) => setParams({ q, page: String(p) })

  return (
    <div>
      <section className="py-10 text-center">
        <h1 className="font-serif text-4xl font-bold">책에 대한 이야기, 북담</h1>
        <p className="mt-2 text-stone-500">읽은 책을 찾아 별점과 리뷰를 남겨보세요.</p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="도서 제목을 입력하세요"
            className="flex-1 rounded-lg border border-stone-300 bg-white px-4 py-3 focus:border-accent focus:outline-none"
          />
          <button className="rounded-lg bg-ink px-5 text-paper hover:bg-stone-700">검색</button>
        </form>
      </section>

      {loading && <p className="text-center text-stone-500">검색 중…</p>}
      {error && <p className="text-center text-red-600">{error}</p>}

      {!loading && result && (
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
                    <BookCover src={b.cover_url} title={b.title} className="w-full transition group-hover:-translate-y-1" />
                    <h3 className="mt-2 line-clamp-2 font-serif font-bold group-hover:text-accent">{b.title}</h3>
                    <p className="line-clamp-1 text-sm text-stone-500">{b.author}</p>
                    <p className="text-xs text-stone-400">{b.publisher}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4 text-sm">
              <button disabled={page <= 1} onClick={() => goPage(page - 1)} className="disabled:opacity-30">
                ← 이전
              </button>
              <span className="text-stone-500">
                {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => goPage(page + 1)} className="disabled:opacity-30">
                다음 →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
