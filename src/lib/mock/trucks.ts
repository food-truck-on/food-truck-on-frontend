import { ApiError, mockFetch } from "./mockFetch";
import type { CreateFoodTruckResult, MyFoodTruck } from "./types";

/**
 * 목 슬러그. 명세 예시는 한글 슬러그(tk-달인-오늘)다. 슬러그 규칙이 [미정]이라 영문 임시값으로 바꿨다(11/4).
 * 미리보기 버튼이 /t/takoyaki-dalin(sharedTrucks.ts)으로 이어진다.
 *
 * **새로 등록한 트럭도 이 주소를 그대로 받는다.** 실제 백엔드는 가게 이름으로 링크를 만들지만,
 * 그 규칙(생성 방식·중복 처리)이 정해지지 않아서(product-rules.md `[미정] 슬러그 규칙`) 프론트에서 흉내 내지 않는다.
 * 그래서 목데이터에서는 가게 이름을 바꿔 등록해도 미리보기 페이지는 "타코야끼 달인"으로 보인다.
 */
const MOCK_SHARE_URL = "https://오늘어디서팔아요.kr/takoyaki-dalin";

/**
 * 목데이터 원본. 값은 마음대로 바꿔도 되지만 모양은 types.ts를 따른다.
 * 타입을 붙여두면 필드 이름을 틀렸을 때 에디터가 바로 빨간 줄을 긋는다.
 *
 * 트럭이 없는 사장님이면 null이다(가입만 하고 아직 가게 이름을 등록하지 않음).
 * 다른 목데이터처럼 탭 메모리에 있어서 새로고침하면 이 값으로 돌아간다.
 */
let myFoodTruck: MyFoodTruck | null = {
  id: 1,
  name: "타코야끼 달인",
  share_url: MOCK_SHARE_URL,
  today_session: {
    status: "preparing",
    location_label: "홍대입구역 3번 출구 앞",
    menu_count: 3,
  },
};

/**
 * 주소 끝의 ?truck= 값. 트럭이 없는 사장님의 화면을 볼 때 쓴다.
 *
 *   ?truck=none   트럭을 **지운다.** 가게 이름 등록 화면(/owner/setup)을 처음부터 밟아 볼 수 있다
 *   ?truck=taken  조회는 "없음"인데 등록하면 "이미 있음"(409)이 온다.
 *                 다른 기기에서 먼저 등록한 경우를 볼 때 쓴다
 *
 * `?session=none`은 읽을 때마다 덮어쓰지만 `?truck=none`은 탭 메모리에서 지워 둔다.
 * 홈이 등록 화면으로 보낼 때 주소의 ?truck=none이 떨어져 나가기 때문이다.
 * 읽을 때만 덮어쓰면 등록 화면에서는 트럭이 다시 살아나 홈으로 되돌아간다.
 */
function truckParam(): string | null {
  // 서버에서 실행될 때는 주소창이 없다
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("truck");
}

/**
 * 2-1. GET /api/v1/food-trucks/me 자리.
 *
 * **트럭이 없으면 null을 돌려준다.** 실제 API는 이때 404를 준다. 연동하는 날에는 이 함수 안쪽에서
 * 404를 null로 바꾼다. 화면은 `if (!truck)`으로 받으므로 한 줄도 건드리지 않는다.
 *
 * 화면은 이 함수만 부른다. 연동하는 날에는 **이 함수 안쪽만** 진짜 fetch로 바꾼다.
 *
 * @example
 * const truck = await getMyFoodTruck();
 * if (!truck) router.replace("/owner/setup");
 */
export function getMyFoodTruck(): Promise<MyFoodTruck | null> {
  const param = truckParam();
  if (param === "none") myFoodTruck = null;

  return mockFetch<MyFoodTruck | null>(param === "taken" ? null : myFoodTruck);
}

/**
 * "이미 트럭이 있다"는 오류의 code. 실제 API는 이때 409를 준다.
 * 명세의 code 문자열은 확인하지 못했다 — 화면은 이 문자열 대신 `isTruckExistsError()`로만 판단한다.
 */
const TRUCK_EXISTS = "FOOD_TRUCK_ALREADY_EXISTS";

/** 등록하려는데 이미 트럭이 있었는가(409). 화면은 이걸 오류로 보이지 않고 홈으로 보낸다 */
export function isTruckExistsError(error: unknown): boolean {
  return error instanceof ApiError && error.code === TRUCK_EXISTS;
}

/**
 * POST /api/v1/food-trucks 자리. 본문 `{ "name": "타코야끼 달인" }`.
 *
 * - 응답은 `{ id, name, share_url }`다. today_session은 오지 않는다
 * - 이미 트럭이 있으면 409 — `isTruckExistsError()`로 가린다
 * - 이름 수정 API가 없다. 한 번 등록한 이름은 지금은 고칠 수 없다
 *
 * 성공하면 탭 메모리에 남는다. 이어서 `getMyFoodTruck()`을 부르면 이 트럭이 온다.
 *
 * @param name 가게 이름. 앞뒤 공백을 떼고 20자 이하인지는 화면이 먼저 확인한다
 */
export async function createFoodTruck(
  name: string,
): Promise<CreateFoodTruckResult> {
  const created = await mockFetch<CreateFoodTruckResult>({
    id: 1,
    name,
    share_url: MOCK_SHARE_URL,
  });

  if (truckParam() === "taken" || myFoodTruck !== null) {
    throw new ApiError(TRUCK_EXISTS, "이미 등록한 푸드트럭이 있어요");
  }

  // 실패하지 않았을 때만 원본에 넣는다. 오늘 세션은 아직 아무것도 정하지 않은 상태다
  myFoodTruck = {
    ...created,
    today_session: { status: "preparing", location_label: "", menu_count: 0 },
  };
  return created;
}
