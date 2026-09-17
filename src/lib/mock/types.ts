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
