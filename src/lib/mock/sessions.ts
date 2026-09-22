import { mockFetch } from "./mockFetch";
import type {
  CloseResult,
  ImportYesterdayResult,
  OpenResult,
  SessionHoursRequest,
  SessionHoursResult,
  SessionLocationRequest,
  SessionLocationResult,
  TodaySession,
} from "./types";

/** 오늘 날짜(KST)를 "2026-09-20" 모양으로. 서버가 date에 넣는 값과 같은 모양이다 */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * 목데이터 원본. 사장님 홈은 이 값의 status에 따라 세 가지로 갈린다.
 *   null      → 01 홈 / 빈 상태
 *   preparing → 12 홈 / 오픈 준비 완료
 *   open      → 15 홈 / 영업 중
 *   closed    → 18 홈 / 영업 종료
 *
 * 화면을 갈아 끼워 보려면 주소 끝에 ?session=… 을 붙인다. mockFetch의 ?mock=… 과 같은 방식이다.
 */
let todaySession: TodaySession | null = {
  id: 1,
  date: todayKst(),
  status: "preparing",
  location_label: "행복아파트 정문 앞",
  menu_count: 3,
  // 명세 예시가 이미 "외 2개"로 조합된 문구다. 수정 요청을 걸어 둔 상태라 명세 그대로 둔다
  menus: [{ id: 1, name: "타코야끼 8알 외 2개" }],
  // 명세에 없는 칸이다. 2026-09-20 추가 요청함(types.ts 주석)
  open_time: "16:00",
  close_time: "21:00",
};

/** 주소 끝의 ?session=none|preparing|open|closed 을 읽는다. 없으면 원본 그대로 */
function scenarioSession(): TodaySession | null {
  if (typeof window === "undefined") return todaySession;

  const value = new URLSearchParams(window.location.search).get("session");
  if (value === "none") return null;
  if (value === "preparing" || value === "open" || value === "closed") {
    return todaySession && { ...todaySession, status: value };
  }
  return todaySession;
}

/**
 * 5-1. GET /api/v1/food-trucks/:foodTruckId/sessions/today 자리.
 *
 * **오늘 세션이 없을 때 null을 돌려준다.** 명세에 안 적힌 부분이라 백엔드에 물어봐 둔 상태고,
 * 답이 오면 types.ts와 이 함수만 고친다. 화면은 `if (!session)`으로 받으므로 영향이 없다.
 *
 * @example
 * const session = await getTodaySession();
 * if (!session) return <빈 상태 />;
 */
export function getTodaySession(): Promise<TodaySession | null> {
  return mockFetch(scenarioSession(), null);
}

/**
 * 5-2. POST /api/v1/sessions/:sessionId/open 자리.
 * 명세상 위치와 메뉴가 모두 설정된 경우에만 성공한다.
 */
export async function openSession(sessionId: number): Promise<OpenResult> {
  const result = await mockFetch<OpenResult>({
    id: sessionId,
    status: "open",
    opened_at: new Date().toISOString(),
    share_url: "https://오늘어디서팔아요.kr/tk-달인-오늘",
  });

  // 실패하지 않았을 때만 원본을 바꾼다. 새로고침 전까지 영업 중으로 유지된다
  if (todaySession) todaySession = { ...todaySession, status: result.status };
  return result;
}

/**
 * 5-3. POST /api/v1/sessions/:sessionId/close 자리.
 * 마감은 사장님이 직접 누른다. 시각이 지났다고 프론트가 상태를 바꾸지 않는다.
 */
export async function closeSession(sessionId: number): Promise<CloseResult> {
  const result = await mockFetch<CloseResult>({
    id: sessionId,
    status: "closed",
  });

  if (todaySession) todaySession = { ...todaySession, status: result.status };
  return result;
}

/**
 * 3-4. PATCH /api/v1/sessions/:sessionId/location 자리.
 * 오늘 영업할 위치를 정한다. 홈의 "위치" 줄이 이 값의 location_label로 바뀐다.
 */
export async function setSessionLocation(
  sessionId: number,
  body: SessionLocationRequest,
): Promise<SessionLocationResult> {
  const result = await mockFetch<SessionLocationResult>({
    session_id: sessionId,
    location_label: body.location_label,
    latitude: body.latitude,
    longitude: body.longitude,
  });

  if (todaySession) {
    todaySession = { ...todaySession, location_label: result.location_label };
  }
  return result;
}

/**
 * 영업시간 저장 자리. **명세에 없다** — `PATCH /api/v1/sessions/:sessionId/hours`로 요청해 둔 상태(status.md).
 * 홈의 "영업시간" 줄이 이 값으로 바뀐다.
 */
export async function setSessionHours(
  sessionId: number,
  body: SessionHoursRequest,
): Promise<SessionHoursResult> {
  const result = await mockFetch<SessionHoursResult>({
    session_id: sessionId,
    open_time: body.open_time,
    close_time: body.close_time,
  });

  if (todaySession) {
    todaySession = {
      ...todaySession,
      open_time: result.open_time,
      close_time: result.close_time,
    };
  }
  return result;
}

/** 어제 세션의 메뉴 스냅샷. 명세 4-5 예시와 같다. 어제 가격 그대로라 오늘 마스터 가격과 다를 수 있다 */
const yesterdayMenus: ImportYesterdayResult["menus"] = [
  { id: 1, name: "타코야끼 8알", price: 5000, is_sold_out: false },
  { id: 2, name: "타코야끼 12알", price: 7000, is_sold_out: false },
  { id: 3, name: "치즈 타코야끼", price: 6000, is_sold_out: false },
];

/**
 * 4-5. POST /api/v1/sessions/:sessionId/menus/import-yesterday 자리.
 * 성공하면 오늘 세션의 메뉴가 채워진다 — 홈의 "메뉴" 줄과 "지금 오픈하기" 조건이 이 값을 본다.
 *
 * ?mock=empty 이면 어제 영업이 없던 날로 보고 0개를 돌려준다.
 */
export async function importYesterdayMenus(
  sessionId: number,
): Promise<ImportYesterdayResult> {
  const result = await mockFetch<ImportYesterdayResult>(
    { imported_count: yesterdayMenus.length, menus: yesterdayMenus },
    { imported_count: 0, menus: [] },
  );

  if (todaySession && todaySession.id === sessionId && result.imported_count > 0) {
    const [first] = result.menus;
    todaySession = {
      ...todaySession,
      menu_count: result.imported_count,
      // 5-1이 "외 N개"로 조합된 문구를 주는 모양을 따른다(수정 요청 중, types.ts)
      menus: [
        {
          id: first.id,
          name:
            result.imported_count > 1
              ? `${first.name} 외 ${result.imported_count - 1}개`
              : first.name,
        },
      ],
    };
  }
  return result;
}
