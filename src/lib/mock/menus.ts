import { mockFetch } from "./mockFetch";
import { syncSessionMenus } from "./sessions";
import type { ImportYesterdayResult, Menu } from "./types";

/** 오늘 날짜(KST)를 "2026-09-17" 모양으로. 서버가 sold_out_date에 넣는 값과 같은 모양이다 */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * 목데이터 원본 — **오늘 팔 메뉴**다. 아무것도 정하지 않은 하루는 비어 있다(2026-11-11).
 *
 * 전에는 트럭 전체 메뉴 4개가 처음부터 들어 있었다. 그런데 홈은 "메뉴: 아직 설정하지 않았어요"였고,
 * "어제 메뉴 불러오기"를 눌러도 이 목록은 그대로였다. 목록과 오늘 영업이 서로 다른 것을 가리켰다.
 * 지금은 피그마 `07`~`11`처럼 빈 목록에서 시작해, 불러오거나 추가한 만큼 채워진다.
 *
 * 품절은 이 목록(그날 스냅샷)에만 기록한다. 다음 날 새 세션이 생기면 저절로 풀린다(product-rules.md "품절").
 */
let menus: Menu[] = [];

/** 목록을 바꾸고, 오늘 세션의 메뉴 요약(홈 "메뉴" 줄 · 오픈 조건)도 같이 맞춘다 */
function commit(next: Menu[], sessionId?: number): void {
  menus = next;
  syncSessionMenus(
    menus.filter((m) => m.is_active),
    sessionId,
  );
}

/**
 * 어제 세션의 메뉴 스냅샷. 어제 가격 그대로다.
 * 화면이 깨지는지 보려고 15자 넘는 메뉴명을 하나 넣었다 — "매콤 크림치즈 타코야끼 세트"
 * (명세 4-5 예시의 세 번째 메뉴 "치즈 타코야끼"를 바꿨다).
 */
const yesterdayMenus: ImportYesterdayResult["menus"] = [
  { id: 1, name: "타코야끼 8알", price: 5000, is_sold_out: false },
  { id: 2, name: "타코야끼 12알", price: 7000, is_sold_out: false },
  { id: 3, name: "매콤 크림치즈 타코야끼 세트", price: 9500, is_sold_out: false },
];

/**
 * 4-1. GET /api/v1/food-trucks/:foodTruckId/menus 자리.
 * ?mock=empty 일 때는 메뉴 0개를 돌려준다.
 */
export function getMenus(): Promise<Menu[]> {
  return mockFetch(menus, []);
}

/** 4-2 요청 본문 */
export type NewMenu = Pick<Menu, "name" | "price">;

/**
 * 4-2. POST /api/v1/food-trucks/:foodTruckId/menus 자리.
 * 새 메뉴는 품절 아님 · 사용 중으로 만들어진다. 목록 맨 끝에 붙는다.
 */
export async function addMenu(body: NewMenu): Promise<Menu> {
  const created = await mockFetch<Menu>({
    id: Math.max(0, ...menus.map((m) => m.id)) + 1,
    name: body.name,
    price: body.price,
    is_sold_out: false,
    sold_out_date: null,
    is_active: true,
  });

  // 실패하지 않았을 때만 원본에 넣는다. 다른 화면을 다녀와도 목록에 남고, 홈의 "메뉴" 줄도 채워진다
  commit([...menus, created]);
  return created;
}

/**
 * 4-5. POST /api/v1/sessions/:sessionId/menus/import-yesterday 자리.
 * 어제 세션의 메뉴를 오늘로 복사한다. 성공하면 이 목록과 홈의 "메뉴" 줄이 같이 채워진다.
 *
 * - 이미 오늘 목록에 있는 이름은 다시 넣지 않는다. 두 번 눌러도 같은 메뉴가 두 장 생기지 않는다
 * - 어제 품절이었어도 오늘은 판매 중으로 들어온다(품절은 당일만 유지)
 * - ?mock=empty 이면 어제 영업이 없던 날로 보고 0개를 돌려준다
 */
export async function importYesterdayMenus(
  sessionId: number,
): Promise<ImportYesterdayResult> {
  const fresh = yesterdayMenus.filter(
    (y) => !menus.some((m) => m.name === y.name),
  );

  const result = await mockFetch<ImportYesterdayResult>(
    { imported_count: fresh.length, menus: fresh },
    { imported_count: 0, menus: [] },
  );

  if (result.imported_count > 0) {
    let nextId = Math.max(0, ...menus.map((m) => m.id)) + 1;
    commit(
      [
        ...menus,
        ...result.menus.map((m) => ({
          id: nextId++,
          name: m.name,
          price: m.price,
          is_sold_out: false,
          sold_out_date: null,
          is_active: true,
        })),
      ],
      sessionId,
    );
  }
  return result;
}

/** 4-6 응답. 명세상 메뉴 전체가 아니라 네 칸만 온다 */
export type SoldOutResult = Pick<
  Menu,
  "id" | "name" | "is_sold_out" | "sold_out_date"
>;

/**
 * 4-6. PATCH /api/v1/food-trucks/:foodTruckId/menus/:menuId/sold-out 자리.
 * 현재 품절 상태를 반전시킨다.
 *
 * **목데이터로만 쓴다.** 실제 API 연결 여부는 docs/product-rules.md "품절"의
 * 백엔드 확인이 끝난 뒤에 정한다.
 */
export async function toggleSoldOut(menuId: number): Promise<SoldOutResult> {
  const menu = menus.find((m) => m.id === menuId);
  if (!menu) throw new Error(`메뉴 ${menuId}를 찾지 못했다`);

  const { id, name, is_sold_out } = menu;
  const next: SoldOutResult = is_sold_out
    ? { id, name, is_sold_out: false, sold_out_date: null }
    : { id, name, is_sold_out: true, sold_out_date: todayKst() };

  const result = await mockFetch(next);
  // 실패하지 않았을 때만 원본을 바꾼다. 서버에 저장된 것처럼 새로고침 전까지 유지된다
  Object.assign(menu, result);
  return result;
}
