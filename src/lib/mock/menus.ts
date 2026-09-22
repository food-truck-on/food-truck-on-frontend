import { mockFetch } from "./mockFetch";
import type { Menu } from "./types";

/** 오늘 날짜(KST)를 "2026-09-17" 모양으로. 서버가 sold_out_date에 넣는 값과 같은 모양이다 */
function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/**
 * 목데이터 원본. 화면이 깨지는지 보려고 일부러 넣은 칸이 있다.
 * - 15자 넘는 메뉴명 — "매콤 크림치즈 타코야끼 세트"
 * - 품절 메뉴 하나
 */
let menus: Menu[] = [
  {
    id: 1,
    name: "타코야끼 8알",
    price: 5000,
    is_sold_out: false,
    sold_out_date: null,
    is_active: true,
  },
  {
    id: 2,
    name: "타코야끼 12알",
    price: 7000,
    is_sold_out: false,
    sold_out_date: null,
    is_active: true,
  },
  {
    id: 3,
    name: "매콤 크림치즈 타코야끼 세트",
    price: 9500,
    is_sold_out: true,
    sold_out_date: todayKst(),
    is_active: true,
  },
  {
    id: 4,
    name: "콜라",
    price: 2000,
    is_sold_out: false,
    sold_out_date: null,
    is_active: true,
  },
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

  // 실패하지 않았을 때만 원본에 넣는다. 다른 화면을 다녀와도 목록에 남는다
  menus = [...menus, created];
  return created;
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
