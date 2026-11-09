import { useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating.jsx'
import ReviewForm from './ReviewForm.jsx'
import BookCover from './BookCover.jsx'
import { api } from '../api/client.js'

const formatDate = (s) => (s ? s.slice(0, 10).replaceAll('-', '.') : '')

// review: { review_id, rating, content, created_at, updated_at, user_id?, nickname?, book? }
// isOwner 면 수정/삭제 버튼 표시, showBook 이면 도서 정보 표시
export default function ReviewCard({ review, isOwner, showBook, onChanged }) {
  const [editing, setEditing] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 리뷰를 삭제할까요?')) return
    try {
      await api.deleteReview(review.review_id)
      onChanged?.()
    } catch (err) {
      alert(err.message)
    }
  }

  if (editing) {
    return (
      <ReviewForm
        initial={review}
        submitLabel="수정 완료"
        onCancel={() => setEditing(false)}
        onSubmit={async (body) => {
          await api.updateReview(review.review_id, body)
          setEditing(false)
          onChanged?.()
        }}
      />
    )
  }

  const edited = review.updated_at && review.updated_at !== review.created_at

  return (
    <article className="flex gap-4 rounded-lg border border-stone-200 bg-white p-4">
      {showBook && review.book && (
        <Link to={`/books/${review.book.isbn}`} className="w-16 shrink-0">
          <BookCover src={review.book.cover_url} title={review.book.title} />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        {showBook && review.book && (
          <Link to={`/books/${review.book.isbn}`} className="font-serif font-bold hover:text-accent">
            {review.book.title}
          </Link>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <StarRating value={review.rating} size="text-base" />
          {review.nickname && (
            <Link to={`/users/${review.user_id}`} className="font-medium text-stone-700 hover:text-accent">
              {review.nickname}
            </Link>
          )}
          <span>{formatDate(review.created_at)}</span>
          {edited && <span className="text-xs">(수정됨)</span>}
        </div>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{review.content}</p>

        {isOwner && (
          <div className="mt-3 flex gap-3 text-xs">
            <button onClick={() => setEditing(true)} className="text-stone-500 hover:text-ink">
              수정
            </button>
            <button onClick={handleDelete} className="text-stone-500 hover:text-red-600">
              삭제
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
