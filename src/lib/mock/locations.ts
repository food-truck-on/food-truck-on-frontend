import { mockFetch } from "./mockFetch";
import type { LocationFavoriteResult, SavedLocation } from "./types";

/**
 * 목데이터 원본. 이름·주소는 피그마 `02 위치 정하기 / 기본`과 같다.
 * 좌표는 지도에 핀이 서로 가깝게 찍히도록 서울 마포구 한 동네로 잡았다. 실제 장소가 아니다.
 */
let savedLocations: SavedLocation[] = [
  {
    id: 1,
    name: "행복아파트 정문",
    address: "행복아파트 정문 앞",
    latitude: 37.5563,
    longitude: 126.9236,
    is_favorite: false,
  },
  {
    id: 2,
    name: "중앙공원 주차장",
    address: "중앙공원 주차장 입구",
    latitude: 37.5585,
    longitude: 126.9265,
    is_favorite: false,
  },
  {
    id: 3,
    name: "시장 입구",
    address: "전통시장 정문 앞",
    latitude: 37.5541,
    longitude: 126.921,
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
