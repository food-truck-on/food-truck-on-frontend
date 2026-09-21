"use client";

import { CustomOverlayMap, Map } from "react-kakao-maps-sdk";
import { Icon } from "@/components/Icon/Icon";
import type { MapStatus } from "@/lib/map/kakao";
import styles from "./LocationScreen.module.css";

type Props = {
  status: MapStatus;
  /** 지도 가운데. 고른 위치가 있으면 그 위치 */
  center: { lat: number; lng: number };
  /** 고른 위치. 없으면 핀을 찍지 않는다 */
  picked: { lat: number; lng: number; name: string } | null;
};

/**
 * 위치 정하기 화면의 지도. 피그마 `02` `03`의 지도 목업 자리.
 *
 * 기본 MapMarker는 브랜드 표현이 안 돼서 CustomOverlayMap으로 핀을 직접 그린다(docs/frontend.md).
 * 핀 위에 장소 이름을 붙인다. "현재 위치 불러오기"로 고르면 목록에 선택 표시가 없어서
 * 무엇을 골랐는지 알려줄 곳이 지도뿐이다.
 *
 * 지도가 안 떠도 화면은 동작한다. 아래 목록에서 고르면 그대로 저장된다.
 */
export function LocationMap({ status, center, picked }: Props) {
  if (status === "loading") {
    return <div className={styles.mapSkeleton} aria-hidden="true" />;
  }

  if (status === "error") {
    return (
      <div className={styles.mapFallback} role="status">
        <p className={styles.mapFallbackTitle}>지도를 불러오지 못했어요</p>
        <p className={styles.mapFallbackDesc}>
          아래 자주 가는 장소에서 고르면 그대로 설정돼요
        </p>
      </div>
    );
  }

  return (
    <div className={styles.map}>
      <Map
        center={center}
        isPanto
        level={4}
        className={styles.mapCanvas}
        aria-label={picked ? `지도. ${picked.name}에 핀이 있어요` : "지도"}
      >
        {picked ? (
          <CustomOverlayMap position={picked} yAnchor={1}>
            <div className={styles.pin}>
              <span className={styles.pinLabel}>{picked.name}</span>
              <span className={styles.pinHead}>
                <Icon name="pin" size="sm" />
              </span>
              <span className={styles.pinTail} />
            </div>
          </CustomOverlayMap>
        ) : null}
      </Map>
    </div>
  );
}
