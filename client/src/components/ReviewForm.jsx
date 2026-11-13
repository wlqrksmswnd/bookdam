import { useState } from 'react'
import StarRating from './StarRating.jsx'

const MAX_LENGTH = 2000

export default function ReviewForm({ initial, onSubmit, onCancel, submitLabel = '리뷰 등록' }) {
  const [rating, setRating] = useState(initial?.rating ?? 0)
  const [content, setContent] = useState(initial?.content ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating < 1) return setError('별점을 선택하세요.')
    if (!content.trim()) return setError('리뷰 내용을 입력하세요.')

    setSaving(true)
    setError('')
    try {
      await onSubmit({ rating, content: content.trim() })
      if (!initial) {
        setRating(0)
        setContent('')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-stone-200 bg-white p-4">
      <StarRating value={rating} onChange={setRating} size="text-2xl" />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={MAX_LENGTH}
        placeholder="이 책에 대한 생각을 남겨주세요."
        className="w-full resize-y rounded border border-stone-300 p-3 text-sm focus:border-accent focus:outline-none"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-stone-400">
          {content.length} / {MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              취소
            </button>
          )}
          <button
            disabled={saving}
            className="rounded bg-accent px-4 py-2 text-sm text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving ? '저장 중…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}
