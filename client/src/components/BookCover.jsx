import { useState } from 'react'

// 표지가 없거나 이미지 로드에 실패하면 제목이 들어간 대체 표지 표시
export default function BookCover({ src, title, className = '' }) {
  const [failed, setFailed] = useState(false)

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
      onError={() => setFailed(true)}
      className={`aspect-[3/4] rounded object-cover shadow-sm ${className}`}
    />
  )
}
