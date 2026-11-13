import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const linkClass = ({ isActive }) =>
  `whitespace-nowrap text-sm transition ${isActive ? 'text-accent font-medium' : 'text-stone-600 hover:text-ink'}`

const mobileLinkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2.5 ${isActive ? 'bg-stone-100 font-medium text-accent' : 'text-stone-700 hover:bg-stone-100'}`

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      {open ? (
        <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [lastPath, setLastPath] = useState(location.pathname)
  const headerRef = useRef(null)

  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (!headerRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/')
  }

  const links = user
    ? [
        { to: '/', label: '도서 검색', end: true },
        { to: '/me/reviews', label: '내 리뷰' },
        { to: '/me', label: `${user.nickname}님`, end: true },
      ]
    : [
        { to: '/', label: '도서 검색', end: true },
        { to: '/login', label: '로그인' },
      ]

  return (
    <header ref={headerRef} className="sticky top-0 z-30 border-b border-stone-200 bg-paper/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="shrink-0 font-serif text-2xl font-bold text-ink">
          북담<span className="text-accent">.</span>
        </Link>

        <div className="hidden min-w-0 items-center gap-5 sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={(state) => `max-w-32 truncate ${linkClass(state)}`}
            >
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 whitespace-nowrap text-sm text-stone-500 hover:text-ink"
            >
              로그아웃
            </button>
          ) : (
            <Link
              to="/register"
              className="shrink-0 rounded-full bg-ink px-4 py-1.5 text-sm text-paper hover:bg-stone-700"
            >
              회원가입
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="-mr-2 rounded-lg p-2 text-stone-700 hover:bg-stone-100 sm:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="animate-pop-in border-t border-stone-200 bg-paper px-4 py-3 sm:hidden">
          <div className="space-y-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={(state) => `truncate ${mobileLinkClass(state)}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 border-t border-stone-200 pt-3">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2.5 text-left text-stone-500 hover:bg-stone-100"
              >
                로그아웃
              </button>
            ) : (
              <Link
                to="/register"
                className="block rounded-lg bg-ink px-3 py-2.5 text-center text-paper hover:bg-stone-700"
              >
                회원가입
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
