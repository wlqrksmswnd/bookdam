import { api } from '../api/client.js'
import UserReviewList from './UserReviewList.jsx'

export default function MyReviewsPage() {
  return <UserReviewList fetcher={api.myReviews} title="내 리뷰" isOwner showBack />
}
