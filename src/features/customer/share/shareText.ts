import type { SharedTruck } from "@/lib/mock/types";
import { formatHours, formatTime } from "@/lib/time";

/*
 * 카카오톡 미리보기에 들어가는 문구. 미리보기 제목·설명(generateMetadata)과
 * 미리보기 이미지(opengraph-image)가 같은 말을 하도록 한 곳에 둔다.
 *
 * product-rules.md: 미리보기 카드에 **트럭 이름 + 오늘 위치 + 영업 상태**가 담겨야 한다.
 */

/** 상태 배지 글자. 색과 함께 반드시 글자로도 보인다 */
export function statusLabel(truck: SharedTruck): string {
  switch (truck.status) {
    case "open":
      return "영업 중";
    case "preparing":
      return "준비 중";
    case "closed":
      return "영업 종료";
    default:
      return "오늘은 쉬어요";
  }
}

/** "타코야끼 달인 · 영업 중" */
export function shareTitle(truck: SharedTruck): string {
  return `${truck.name} · ${statusLabel(truck)}`;
}

/** 미리보기 설명 한 줄. 손님이 링크를 누르기 전에 "지금 가면 살 수 있는지"를 알 수 있게 쓴다 */
export function shareDescription(truck: SharedTruck): string {
  const place = truck.location_label;
  const hours = formatHours(truck.open_time, truck.close_time);

  switch (truck.status) {
    case "open":
      return [place && `오늘 ${place}`, hours].filter(Boolean).join(" · ");
    case "preparing":
      return place && truck.open_time
        ? `오늘 ${place}에서 ${formatTime(truck.open_time)}에 열어요`
        : "오늘 영업을 준비하고 있어요";
    case "closed":
      return "오늘 영업을 마쳤어요. 같은 링크로 다음 영업 위치를 볼 수 있어요";
    default:
      return "오늘은 영업하지 않아요. 같은 링크로 다음 영업 위치를 볼 수 있어요";
  }
}
