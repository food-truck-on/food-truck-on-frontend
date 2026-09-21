"use client";

import { useKakaoLoader } from "react-kakao-maps-sdk";

/**
 * 카카오맵 SDK 래퍼. 화면은 SDK를 직접 부르지 않고 여기만 거친다.
 *
 * 키는 `.env.local`의 NEXT_PUBLIC_KAKAO_MAP_KEY(JavaScript 키).
 * **개발 주소와 배포 주소를 모두 카카오 개발자 콘솔 허용 도메인에 등록해야 지도가 뜬다.**
 * 등록이 안 된 주소에서는 SDK가 불러와지지 않아 "error"가 된다.
 */

export type MapStatus = "loading" | "ready" | "error";

/** 지도 기본 중심. 보여줄 위치가 하나도 없을 때만 쓴다 (서울시청) */
export const DEFAULT_CENTER = { lat: 37.5666, lng: 126.9784 };

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

/**
 * SDK를 한 번만 불러온다. 여러 화면에서 불러도 스크립트는 한 번만 붙는다.
 * services는 좌표 → 주소 변환(reverseGeocode)과 장소 검색에 필요하다.
 */
export function useKakaoMap(): MapStatus {
  const [loading, error] = useKakaoLoader({
    appkey: APP_KEY,
    libraries: ["services"],
  });

  if (!APP_KEY || error) return "error";
  return loading ? "loading" : "ready";
}

/**
 * 좌표를 사람이 읽는 주소로 바꾼다. 도로명 주소가 있으면 도로명, 없으면 지번.
 * useKakaoMap()이 "ready"가 된 뒤에만 부른다.
 *
 * @example
 * await reverseGeocode(37.5666, 126.9784) // "서울 중구 세종대로 110"
 */
export function reverseGeocode(lat: number, lng: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(lng, lat, (result, status) => {
      const first = result[0];
      if (status !== kakao.maps.services.Status.OK || !first) {
        reject(new Error(`주소를 찾지 못했어요 (${status})`));
        return;
      }
      resolve(first.road_address?.address_name ?? first.address.address_name);
    });
  });
}
