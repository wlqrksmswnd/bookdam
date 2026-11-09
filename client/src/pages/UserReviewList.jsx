import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ReviewCard from '../components/ReviewCard.jsx'

// 내 리뷰 / 회원별 리뷰 공용 화면 (회원 정보 + 리뷰 목록)
export default function UserReviewList({ fetcher, title, isOwner }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetcher()
      .then(setData)
      .catch((err) => setError(err.message))
  }, [fetcher])

  useEffect(() => {
    load()
  }, [load])

  if (error) return <p className="text-center text-red-600">{error}</p>
  if (!data) return <p className="text-center text-stone-500">불러오는 중…</p>

  const { user, reviews } = data
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">{title || `${user.nickname}님의 리뷰`}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {title && `${user.nickname} · `}가입일 {user.createdAt?.slice(0, 10)}
          </p>
        </div>
        <div className="text-right text-sm text-stone-600">
          <p>리뷰 {reviews.length}개</p>
          {avg != null && <p>평균 별점 {avg.toFixed(1)}</p>}
        </div>
      </header>

      {reviews.length === 0 ? (
        <p className="py-10 text-center text-stone-500">
          아직 작성한 리뷰가 없습니다.{' '}
          {isOwner && (
            <Link to="/" className="text-accent underline">
              책 찾으러 가기
            </Link>
          )}
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.review_id} review={r} isOwner={isOwner} showBook onChanged={load} />
          ))}
        </div>
      )}
    </div>
  )
}
