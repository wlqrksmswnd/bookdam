import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm, { Field } from './AuthForm.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // 회원가입 직후 넘어온 경우 아이디를 미리 채워둠
  const justRegistered = Boolean(location.state?.registered)
  const [form, setForm] = useState({ username: location.state?.username || '', password: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <AuthForm
      title="로그인"
      error={error}
      onSubmit={handleSubmit}
      submitLabel="로그인"
      footer={
        <>
          아직 회원이 아니신가요?{' '}
          <Link to="/register" className="text-accent underline">
            회원가입
          </Link>
        </>
      }
    >
      {justRegistered && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          회원가입이 완료되었습니다. 로그인해 주세요.
        </p>
      )}
      <Field label="아이디" value={form.username} onChange={set('username')} autoComplete="username" />
      <Field
        label="비밀번호"
        type="password"
        value={form.password}
        onChange={set('password')}
        autoComplete="current-password"
      />
    </AuthForm>
  )
}
