const ORDERS = {
  latest: 'r.created_at DESC, r.review_id DESC',
  rating_desc: 'r.rating DESC, r.created_at DESC, r.review_id DESC',
  rating_asc: 'r.rating ASC, r.created_at DESC, r.review_id DESC',
};

export const REVIEW_PAGE_SIZE = 10;

export function parseReviewListQuery(query) {
  const sort = Object.hasOwn(ORDERS, query.sort) ? query.sort : 'latest';
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  return {
    sort,
    orderBy: ORDERS[sort],
    page,
    limit: REVIEW_PAGE_SIZE,
    offset: (page - 1) * REVIEW_PAGE_SIZE,
  };
}

export function pageInfo(total, { page, sort }) {
  return { total, page, sort, totalPages: Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE)) };
}
