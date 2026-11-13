import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, busy = false, children }) {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, busy])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm animate-pop-in rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="mb-3 text-lg font-bold">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function ModalActions({ onCancel, onConfirm, confirmLabel, danger, busy, type = 'button' }) {
  return (
    <div className="mt-5 flex gap-3">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 rounded-lg border border-stone-300 py-2 hover:bg-stone-50 disabled:opacity-50"
        >
          취소
        </button>
      )}
      <button
        type={type}
        onClick={onConfirm}
        disabled={busy}
        className={`flex-1 rounded-lg py-2 text-white disabled:opacity-50 ${
          danger ? 'bg-danger hover:bg-danger-dark' : 'bg-ink hover:bg-stone-700'
        }`}
      >
        {busy ? '처리 중…' : confirmLabel}
      </button>
    </div>
  )
}
