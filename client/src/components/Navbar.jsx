import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `text-sm transition ${isActive ? 'text-accent font-medium' : 'text-stone-600 hover:text-ink'}`

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="border-b border-stone-200 bg-paper/90 backdrop-blur sticky top-0 z-10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-serif text-2xl font-bold text-ink">
          북담<span className="text-accent">.</span>
        </Link>

        <div className="flex items-center gap-5">
          <NavLink to="/" end className={linkClass}>
            도서 검색
          </NavLink>
          {user ? (
            <>
              <NavLink to="/me/reviews" className={linkClass}>
                내 리뷰
              </NavLink>
              <span className="text-sm text-stone-500">{user.nickname}님</span>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="text-sm text-stone-500 hover:text-ink"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                로그인
              </NavLink>
              <Link
                to="/register"
                className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper hover:bg-stone-700"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
