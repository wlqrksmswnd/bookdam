import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import StarRating from './StarRating.jsx'
import ReviewForm from './ReviewForm.jsx'
import BookCover from './BookCover.jsx'
import Modal, { ModalActions } from './Modal.jsx'
import { api } from '../api/client.js'

const formatDate = (s) => (s ? s.slice(0, 10).replaceAll('-', '.') : '')

function ReviewDate({ review }) {
  return <p className="mt-3 text-xs text-stone-400">{formatDate(review.created_at)}</p>
}

export default function ReviewCard({ review, isOwner, linkToBook, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const closeDelete = () => {
    setConfirmingDelete(false)
    setDeleteError('')
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await api.deleteReview(review.review_id)
      setDeleting(false)
      setConfirmingDelete(false)
      onChanged?.()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  if (editing) {
    const form = (
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
    if (!linkToBook || !review.book) return form
    return (
      <div>
        <p className="mb-2 font-serif font-bold">{review.book.title}</p>
        {form}
      </div>
    )
  }

  const moreMenu = isOwner && (
    <MoreMenu onEdit={() => setEditing(true)} onDelete={() => setConfirmingDelete(true)} />
  )

  const deleteModal = confirmingDelete && (
    <Modal title="리뷰 삭제" onClose={closeDelete} busy={deleting}>
      <p className="text-sm text-stone-600">이 리뷰를 삭제할까요? 삭제한 리뷰는 되돌릴 수 없습니다.</p>
      {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
      <ModalActions onCancel={closeDelete} onConfirm={handleDelete} confirmLabel="삭제" danger busy={deleting} />
    </Modal>
  )

  if (linkToBook && review.book) {
    return (
      <article className="flex gap-4 rounded-lg border border-stone-200 bg-white p-4">
        <Link
          to={`/books/${review.book.isbn}`}
          aria-label={`${review.book.title} 상세 보기`}
          className="w-20 shrink-0 self-center transition-opacity duration-200 hover:opacity-80"
        >
          <BookCover src={review.book.cover_url} title={review.book.title} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p className="min-w-0 flex-1 font-serif font-bold">{review.book.title}</p>
            {moreMenu}
          </div>
          <StarRating value={review.rating} size="text-base" />
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{review.content}</p>
          <ReviewDate review={review} />
        </div>
        {deleteModal}
      </article>
    )
  }

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-stone-500">
        <StarRating value={review.rating} size="text-base" />
        {review.nickname && (
          <Link to={`/users/${review.user_id}`} className="font-medium text-stone-700 hover:text-accent">
            {review.nickname}
          </Link>
        )}
        {isOwner && <span className="text-xs text-accent">(내 리뷰)</span>}
        {moreMenu}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{review.content}</p>
      <ReviewDate review={review} />
      {deleteModal}
    </article>
  )
}

function MoreMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pick = (fn) => () => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative z-10 ml-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="더보기"
        aria-expanded={open}
        className="rounded-full px-2 leading-6 text-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-ink"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-24 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 text-sm shadow-md">
          <button type="button" onClick={pick(onEdit)} className="block w-full px-3 py-1.5 text-left hover:bg-stone-100">
            수정
          </button>
          <button
            type="button"
            onClick={pick(onDelete)}
            className="block w-full px-3 py-1.5 text-left text-danger hover:bg-danger/5"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}
