import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import BackButton from '../components/BackButton.jsx'
import Modal, { ModalActions } from '../components/Modal.jsx'
import ErrorPage from '../components/ErrorPage.jsx'
import PasswordInput from '../components/PasswordInput.jsx'

export default function ProfilePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  const [step, setStep] = useState(null)
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api
      .me()
      .then(setData)
      .catch(setError)
  }, [])

  const closeDelete = () => {
    setStep(null)
    setPassword('')
    setDeleteError('')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteAccount(password)
      setStep('done')
    } catch (err) {
      setDeleteError(err.message)
      setStep('password')
    } finally {
      setDeleting(false)
    }
  }

  const finishDelete = () => {
    logout()
    navigate('/', { replace: true })
  }

  if (error) return <ErrorPage status={error.status} />
  if (!data) return <p className="text-center text-stone-500">불러오는 중…</p>

  const { user, stats } = data

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <BackButton />
        <h1 className="mt-2 font-serif text-3xl font-bold">내 정보</h1>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white p-6">
        <dl className="divide-y divide-stone-100">
          <InfoRow label="아이디" value={user.username} />
          <InfoRow label="닉네임" value={user.nickname} />
          <InfoRow label="가입일" value={user.createdAt?.slice(0, 10)} />
          <InfoRow
            label="작성한 리뷰"
            value={
              <Link to="/me/reviews" className="text-accent underline">
                {stats.reviewCount}개
              </Link>
            }
          />
          <InfoRow label="평균 별점" value={stats.avgRating == null ? '-' : stats.avgRating.toFixed(1)} />
        </dl>

        <div className="mt-6 flex gap-3">
          <Link
            to="/me/edit"
            state={{ fromProfile: true }}
            className="flex-1 rounded-lg bg-ink py-2.5 text-center text-paper hover:bg-stone-700"
          >
            회원 정보 수정
          </Link>
          <button
            onClick={() => setStep('password')}
            className="flex-1 rounded-lg border border-danger/40 py-2.5 text-danger hover:bg-danger/5"
          >
            회원 탈퇴
          </button>
        </div>
      </section>

      {step === 'password' && (
        <Modal title="회원 탈퇴" onClose={closeDelete}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setDeleteError('')
              setStep('confirm')
            }}
          >
            <p className="text-sm text-stone-600">계속하려면 비밀번호를 입력하세요.</p>
            <div className="mt-3">
              <PasswordInput
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="비밀번호"
                aria-label="비밀번호"
                className="rounded-lg border border-stone-300 px-3 py-2 focus:border-danger focus:outline-none"
              />
            </div>
            {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
            <ModalActions type="submit" onCancel={closeDelete} confirmLabel="다음" danger />
          </form>
        </Modal>
      )}

      {step === 'confirm' && (
        <Modal title="정말 탈퇴하시겠습니까?" onClose={closeDelete} busy={deleting}>
          <p className="text-sm text-stone-600">
            작성한 리뷰 {stats.reviewCount}개가 모두 삭제되며 되돌릴 수 없습니다.
          </p>
          <ModalActions onCancel={closeDelete} onConfirm={handleDelete} confirmLabel="탈퇴하기" danger busy={deleting} />
        </Modal>
      )}

      {step === 'done' && (
        <Modal title="회원 탈퇴 완료" onClose={finishDelete}>
          <p className="text-sm text-stone-600">회원 탈퇴가 완료되었습니다. 그동안 북담을 이용해 주셔서 감사합니다.</p>
          <ModalActions onConfirm={finishDelete} confirmLabel="확인" />
        </Modal>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
