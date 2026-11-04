"use client";

import { useSyncExternalStore } from "react";
import { formatDuration, minutesUntilClose } from "@/lib/time";
import styles from "./SharedTruckScreen.module.css";

/*
 * 지금 시각을 분 단위로 읽는다. 30초마다 다시 읽어서 분이 바뀌면 다시 그린다.
 *
 * 서버에서 그릴 때는 null을 준다. 서버와 손님 기기의 시각이 다르면
 * 화면이 어긋나서(hydration 오류) 남은 시간은 브라우저에서만 그린다.
 */
function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
const getMinuteStamp = () => Math.floor(Date.now() / 60_000);
const getServerStamp = () => null;

type Props = {
  openTime: string | null;
  closeTime: string;
};

/**
 * "마감까지 2시간 10분 남았어요".
 * 마감 시각이 지났으면 **아무것도 그리지 않는다.** 음수를 보여주지 않고, 영업 중 배지만 남긴다.
 * 상태를 "종료"로 바꾸지도 않는다 — 마감은 사장님이 직접 누른다(product-rules.md).
 */
export function RemainingTime({ openTime, closeTime }: Props) {
  const stamp = useSyncExternalStore(subscribe, getMinuteStamp, getServerStamp);
  if (stamp === null) return null;

  const left = minutesUntilClose(stamp * 60_000, openTime, closeTime);
  if (left === null) return null;

  return <p className={styles.remaining}>마감까지 {formatDuration(left)} 남았어요</p>;
}
