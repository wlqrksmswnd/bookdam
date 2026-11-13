import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ErrorPage from './components/ErrorPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import SearchPage from './pages/SearchPage.jsx'
import BookDetailPage from './pages/BookDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import MyReviewsPage from './pages/MyReviewsPage.jsx'
import UserReviewsPage from './pages/UserReviewsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProfileEditPage from './pages/ProfileEditPage.jsx'

export default function App() {
  const location = useLocation()

  return (
    <div className="min-h-svh">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/books/:isbn" element={<BookDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me/edit"
              element={
                <ProtectedRoute>
                  <ProfileEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/me/reviews"
              element={
                <ProtectedRoute>
                  <MyReviewsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/users/:userId" element={<UserReviewsPage />} />
            <Route path="*" element={<ErrorPage status={404} />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}
