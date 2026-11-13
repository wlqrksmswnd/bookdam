import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import AuthForm, { Field } from './AuthForm.jsx'

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const backToProfile = () => {
    if (location.state?.fromProfile) navigate(-1)
    else navigate('/me', { replace: true })
  }

  const [form, setForm] = useState({
    nickname: user.nickname,
    newPassword: '',
    newPasswordConfirm: '',
    currentPassword: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.newPasswordConfirm) return setError('새 비밀번호가 일치하지 않습니다.')

    setSaving(true)
    try {
      await updateProfile({
        nickname: form.nickname,
        newPassword: form.newPassword || undefined,
        currentPassword: form.currentPassword,
      })
      backToProfile()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  return (
    <AuthForm
      title="회원 정보 수정"
      error={error}
      onSubmit={handleSubmit}
      submitLabel={saving ? '저장 중…' : '저장하기'}
      footer={
        <button type="button" onClick={backToProfile} className="text-accent underline">
          취소하고 돌아가기
        </button>
      }
    >
      <label className="block">
        <span className="text-sm font-medium">아이디</span>
        <input
          value={user.username}
          disabled
          className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-stone-500"
        />
      </label>
      <Field label="닉네임" hint="1~20자" maxLength={20} value={form.nickname} onChange={set('nickname')} />

      <div className="space-y-4 border-t border-stone-100 pt-4">
        <p className="text-xs text-stone-400">비밀번호를 바꾸지 않으려면 비워 두세요.</p>
        <Field
          label="새 비밀번호"
          hint="8자 이상"
          type="password"
          required={false}
          value={form.newPassword}
          onChange={set('newPassword')}
          autoComplete="new-password"
        />
        <Field
          label="새 비밀번호 확인"
          type="password"
          required={Boolean(form.newPassword)}
          value={form.newPasswordConfirm}
          onChange={set('newPasswordConfirm')}
          autoComplete="new-password"
        />
      </div>

      <div className="border-t border-stone-100 pt-4">
        <Field
          label="현재 비밀번호"
          hint="본인 확인용"
          type="password"
          value={form.currentPassword}
          onChange={set('currentPassword')}
          autoComplete="current-password"
        />
      </div>
    </AuthForm>
  )
}
