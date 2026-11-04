import { cache } from "react";
import { mockFetch, type MockScenario } from "./mockFetch";
import type { SharedTruck } from "./types";

/**
 * 공유 링크(`/t/:slug`) 목데이터. 슬러그마다 영업 상태가 다르게 넣어 두어
 * 주소만 바꿔서 네 화면을 다 볼 수 있다.
 *
 *   /t/takoyaki-dalin              영업 중 (긴 메뉴명 · 품절 메뉴 포함)
 *   /t/gilgeori-tteokbokki         준비 중
 *   /t/wangmandu-halmeoni          영업 종료
 *   /t/sotddukkeong-dakgangjeong   오늘은 쉬어요
 *   /t/아무거나                     없는 트럭
 *
 * **슬러그 규칙은 `[미정]`이다(product-rules.md "공유 링크").** 여기 슬러그는 영문 임시값이고,
 * 생성 규칙과 중복 처리는 정하지 않았다. 트럭 이름도 화면흐름도의 예시를 그대로 썼다.
 *
 * 사장님 화면 목데이터(trucks.ts · sessions.ts)와는 따로 논다. 사장님이 오픈해도 여기는 안 바뀐다.
 * 사장님 쪽은 브라우저 메모리에 있고, 이 페이지는 서버에서 그려지기 때문이다. 연동하면 서버 한 곳으로 모인다.
 */
const sharedTrucks: Record<string, SharedTruck> = {
  "takoyaki-dalin": {
    id: 1,
    name: "타코야끼 달인",
    status: "open",
    location_label: "행복아파트 정문 앞",
    open_time: "16:00",
    close_time: "21:00",
    distance_m: null,
    latitude: 37.4979,
    longitude: 127.0276,
    menus: [
      { id: 1, name: "타코야끼 8알", price: 5000, is_sold_out: false },
      { id: 2, name: "타코야끼 12알", price: 7000, is_sold_out: false },
      { id: 3, name: "매콤 크림치즈 타코야끼 세트", price: 9000, is_sold_out: false },
      { id: 4, name: "치즈 타코야끼", price: 6000, is_sold_out: true },
    ],
  },
  "gilgeori-tteokbokki": {
    id: 2,
    name: "길거리 떡볶이",
    status: "preparing",
    location_label: "중앙공원 주차장 입구",
    open_time: "15:00",
    close_time: "20:00",
    distance_m: null,
    latitude: 37.5013,
    longitude: 127.0396,
    menus: [
      { id: 11, name: "국물 떡볶이", price: 4000, is_sold_out: false },
      { id: 12, name: "모둠 튀김", price: 5000, is_sold_out: false },
    ],
  },
  "wangmandu-halmeoni": {
    id: 3,
    name: "왕만두 할머니",
    status: "closed",
    location_label: "시장 입구 오른쪽",
    open_time: "10:00",
    close_time: "18:00",
    distance_m: null,
    latitude: 37.4955,
    longitude: 127.0301,
    menus: [{ id: 21, name: "고기 왕만두 5개", price: 5000, is_sold_out: false }],
  },
  "sotddukkeong-dakgangjeong": restDay(4, "솥뚜껑 닭강정"),
};

/** 오늘 세션이 없는 트럭. 명세에 없어 가정한 모양이다(types.ts SharedTruck) */
function restDay(id: number, name: string): SharedTruck {
  return {
    id,
    name,
    status: null,
    location_label: null,
    open_time: null,
    close_time: null,
    distance_m: null,
    latitude: null,
    longitude: null,
    menus: [],
  };
}

/**
 * 6-2. GET /api/v1/customer/food-trucks/:shareSlug 자리. 없는 슬러그면 null.
 *
 * `cache`로 감싸서 한 요청 안에서는 한 번만 부른다.
 * 페이지 본문과 카카오톡 미리보기(generateMetadata)가 같은 데이터를 쓰기 때문이다.
 *
 * @param scenario 서버에는 주소창이 없어서 페이지가 ?mock= 값을 받아 넘긴다.
 *                 ?mock=empty 는 "오늘은 쉬어요"를 보여준다
 */
export const getSharedTruck = cache(
  (slug: string, scenario: MockScenario): Promise<SharedTruck | null> => {
    const truck = sharedTrucks[slug] ?? null;
    const rest = truck ? restDay(truck.id, truck.name) : null;
    return mockFetch(truck, rest, scenario);
  },
);
