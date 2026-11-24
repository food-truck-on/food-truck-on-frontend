import { mockFetch } from "./mockFetch";
import type { LocationFavoriteResult, SavedLocation } from "./types";

/**
 * 목데이터 원본. 지도가 첫 장소를 가운데에 두므로 홍대입구역 둘레의 실제 지명으로 잡았다(2026-11-24).
 * 피그마 `02 위치 정하기 / 기본`의 "행복아파트 정문" 같은 가상 지명은 지도 위 동네와 맞지 않아 바꿨다.
 * 좌표는 근삿값이다. `address`는 그대로 손님에게 보이는 위치 문구가 되므로 "~앞"처럼 찾아올 수 있게 쓴다.
 */
let savedLocations: SavedLocation[] = [
  {
    id: 1,
    name: "홍대입구역 3번 출구",
    address: "홍대입구역 3번 출구 앞",
    latitude: 37.5577,
    longitude: 126.9248,
    is_favorite: false,
  },
  {
    id: 2,
    name: "연트럴파크 입구",
    address: "경의선숲길 연남동 입구",
    latitude: 37.5592,
    longitude: 126.9236,
    is_favorite: false,
  },
  {
    id: 3,
    name: "홍대 걷고싶은거리",
    address: "걷고싶은거리 버스킹존 옆",
    latitude: 37.5548,
    longitude: 126.9221,
    is_favorite: false,
  },
];

/**
 * 3-1. GET /api/v1/food-trucks/:foodTruckId/locations 자리.
 * ?mock=empty 이면 빈 배열을 돌려준다 — 자주 가는 장소를 하나도 안 만든 사장님.
 */
export function getSavedLocations(): Promise<SavedLocation[]> {
  return mockFetch(savedLocations, []);
}

/**
 * 별 켜기·끄기. **명세에 없는 엔드포인트다.** 요청해 둔 모양은
 * `PATCH /api/v1/food-trucks/:foodTruckId/locations/:locationId` (body: `{ "is_favorite": true }`).
 *
 * 현재 값을 뒤집지 않고 바꿀 값을 받는다. 연타·재시도로 두 번 보내도 결과가 같아야 한다
 * (품절 토글 4-6에 같은 이유로 요청한 것과 같다).
 */
export async function setLocationFavorite(
  locationId: number,
  isFavorite: boolean,
): Promise<LocationFavoriteResult> {
  const result = await mockFetch<LocationFavoriteResult>({
    id: locationId,
    is_favorite: isFavorite,
  });

  // 실패하지 않았을 때만 원본을 바꾼다. 다른 화면을 다녀와도 유지된다
  savedLocations = savedLocations.map((place) =>
    place.id === result.id ? { ...place, is_favorite: result.is_favorite } : place,
  );
  return result;
}
