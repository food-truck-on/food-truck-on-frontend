/**
 * 백엔드 API 응답 모양을 그대로 옮긴 타입.
 * 원본: https://github.com/food-truck-on/food-truck-on-backend/blob/main/API_SPEC.md
 *
 * **필드 이름을 바꾸지 마라.** `is_sold_out` 같은 snake_case도 그대로 둔다.
 * 프론트 입맛대로 `isSoldOut`으로 바꾸면 연동할 때 전부 다시 고쳐야 한다.
 */

/** 오늘 영업 상태. 명세 2-1, 5-1 */
export type SessionStatus = "preparing" | "open" | "closed";

/**
 * 2-1. GET /api/v1/food-trucks/me — 내 푸드트럭 조회
 *
 * - share_url: 명세 안에서도 표기가 달라 수정을 요청해 둔 상태다. 지금은 명세 그대로 문자열로 둔다
 * - today_session: 오늘 세션이 아직 없을 때 null이 오는지 명세에 없다. 확인 필요
 */
export type MyFoodTruck = {
  id: number;
  name: string;
  share_url: string;
  today_session: {
    status: SessionStatus;
    location_label: string;
    menu_count: number;
  };
};

/**
 * 4-1. GET /api/v1/food-trucks/:foodTruckId/menus — 메뉴 목록 조회 (배열의 한 칸)
 *
 * - sold_out_date: 품절이 아니면 null, 품절이면 "2026-09-09" 같은 날짜 글자
 * - 오늘(KST) 날짜가 아니면 서버가 is_sold_out을 false로 내려준다. 프론트에서 날짜를 비교하지 않는다
 */
export type Menu = {
  id: number;
  name: string;
  price: number;
  is_sold_out: boolean;
  sold_out_date: string | null;
  is_active: boolean;
};

/**
 * 5-1. GET /api/v1/food-trucks/:foodTruckId/sessions/today — 오늘 세션 조회
 *
 * - 오늘 세션이 아직 없을 때 뭐가 오는지 명세에 없다. 백엔드에 물어봐 둔 상태다(status.md).
 *   답이 오기 전까지 `getTodaySession()`이 null을 돌려주는 것으로 가정하고 화면을 만든다
 * - menus: 명세 예시가 `{ id: 1, name: "타코야끼 8알 외 2개" }`로 **데이터가 아니라 화면 문구**다.
 *   "외 N개"는 프론트가 조합할 몫이라 수정 요청을 걸어 뒀다(status.md). 지금은 명세 그대로 둔다
 * - open_time / close_time이 없다. 피그마 `05 홈 / 영업시간 모달`에서 정한 값을
 *   저장할 곳도, 홈에 다시 띄울 곳도 없다. 손님용 6-1·6-2에만 있다 → status.md에 요청 추가
 */
export type TodaySession = {
  id: number;
  date: string;
  status: SessionStatus;
  location_label: string;
  menu_count: number;
  menus: { id: number; name: string }[];
  /**
   * **아직 명세에 없는 두 칸이다. 2026-09-20 백엔드에 추가를 요청했다.**
   * 손님용 6-1·6-2에는 같은 이름으로 이미 있어서 그 이름을 그대로 썼다.
   * 홈(`12`·`15`)이 영업시간을 표시하므로 없으면 화면을 못 만든다.
   * 답이 오면 이 주석을 지운다. 이름이 다르게 정해지면 여기만 고친다.
   */
  open_time: string | null;
  close_time: string | null;
};

/** 5-2. POST /api/v1/sessions/:sessionId/open — 오픈하기 */
export type OpenResult = {
  id: number;
  status: SessionStatus;
  opened_at: string;
  share_url: string;
};

/** 5-3. POST /api/v1/sessions/:sessionId/close — 영업 종료 */
export type CloseResult = {
  id: number;
  status: SessionStatus;
};
