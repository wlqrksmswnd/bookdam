import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm, { Field } from './AuthForm.jsx'
import Modal, { ModalActions } from '../components/Modal.jsx'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'
  const [showRegistered, setShowRegistered] = useState(Boolean(location.state?.registered))
  const [form, setForm] = useState({ username: location.state?.username || '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const closeRegistered = () => {
    setShowRegistered(false)
    navigate(location.pathname, { replace: true, state: { ...location.state, registered: false } })
  }

  return (
    <>
      <AuthForm
        title="로그인"
        showBack
        error={error}
        onSubmit={handleSubmit}
        submitLabel={submitting ? '로그인 중…' : '로그인'}
        submitting={submitting}
        footer={
          <>
            아직 회원이 아니신가요?{' '}
            <Link to="/register" state={{ from }} className="text-accent underline">
              회원가입
            </Link>
          </>
        }
      >
        <Field
          label="아이디"
          value={form.username}
          onChange={set('username')}
          autoComplete="username"
          autoFocus={!form.username}
        />
        <Field
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="current-password"
          autoFocus={Boolean(form.username) && !showRegistered}
        />
      </AuthForm>
      {showRegistered && (
        <Modal title="회원가입 완료" onClose={closeRegistered}>
          <p className="text-sm text-stone-600">회원가입이 완료되었습니다. 가입한 아이디로 로그인해 주세요.</p>
          <ModalActions onConfirm={closeRegistered} confirmLabel="확인" />
        </Modal>
      )}
    </>
  )
}
