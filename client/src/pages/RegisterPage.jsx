import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm, { Field } from './AuthForm.jsx'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', passwordConfirm: '', nickname: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.')
    try {
      await register({ username: form.username, password: form.password, nickname: form.nickname })
      navigate('/login', { replace: true, state: { registered: true, username: form.username } })
    } catch (err) {
      setError(err.message)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <AuthForm
      title="회원가입"
      error={error}
      onSubmit={handleSubmit}
      submitLabel="가입하기"
      footer={
        <>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-accent underline">
            로그인
          </Link>
        </>
      }
    >
      <Field label="아이디" hint="영문/숫자/_ 4~20자" value={form.username} onChange={set('username')} autoComplete="username" />
      <Field label="닉네임" hint="리뷰에 표시되는 이름" value={form.nickname} onChange={set('nickname')} />
      <Field
        label="비밀번호"
        hint="8자 이상"
        type="password"
        value={form.password}
        onChange={set('password')}
        autoComplete="new-password"
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
