import { Link, useLocation, useNavigate } from 'react-router-dom'

const PRESETS = {
  0: {
    code: '!',
    title: '서버에 연결할 수 없어요',
    description: '인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.',
    retry: true,
  },
  400: {
    code: '400',
    title: '잘못된 요청이에요',
    description: '주소나 입력한 내용을 다시 확인해 주세요.',
  },
  403: {
    code: '403',
    title: '접근할 수 없는 페이지예요',
    description: '이 페이지를 볼 수 있는 권한이 없어요.',
  },
  404: {
    code: '404',
    title: '페이지를 찾을 수 없어요',
    description: '주소가 잘못되었거나 삭제된 페이지일 수 있어요.',
  },
  500: {
    code: '500',
    title: '문제가 생겼어요',
    description: '일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요.',
    retry: true,
  },
}

function presetFor(status) {
  if (status === 0) return PRESETS[0]
  if (PRESETS[status]) return PRESETS[status]
  if (status >= 400 && status < 500) return PRESETS[400]
  return PRESETS[500]
}

export default function ErrorPage({ status = 500, title, description }) {
  const navigate = useNavigate()
  const location = useLocation()
  const preset = presetFor(status)
  const canGoBack = location.key !== 'default'

  return (
    <section className="flex flex-col items-center py-16 text-center">
      <p className="font-serif text-7xl font-bold text-accent/80 sm:text-8xl" aria-hidden="true">
        {preset.code}
      </p>
      <h1 className="mt-6 font-serif text-2xl font-bold sm:text-3xl">{title || preset.title}</h1>
      <p className="mt-3 max-w-md text-stone-500">{description || preset.description}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {preset.retry && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-ink px-5 py-2.5 text-paper hover:bg-stone-700"
          >
            다시 시도
          </button>
        )}
        {canGoBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 hover:bg-stone-50"
          >
            뒤로 가기
          </button>
        )}
        <Link
          to="/"
          className={`rounded-lg px-5 py-2.5 ${
            preset.retry ? 'border border-stone-300 bg-white hover:bg-stone-50' : 'bg-ink text-paper hover:bg-stone-700'
          }`}
        >
          홈으로
        </Link>
      </div>
    </section>
  )
}
