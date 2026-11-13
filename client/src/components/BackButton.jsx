import { useLocation, useNavigate } from 'react-router-dom'

export default function BackButton({ className = '' }) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    if (location.key !== 'default') navigate(-1)
    else navigate('/', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ink ${className}`}
    >
      <span aria-hidden="true">←</span> 뒤로 가기
    </button>
  )
}
