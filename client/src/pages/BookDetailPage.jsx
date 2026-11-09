import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import BookCover from '../components/BookCover.jsx'
import StarRating from '../components/StarRating.jsx'
import ReviewForm from '../components/ReviewForm.jsx'
import ReviewCard from '../components/ReviewCard.jsx'

export default function BookDetailPage() {
  const { isbn } = useParams()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const [bookData, reviewData] = await Promise.all([api.getBook(isbn), api.getBookReviews(isbn)])
      setBook(bookData.book)
      setStats(bookData.stats)
      setReviews(reviewData.reviews)
    } catch (err) {
      setError(err.message)
    }
  }, [isbn])

  useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="text-center text-red-600">{error}</p>
  if (!book) return <p className="text-center text-stone-500">불러오는 중…</p>

  const myReview = user && reviews.find((r) => r.user_id === user.userId)

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-8 sm:flex-row">
        <BookCover src={book.cover_url} title={book.title} className="w-48 shrink-0 self-center sm:self-start" />
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-bold">{book.title}</h1>
          <dl className="grid grid-cols-[5rem_1fr] gap-y-1 text-sm">
            <dt className="text-stone-500">저자</dt>
            <dd>{book.author || '-'}</dd>
            <dt className="text-stone-500">출판사</dt>
            <dd>{book.publisher || '-'}</dd>
            <dt className="text-stone-500">출간일</dt>
            <dd>{book.publish_date || '-'}</dd>
            <dt className="text-stone-500">ISBN</dt>
            <dd>{book.isbn}</dd>
          </dl>
          <div className="flex items-center gap-2 pt-2">
            <StarRating value={stats?.avgRating ?? 0} size="text-xl" />
            <span className="text-sm text-stone-600">
              {stats?.avgRating != null ? `${stats.avgRating.toFixed(1)}점` : '아직 평가 없음'} · 리뷰{' '}
              {stats?.reviewCount ?? 0}개
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold">리뷰</h2>

        {!user && (
          <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
            리뷰를 작성하려면{' '}
            <Link to="/login" state={{ from: `/books/${isbn}` }} className="text-accent underline">
              로그인
            </Link>
            하세요.
          </p>
        )}

        {user && !myReview && (
          <ReviewForm
            onSubmit={async (body) => {
              await api.createReview({ isbn: book.isbn, ...body })
              await load()
            }}
          />
        )}

        {reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">첫 번째 리뷰를 남겨보세요.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard key={r.review_id} review={r} isOwner={user?.userId === r.user_id} onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
