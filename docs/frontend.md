# 프론트엔드

## 스택

- React
- 웹뷰(네이티브 껍데기 안의 브라우저)로 감싸서 앱으로 배포
- 손님용 공유 링크 페이지는 **일반 브라우저에서도 그대로 동작해야 한다**

**React를 쓴다. (확정 — 2026-09-08)**

**Next.js (App Router)를 쓴다. (확정 — 2026-09-09)**

공유 링크 `/t/:slug`의 카카오톡 미리보기(OG 태그)는 **서버에서 HTML을 만들어 줘야** 뜬다.
순수 CSR(Vite + React 등)로 만들면 카카오톡 크롤러가 빈 HTML을 받아가서 미리보기가 나오지 않는데,
`product-rules.md`가 이 미리보기를 필수로 규정하고 있다.
Vite로 가면 `/t/:slug`용 서버를 따로 세워야 해서 **배포 대상이 둘로 늘어난다.** Next.js는 하나로 끝난다.

- `/t/:slug`만 서버 렌더링하면 된다. 나머지 화면은 클라이언트 컴포넌트로 짜도 무방하다.
- OG 태그는 `generateMetadata`로 만든다.
- **백엔드와는 무관한 결정이다.** 백엔드(EC2 Node + Express)는 `/api/v1` JSON만 내려주고,
  Next.js는 화면 HTML만 만든다. 서로 HTTP로 대화하는 별개 프로그램이다.

**백엔드는 EC2 위의 자체 Node.js 서버다. Supabase는 쓰지 않는다. (확정 — 2026-09-08)**

따라서 소셜 로그인은 Supabase Auth가 아니라 **직접 구현**이다. 프론트가 받은 `code`를
`POST /api/v1/auth/social`에 넘기면 백엔드가 자체 JWT를 돌려준다.

**다만 API 호출 코드는 아직 쓰지 마라.** 명세에 수정 요청 7건이 걸려 있어 응답 모양이 바뀔 수 있다
(`status.md`의 Delegate 목록). 확정본이 오기 전까지는 `src/lib/mock/`의 목데이터로만 화면을 만든다.

> **백엔드 문서는 자체 서버를 전제한다 — 2026-09-08 확인**
> 백엔드 레포 세 문서 어디에도 Supabase·MySQL·PostgreSQL 언급이 없다(grep 0건). 명시된 건 "Node.js + MVP 패턴"뿐이다.
> `API_SPEC.md`에는 `POST /api/v1/auth/social`이 있고 **자체 JWT를 발급**한다. 20개 엔드포인트가 전부 `/api/v1` 아래에 있다.
> 즉 현재 명세만 보면 **Supabase Auth를 쓰지 않고 직접 구현하는 구조**다.
> `status.md`의 "Supabase, AWS EC2, MySQL"은 팀 대화에서 나온 것이고 백엔드 문서에는 근거가 없다. 확인이 필요하다.

## 폴더 구조

```
src/
  app/            라우트 단위 화면 (App Router). 폴더 이름이 곧 URL이다
  components/     공통 컴포넌트 (Button, TextInput, Toggle …)
  features/       도메인별 묶음 (owner/, customer/, auth/)
  styles/         tokens.css — 디자인 토큰 정의. 여기 외에 색을 쓰지 마라
  lib/            API 클라이언트, 지도 래퍼, 유틸 (mock/ 목데이터 포함)
```

**`src/pages/`를 만들지 마라.** Next.js가 그 이름을 구형 Pages Router로 인식해서
App Router와 충돌한다. 라우트 화면은 전부 `src/app/` 아래에 둔다.

## 라우팅

