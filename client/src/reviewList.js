export const REVIEW_SORTS = [
  { value: 'latest', label: '최신순' },
  { value: 'rating_desc', label: '별점 높은순' },
  { value: 'rating_asc', label: '별점 낮은순' },
]

export function readListParams(params) {
  const sort = REVIEW_SORTS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'latest'
  const page = Math.max(1, Math.floor(Number(params.get('page'))) || 1)
  return { sort, page }
}
