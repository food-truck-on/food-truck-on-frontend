import { mockFetch } from "./mockFetch";
import type { MyFoodTruck } from "./types";

/**
 * 목데이터 원본. 값은 마음대로 바꿔도 되지만 모양은 types.ts를 따른다.
 * 타입을 붙여두면 필드 이름을 틀렸을 때 에디터가 바로 빨간 줄을 긋는다.
 */
const myFoodTruck: MyFoodTruck = {
  id: 1,
  name: "타코야끼 달인",
  share_url: "https://오늘어디서팔아요.kr/tk-달인-오늘",
  today_session: {
    status: "preparing",
    location_label: "행복아파트 정문 앞",
    menu_count: 3,
  },
};

/**
 * 2-1. GET /api/v1/food-trucks/me 자리.
 *
 * 화면은 이 함수만 부른다. 연동하는 날에는 **이 함수 안쪽만** 진짜 fetch로 바꾸고,
 * 화면 코드는 한 줄도 건드리지 않는다.
 *
 * @example
 * const truck = await getMyFoodTruck();
 * truck.name // "타코야끼 달인"
 */
export function getMyFoodTruck(): Promise<MyFoodTruck> {
  return mockFetch(myFoodTruck);
}
