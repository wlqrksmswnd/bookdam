# 북담 (bookdam)

카카오 책 검색 API로 책을 검색하고 별점·리뷰를 남기는 도서 리뷰 사이트.

- 프론트: React 19 + Vite + Tailwind CSS v4 + React Router
- 백엔드: Express 5 + mysql2 + JWT + bcrypt
- DB: MySQL (users / books / reviews)

## 실행 방법

### 1. 서버
DB(users / books / reviews)는 MySQL Workbench 에서 미리 만들어 둔 것을 사용합니다.

`server/.env` 파일을 만들고 아래 값을 채웁니다.

| 변수 | 설명 |
|---|---|
| `PORT` | 서버 포트 (기본 5000) |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` | MySQL 접속 정보 |
| `DB_NAME` | Workbench 에서 만든 스키마 이름 |
| `JWT_SECRET` | JWT 서명용 비밀 문자열 (필수) |
| `JWT_EXPIRES_IN` | 로그인 유지 기간 (기본 7d) |
| `KAKAO_API_KEY` | 카카오 디벨로퍼스 앱의 REST API 키 |
| `CLIENT_ORIGIN` | 프론트 주소 (기본 http://localhost:5173) |

```bash
cd server
npm install
npm run dev                # http://localhost:5000
npm run check              # DB·API 통합 검사 (검사용 데이터는 끝나면 자동 삭제)
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
| GET | /api/auth/me | ✔ | 내 정보 + 리뷰 수/평균 별점 |
| PUT | /api/auth/me | ✔ | 회원 정보 수정 `{ currentPassword, nickname, newPassword? }` → 새 토큰 |
| DELETE | /api/auth/me | ✔ | 회원 탈퇴 `{ password }` (내 리뷰도 함께 삭제) |
| GET | /api/books/search?q=&type=&page= | | 도서 검색 (외부 API). type: title(기본) / isbn |
| GET | /api/books/:isbn | | 도서 상세(책 소개 포함) + 평균 별점 + 별점 분포 |
| GET | /api/books/:isbn/reviews?sort=&page= | (선택) | 도서별 리뷰 10개씩. 로그인 시 내 리뷰는 `myReview` 로 분리 |
| POST | /api/reviews | ✔ | 리뷰 작성 `{ isbn, rating, content }` |
| PUT | /api/reviews/:id | ✔ | 리뷰 수정 (본인만) |
| DELETE | /api/reviews/:id | ✔ | 리뷰 삭제 (본인만) |
| GET | /api/users/me/reviews?sort=&page= | ✔ | 내 리뷰 10개씩 + 통계 |
| GET | /api/users/:userId/reviews?sort=&page= | | 회원별 리뷰 10개씩 + 통계 (users ⨝ reviews, reviews ⨝ books) |

리뷰 목록의 `sort` 는 `latest`(기본) / `rating_desc` / `rating_asc` 입니다.

## 폴더 구조
```
server/
  src/
    index.js            앱 진입점
    checkSchema.js      시작 시 DB 컬럼 확인
    db.js               MySQL 커넥션 풀
    middleware/auth.js  JWT 검증/발급
    services/kakao.js   카카오 책 검색 API 호출
    routes/             auth, books, reviews, users
client/src/
  api/client.js         fetch 래퍼 (JWT 자동 첨부)
  context/AuthContext   로그인 상태
  components/           Navbar, StarRating, BookCover, ReviewForm, ReviewCard, Modal, Dropdown ...
  pages/                검색, 상세, 로그인, 회원가입, 내 정보, 정보 수정, 내 리뷰, 회원별 리뷰
```
