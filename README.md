# 푸드트럭ON · Frontend

푸드트럭 사장님이 오늘의 위치 · 영업시간 · 메뉴를 등록하면, 손님이 링크나 지도로 바로 확인하는 서비스입니다.
**손님은 앱을 설치하지 않아도** 카카오톡으로 받은 링크 하나로 오늘 트럭이 어디 있는지 알 수 있습니다.

> 🚧 **개발 중** — 1차 마감 2026-09-26
> 배포 링크와 화면 스크린샷은 배포 후 추가합니다.

<!-- 배포 후 채울 자리
## 바로가기

- 서비스: https://
- 공유 링크 예시: https:///t/
-->

## 주요 기능

**사장님**
- 오늘 영업 준비 — 위치 정하기 → 영업시간 → 메뉴 정하기 → 오픈하기
- 영업 중 품절 처리 (품절은 그날 하루만 유지)
- 손님에게 보낼 공유 링크 복사
- 영업 마감

**손님** — 로그인 없이 이용
- 공유 링크(`/t/:slug`)로 트럭 한 곳의 오늘 영업 정보 확인
- 카카오톡에 링크를 붙이면 트럭 이름 · 위치 · 영업 상태가 담긴 미리보기 카드 표시
- 주변 트럭 지도

## 기술 스택

| 구분 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 언어 | TypeScript |
| 스타일 | CSS Modules + 디자인 토큰(CSS 변수) |
| 지도 | 카카오맵 (`react-kakao-maps-sdk`, 예정) |
| 배포 형태 | 웹 + 네이티브 웹뷰 앱. 장기 목표는 앱인토스 미니앱 |

**Next.js를 고른 이유** — 공유 링크의 카카오톡 미리보기(OG 태그)는 서버가 HTML을 만들어 줘야 뜹니다.
순수 CSR(Vite + React)로 만들면 카카오톡이 빈 HTML을 받아가 미리보기가 나오지 않고,
이를 위해 서버를 따로 세우면 배포 대상이 둘로 늘어납니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드
npm run lint    # 린트
```

개발 중에는 `http://localhost:3000/dev/components`에서 공통 컴포넌트를 한눈에 볼 수 있습니다. (배포 전 삭제)

## 폴더 구조

```
src/
  app/          라우트 화면 (App Router). 폴더 이름이 곧 URL
  components/   공통 컴포넌트
  features/     도메인별 묶음 (owner / customer / auth)
  lib/          API 클라이언트, 지도 래퍼, 목데이터
  styles/       tokens.css — 색 · 간격 · 글자 크기의 유일한 정의처
```

## 디자인 시스템

피그마 컴포넌트와 이름 · 상태를 1:1로 맞춥니다.

| 컴포넌트 | 상태 |
|---|---|
| `Button` | primary · secondary · kakao · google / default · pressed · disabled · loading |
| `TextInput` | default · focus · error |
| `Toggle` | on · off · disabled |
| `MenuCard` | available · soldout |
| `BottomNav` | 사장님 전용 3탭 |
| `Toast` · `ConfirmDialog` | — |

- 색은 **원시 토큰과 의미 토큰 2단**으로 나눴습니다. 나중에 토스 디자인 시스템(TDS)으로 옮길 때 의미 토큰의 값만 바꾸면 됩니다.
- 야외 햇빛 아래에서 쓰는 앱이라 **텍스트 대비 4.5:1**, **터치 영역 44px**을 지킵니다. 상태는 색만으로 표현하지 않습니다.
- 최소 지원 폭 360px.

## 문서

| 문서 | 내용 |
|---|---|
| [`docs/product-rules.md`](docs/product-rules.md) | 제품 규칙 — 영업 상태 판정, 품절, 공유 링크, 알림 범위 |
| [`docs/design-system.md`](docs/design-system.md) | 디자인 토큰, 컴포넌트, 접근성 기준 |
| [`docs/frontend.md`](docs/frontend.md) | 스택 결정 근거, 라우팅, 웹뷰 대응 |
| [`docs/devlog/`](docs/devlog) | 개발일지 — 매일 무엇을 왜 했는지 |

## 관련 레포

- Backend — [food-truck-on/food-truck-on-backend](https://github.com/food-truck-on/food-truck-on-backend) (Node.js, EC2)

## 팀

| 역할 | |
|---|---|
| 디자인 · 프론트엔드 | [@yemurf](https://github.com/yemurf) |
| 백엔드 | |
