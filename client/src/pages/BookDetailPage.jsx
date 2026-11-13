import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import BookCover from '../components/BookCover.jsx'
import StarRating from '../components/StarRating.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import ReviewCard from '../components/ReviewCard.jsx'
import BackButton from '../components/BackButton.jsx'
import ErrorPage from '../components/ErrorPage.jsx'
import Dropdown from '../components/Dropdown.jsx'
import Pagination from '../components/Pagination.jsx'
import { REVIEW_SORTS, readListParams } from '../reviewList.js'

export default function BookDetailPage() {
  const { isbn } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { sort, page } = readListParams(params)
  const reviewsRef = useRef(null)

  const [bookState, setBookState] = useState({ isbn: null })
  const [reviewState, setReviewState] = useState({ key: '' })
  const reviewKey = `${isbn}|${sort}|${page}|${user?.userId ?? 0}`
  const bookReady = bookState.isbn === isbn && Boolean(bookState.book)

  useEffect(() => {
    let ignore = false
    api
      .getBook(isbn)
      .then((d) => {
        if (ignore) return
        if (d.book.isbn !== isbn) navigate(`/books/${d.book.isbn}`, { replace: true })
        else setBookState({ isbn, book: d.book, stats: d.stats })
      })
      .catch((err) => !ignore && setBookState({ isbn, error: err }))
    return () => {
      ignore = true
    }
  }, [isbn, navigate])

  useEffect(() => {
    if (!bookReady) return
    let ignore = false
    api
      .getBookReviews(isbn, { sort, page })
      .then((data) => !ignore && setReviewState({ key: reviewKey, data }))
      .catch((err) => !ignore && setReviewState({ key: reviewKey, error: err }))
    return () => {
      ignore = true
    }
  }, [bookReady, isbn, sort, page, reviewKey])

  const reviews = reviewState.key === reviewKey ? reviewState.data : null

  useEffect(() => {
    if (reviews && page > reviews.totalPages) {
      setParams({ sort, page: String(reviews.totalPages) }, { replace: true })
    }
  }, [reviews, page, sort, setParams])

  const reload = async () => {
    const [d, r] = await Promise.all([api.getBook(isbn), api.getBookReviews(isbn, { sort, page })])
    setBookState({ isbn, book: d.book, stats: d.stats })
    setReviewState({ key: reviewKey, data: r })
  }

  const changeList = (next) => {
    setParams({ sort, page: '1', ...next })
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const current = bookState.isbn === isbn ? bookState : null

  if (current?.error) {
    const notFound = current.error.status === 404
    return (
      <ErrorPage
        status={current.error.status}
        title={notFound ? '책을 찾을 수 없어요' : undefined}
        description={notFound ? 'ISBN 이 올바른지 확인하거나, 검색으로 다시 찾아보세요.' : undefined}
      />
    )
  }
  if (!current) return <p className="text-center text-stone-500">불러오는 중…</p>

  const { book, stats } = current
  const myReview = reviews?.myReview
  const othersEmpty = reviews && reviews.total === 0

  return (
    <div className="space-y-10">
      <BackButton />
      <section className="-mt-6 flex flex-col gap-8 sm:flex-row">
        <BookCover src={book.cover_url} title={book.title} className="w-48 shrink-0 self-center sm:self-start" />
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
          <dl className="grid grid-cols-[5rem_1fr] gap-y-1 text-sm">
            <dt className="text-stone-500">저자</dt>
            <dd>{book.author || '-'}</dd>
            {book.translator && (
              <>
                <dt className="text-stone-500">옮긴이</dt>
                <dd>{book.translator}</dd>
              </>
            )}
            <dt className="text-stone-500">출판사</dt>
            <dd>{book.publisher || '-'}</dd>
            <dt className="text-stone-500">출간일</dt>
            <dd>{book.publish_date || '-'}</dd>
            <dt className="text-stone-500">ISBN</dt>
            <dd>{book.isbn}</dd>
          </dl>
          <RatingSummary stats={stats} />
        </div>
      </section>

      {book.description && (
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-bold">책 소개</h2>
          <p className="whitespace-pre-line leading-relaxed text-stone-700">
            {book.description}
            {/[.!?。"'”’]$/.test(book.description) ? '' : '…'}
          </p>
          {book.detail_url && (
            <a
              href={book.detail_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-accent underline"
            >
              다음 책에서 자세히 보기 ↗
            </a>
          )}
        </section>
      )}

      <section ref={reviewsRef} className="scroll-mt-20 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-bold">
            리뷰 <span className="text-base font-normal text-stone-500">{stats.reviewCount}개</span>
          </h2>
          {reviews && reviews.total > 1 && (
            <Dropdown
              options={REVIEW_SORTS}
              value={sort}
              onChange={(value) => changeList({ sort: value })}
              ariaLabel="리뷰 정렬"
              size="sm"
              align="right"
              className="w-32"
            />
          )}
        </div>

        {!user && (
          <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
            리뷰를 작성하려면{' '}
            <Link to="/login" state={{ from: `/books/${book.isbn}` }} className="text-accent underline">
              로그인
            </Link>
            하세요.
          </p>
        )}

        {reviewState.key === reviewKey && reviewState.error && (
          <p className="text-center text-sm text-red-600">{reviewState.error.message}</p>
        )}

        {!reviews && !reviewState.error && <p className="py-6 text-center text-sm text-stone-500">리뷰 불러오는 중…</p>}

        {reviews && (
          <>
            {user && !myReview && (
              <ReviewForm
                onSubmit={async (body) => {
                  await api.createReview({ isbn: book.isbn, ...body })
                  await reload()
                }}
              />
            )}

            {myReview && <ReviewCard review={myReview} isOwner onChanged={reload} />}

            {othersEmpty ? (
              !myReview && (
                <p className="py-6 text-center text-sm text-stone-500">
                  {user ? '첫 번째 리뷰를 남겨보세요.' : '아직 작성된 리뷰가 없습니다.'}
                </p>
              )
            ) : (
              <div className="space-y-3">
                {reviews.reviews.map((r) => (
                  <ReviewCard key={r.review_id} review={r} onChanged={reload} />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={reviews.totalPages}
              onChange={(p) => changeList({ page: String(p) })}
              className="pt-2"
            />
          </>
        )}
      </section>
    </div>
  )
}

function RatingSummary({ stats }) {
  const max = Math.max(1, ...Object.values(stats.distribution))

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-stone-200 bg-white p-4">
      <div className="text-center">
        <p className="font-serif text-4xl font-bold">{stats.avgRating != null ? stats.avgRating.toFixed(1) : '-'}</p>
        <StarRating value={stats.avgRating ?? 0} size="text-base" />
        <p className="mt-1 text-xs text-stone-500">리뷰 {stats.reviewCount}개</p>
      </div>
      <dl className="min-w-40 flex-1 space-y-1">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = stats.distribution[n]
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <dt className="w-6 shrink-0 text-stone-500">{n}점</dt>
              <dd className="flex flex-1 items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-[width] duration-500"
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right text-stone-500">{count}</span>
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
