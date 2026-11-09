import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookDetailPage from './pages/BookDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MyReviewsPage from './pages/MyReviewsPage.jsx'
import UserReviewsPage from './pages/UserReviewsPage.jsx'

export default function App() {
  return (
    <div className="min-h-svh">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/books/:isbn" element={<BookDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/me/reviews"
            element={
              <ProtectedRoute>
                <MyReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/users/:userId" element={<UserReviewsPage />} />
          <Route path="*" element={<p className="text-center text-stone-500">페이지를 찾을 수 없습니다.</p>} />
        </Routes>
      </main>
    </div>
  )
}