| 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `app/page.tsx` | 스플래시 → 역할 선택 |
| `/login` | `app/login/page.tsx` | 사장님 로그인 |
| `/owner` | `app/owner/page.tsx` | 사장님 홈. 로그인 필수. 하단 탭 `home` |
| `/owner/location` | `app/owner/location/page.tsx` | 위치 정하기. 하단 탭 `location` |
| `/owner/menu` | `app/owner/menu/page.tsx` | 메뉴 정하기. 하단 탭 `menu` |
| `/nearby` | `app/nearby/page.tsx` | 손님 — 주변 트럭 목록 |
| `/t/:slug` | `app/t/[slug]/page.tsx` | **공유 링크로 들어오는 단일 트럭 페이지. 로그인 불필요** |
| `/dev/components` | `app/dev/components/page.tsx` | 공통 컴포넌트·토큰 확인용. **개발 전용 — 배포 전 폴더째 지운다** |

`/t/:slug`는 이 서비스의 핵심 진입점이다. 다른 화면에 의존하지 않고 단독으로 완결돼야 한다.

## 디자인 토큰 사용

`src/styles/tokens.css` 한 곳에서만 색·간격·글자 크기를 정의한다.
컴포넌트 CSS에서 hex 값이나 px 숫자를 직접 쓰면 잘못된 코드다. 자세한 규칙은 `design-system.md`.

## 소셜 로그인

구글·카카오 OAuth를 쓴다.

- **`client secret`을 프론트 코드에 절대 넣지 마라.** 프론트 번들은 사용자가 전부 볼 수 있다. secret은 백엔드만 보관한다.
- 프론트가 하는 일은 인증 페이지로 보내기 → 돌아온 `code`를 백엔드에 넘기기 → 결과 세션 저장, 이 세 가지뿐이다.
- **구글은 앱에 임베드된 웹뷰에서 OAuth를 차단한다**(`disallowed_useragent`). 로그인은 외부 브라우저(Android Custom Tabs / iOS SFSafariViewController)나 네이티브 SDK로 띄워야 한다. 웹뷰 안에서 그대로 열지 마라.
- 인증 페이지를 다녀오는 사이의 로딩 화면, 사용자 취소, 실패 상태를 반드시 구현한다.

## 지도

**카카오맵**을 쓴다. `react-kakao-maps-sdk`.

- 기본 `MapMarker`는 브랜드 표현이 안 되므로 **`CustomOverlayMap`으로 커스텀 핀**을 만든다.
- 핀은 상태별로 다르다: 영업 중 / 준비 중, 선택됨 / 선택 안 됨.
- 로컬 개발 주소와 배포 주소를 모두 카카오 개발자 콘솔의 허용 도메인에 등록해야 동작한다.
- 장소 검색은 카카오 키워드 검색 API를 쓴다.

## 웹뷰 대응

- 안전영역: `env(safe-area-inset-top/bottom)` 적용
- 키보드가 올라올 때 하단 고정 버튼이 가려지지 않게 처리
- 뒤로가기: 웹 히스토리와 네이티브 뒤로가기의 동작을 일치시킨다
- iOS 고무줄 스크롤(bounce)로 배경이 드러나지 않게 처리

## 반드시 함께 구현할 것

정상 경로만 만들고 끝내지 마라. 데이터를 불러오는 모든 화면은 아래 네 상태를 갖는다.

- **로딩** — 스켈레톤 UI
- **에러** — 네트워크 끊김, 서버 오류. 무엇이 잘못됐고 어떻게 하면 되는지 알려준다
- **빈 상태** — 주변에 트럭 0개, 메뉴 0개
- **성공** — 정상 데이터

추가로 토스트("저장했어요", "링크를 복사했어요")와 확인 다이얼로그("메뉴를 삭제할까요?")를 공통 컴포넌트로 만든다.

## 문구 작성

- 버튼은 **누르면 무슨 일이 일어나는지** 말한다. "확인"이 아니라 "오픈하기".
- 같은 동작은 전체 흐름에서 같은 단어를 쓴다. "오픈하기"를 눌렀으면 토스트도 "오픈했어요".
- 에러는 사과하지 말고 원인과 해결책을 말한다.
- 빈 화면은 다음 행동을 안내한다.

## 완료 기준

작업을 끝냈다고 보고하기 전에:

- [ ] `npm run lint` 통과
- [ ] 360px 폭에서 깨지지 않음
- [ ] 하드코딩된 색·간격 없음
- [ ] 로딩·에러·빈 상태가 있음
