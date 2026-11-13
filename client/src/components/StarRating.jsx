import { useState } from 'react'

export default function StarRating({ value = 0, onChange, size = 'text-lg' }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const editable = Boolean(onChange)

  if (!editable) {
    return (
      <div className={`inline-flex ${size}`} role="img" aria-label={`별점 ${value}점`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} aria-hidden="true" className={n <= Math.round(value) ? 'text-amber-500' : 'text-stone-300'}>
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={`inline-flex ${size}`} role="radiogroup" aria-label="별점 선택" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n}점`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className={`px-0.5 transition ${n <= shown ? 'text-amber-500' : 'text-stone-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}
