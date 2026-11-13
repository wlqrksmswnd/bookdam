import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm, { Field } from './AuthForm.jsx'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [form, setForm] = useState({ username: '', password: '', passwordConfirm: '', nickname: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.')
    setSubmitting(true)
    try {
      await register({ username: form.username, password: form.password, nickname: form.nickname })
      navigate('/login', { replace: true, state: { registered: true, username: form.username.trim(), from } })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <AuthForm
      title="회원가입"
      showBack
      error={error}
      onSubmit={handleSubmit}
      submitLabel={submitting ? '가입 중…' : '가입하기'}
      submitting={submitting}
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" state={{ from }} className="text-accent underline">
            로그인
          </Link>
        </>
      }
    >
      <Field
        label="아이디"
        hint="영문/숫자/_ 4~20자"
        value={form.username}
        onChange={set('username')}
        autoComplete="username"
        maxLength={20}
        autoFocus
      />
      <Field label="닉네임" hint="리뷰에 표시되는 이름" value={form.nickname} onChange={set('nickname')} maxLength={20} />
      <Field
        label="비밀번호"
        hint="8자 이상"
        type="password"
        value={form.password}
        onChange={set('password')}
        autoComplete="new-password"
        minLength={8}
      />
      <Field
        label="비밀번호 확인"
        type="password"
        value={form.passwordConfirm}
        onChange={set('passwordConfirm')}
        autoComplete="new-password"
      />
    </AuthForm>
  )
}
