import { useState } from 'react'

// onChange 를 넘기면 입력용, 안 넘기면 표시용
export default function StarRating({ value = 0, onChange, size = 'text-lg' }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const editable = Boolean(onChange)

  return (
    <div className={`inline-flex ${size}`} onMouseLeave={() => setHover(0)} aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((n) =>
        editable ? (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className={`px-0.5 transition ${n <= shown ? 'text-amber-500' : 'text-stone-300'}`}
            aria-label={`${n}점`}
          >
            ★
          </button>
        ) : (
          <span key={n} className={n <= Math.round(shown) ? 'text-amber-500' : 'text-stone-300'}>
            ★
          </span>
        ),
      )}
    </div>
  )
}
