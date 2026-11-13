import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ReviewCard from '../components/ReviewCard.jsx'
import BackButton from '../components/BackButton.jsx'
import ErrorPage from '../components/ErrorPage.jsx'
import Dropdown from '../components/Dropdown.jsx'
import Pagination from '../components/Pagination.jsx'
import { REVIEW_SORTS, readListParams } from '../reviewList.js'

export default function UserReviewList({ fetcher, title, isOwner, showBack }) {
  const [params, setParams] = useSearchParams()
  const { sort, page } = readListParams(params)
  const key = `${sort}|${page}`
  const [response, setResponse] = useState({ key: '' })

  const load = useCallback(
    () =>
      fetcher({ sort, page })
        .then((data) => setResponse({ key, data }))
        .catch((error) => setResponse({ key, error })),
    [fetcher, sort, page, key],
  )

  useEffect(() => {
    load()
  }, [load])

  const data = response.data
  const loading = response.key !== key

  useEffect(() => {
    if (!loading && data && page > data.totalPages) {
      setParams({ sort, page: String(data.totalPages) }, { replace: true })
    }
  }, [loading, data, page, sort, setParams])

  const changeList = (next) => {
    setParams({ sort, page: '1', ...next })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!loading && response.error) {
    const notFound = response.error.status === 404
    return (
      <ErrorPage
        status={response.error.status}
        title={notFound ? '회원을 찾을 수 없어요' : undefined}
        description={notFound ? '탈퇴했거나 존재하지 않는 회원이에요.' : undefined}
      />
    )
  }
  if (!data) return <p className="text-center text-stone-500">불러오는 중…</p>

  const { user, stats, reviews } = data

  return (
    <div className="space-y-6">
      {showBack && <BackButton className="mb-4" />}
      <header className="flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="min-w-0">
          <h1 className="truncate font-serif text-3xl font-bold">{title || `${user.nickname}님의 리뷰`}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {title && `${user.nickname} · `}가입일 {user.createdAt?.slice(0, 10)}
          </p>
        </div>
        <div className="shrink-0 text-right text-sm text-stone-600">
          <p>리뷰 {stats.reviewCount}개</p>
          {stats.avgRating != null && <p>평균 별점 {stats.avgRating.toFixed(1)}</p>}
        </div>
      </header>

      {stats.reviewCount === 0 ? (
        <p className="py-10 text-center text-stone-500">
          아직 작성한 리뷰가 없습니다.{' '}
          {isOwner && (
            <Link to="/" className="text-accent underline">
              책 찾으러 가기
            </Link>
          )}
        </p>
      ) : (
        <>
          {stats.reviewCount > 1 && (
            <div className="flex justify-end">
              <Dropdown
                options={REVIEW_SORTS}
                value={sort}
                onChange={(value) => changeList({ sort: value })}
                ariaLabel="리뷰 정렬"
                size="sm"
                align="right"
                className="w-32"
              />
            </div>
          )}
          <div className={`space-y-3 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {reviews.map((r) => (
              <ReviewCard key={r.review_id} review={r} linkToBook isOwner={isOwner} onChanged={load} />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} onChange={(p) => changeList({ page: String(p) })} />
        </>
      )}
    </div>
  )
}
