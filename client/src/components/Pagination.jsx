const WINDOW = 5

function pageNumbers(page, totalPages) {
  let start = Math.max(1, page - Math.floor(WINDOW / 2))
  const end = Math.min(totalPages, start + WINDOW - 1)
  start = Math.max(1, end - WINDOW + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null

  const navButton = 'rounded-lg px-3 py-1.5 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <nav aria-label="페이지 이동" className={`flex items-center justify-center gap-1 text-sm ${className}`}>
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={navButton}>
        ← 이전
      </button>
      {pageNumbers(page, totalPages).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`h-8 min-w-8 rounded-lg px-2 ${
            n === page ? 'bg-ink font-medium text-paper' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={navButton}>
        다음 →
      </button>
    </nav>
  )
}
