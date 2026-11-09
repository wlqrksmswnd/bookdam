import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// 로그인하지 않았으면 로그인 페이지로 보내고, 로그인 후 원래 페이지로 돌아오게 함
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-center text-stone-500">불러오는 중…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
