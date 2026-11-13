import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import UserReviewList from './UserReviewList.jsx'

export default function UserReviewsPage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const fetcher = useCallback((listParams) => api.userReviews(userId, listParams), [userId])

  return <UserReviewList key={userId} fetcher={fetcher} isOwner={user?.userId === Number(userId)} showBack />
}
