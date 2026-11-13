import { useState } from 'react'

export default function BookCover({ src, title, className = '' }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = failedSrc === src

  if (!src || failed) {
    return (
      <div
        className={`flex aspect-[3/4] items-center justify-center rounded bg-gradient-to-br from-stone-200 to-stone-300 p-3 ${className}`}
      >
        <span className="line-clamp-4 text-center font-serif text-sm text-stone-600">{title}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${title} 표지`}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`block aspect-[3/4] rounded object-cover shadow-sm ${className}`}
    />
  )
}
