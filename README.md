# 북담 (bookdam)

국립중앙도서관 ISBN 서지정보 API로 책을 검색하고 별점·리뷰를 남기는 도서 리뷰 사이트.

- 프론트: React 19 + Vite + Tailwind CSS v4 + React Router
- 백엔드: Express 5 + mysql2 + JWT + bcrypt
- DB: MySQL (users / books / reviews)

## 실행 방법

### 1. 서버
DB(users / books / reviews)는 MySQL Workbench 에서 미리 만들어 둔 것을 사용합니다.

```bash
cd server
npm install
copy .env.example .env     # macOS/Linux: cp .env.example .env
# .env 에 DB_NAME(Workbench 스키마 이름), DB 비밀번호, JWT_SECRET, NLK_CERT_KEY 입력
npm run dev                # http://localhost:5000
```
서버가 시작할 때 DB 연결과 필요한 컬럼이 모두 있는지 확인하고, 빠진 게 있으면 이름을 출력하고 종료합니다.

### 2. 클라이언트
```bash
cd client
npm install
npm run dev                # http://localhost:5173
```
Vite 가 `/api` 요청을 5000번 포트로 프록시하므로 별도 설정 없이 동작합니다.

## 도서 저장 방식
검색·상세 조회는 외부 API 결과를 그대로 보여주고 DB에 저장하지 않습니다.
**리뷰를 처음 작성하는 순간**에만 서버가 ISBN으로 API를 다시 조회해 `books` 에 INSERT 합니다.
(클라이언트가 보낸 책 정보를 믿지 않고 서버가 직접 조회)

## API

| 메서드 | 경로 | 인증 | 설명 |
|---|---|---|---|
| POST | /api/auth/register | | 회원가입 `{ username, password, nickname }` |
| POST | /api/auth/login | | 로그인 → `{ token, user }` |
| GET | /api/auth/me | ✔ | 내 정보 |
| GET | /api/books/search?q=&page= | | 도서 제목 검색 (외부 API) |
| GET | /api/books/:isbn | | 도서 상세 + 평균 별점 |
| GET | /api/books/:isbn/reviews | | 도서별 리뷰 |
| POST | /api/reviews | ✔ | 리뷰 작성 `{ isbn, rating, content }` |
| PUT | /api/reviews/:id | ✔ | 리뷰 수정 (본인만) |
| DELETE | /api/reviews/:id | ✔ | 리뷰 삭제 (본인만) |
| GET | /api/users/me/reviews | ✔ | 내 리뷰 전체 |
| GET | /api/users/:userId/reviews | | 회원별 리뷰 (users ⨝ reviews ⨝ books) |

## 폴더 구조
```
server/
  src/
    index.js            앱 진입점
    checkSchema.js      시작 시 DB 컬럼 확인
    db.js               MySQL 커넥션 풀
    middleware/auth.js  JWT 검증/발급
    services/nlk.js     국립중앙도서관 API 호출
    routes/             auth, books, reviews, users
client/src/
  api/client.js         fetch 래퍼 (JWT 자동 첨부)
  context/AuthContext   로그인 상태
  components/           Navbar, StarRating, BookCover, ReviewForm, ReviewCard ...
  pages/                검색, 상세, 로그인, 회원가입, 내 리뷰, 회원별 리뷰
```
