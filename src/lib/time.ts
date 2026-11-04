/**
 * 영업시간 표시용 유틸. 사장님 홈과 손님 공유 페이지가 같은 문구를 쓰게 한 곳에 둔다.
 *
 * 시각은 명세대로 "16:00" 같은 24시간제 글자로 오간다(6-1 · 6-2).
 */

/** "16:00" → "오후 4시", "16:30" → "오후 4시 30분" */
export function formatTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  const meridiem = hour < 12 ? "오전" : "오후";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${meridiem} ${display}시`
    : `${meridiem} ${display}시 ${minute}분`;
}

/** "16:00" "21:00" → "오후 4시 ~ 오후 9시". 한쪽이라도 없으면 null */
export function formatHours(
  open: string | null | undefined,
  close: string | null | undefined,
): string | null {
  if (!open || !close) return null;
  return `${formatTime(open)} ~ ${formatTime(close)}`;
}

const MINUTES_PER_DAY = 24 * 60;
const KST_OFFSET_MINUTES = 9 * 60;

function toMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

/**
 * 마감까지 남은 분. 마감 시각이 지났으면 null.
 *
 * **이 값으로 영업 상태를 바꾸지 마라.** 마감 시각은 손님에게 보여주는 안내일 뿐이고,
 * 영업 종료는 사장님이 직접 누른다(product-rules.md "영업 상태 판정").
 * 마감 시각이 지났는데 아직 영업 중이면 남은 시간 표시만 지운다. 음수를 보여주지 않는다.
 *
 * 마감이 오픈보다 이르면(오후 6시 ~ 새벽 2시) 자정을 넘겨 닫는 것으로 본다.
 *
 * @param nowMs  지금 시각(epoch ms). 기기 시간대와 무관하게 한국 시각으로 계산한다
 */
export function minutesUntilClose(
  nowMs: number,
  openTime: string | null,
  closeTime: string,
): number | null {
  const now =
    (Math.floor(nowMs / 60_000) + KST_OFFSET_MINUTES) % MINUTES_PER_DAY;
  const close = toMinutes(closeTime);
  const open = openTime ? toMinutes(openTime) : null;

  const overnight = open !== null && close <= open;
  const left =
    overnight && now >= open ? close + MINUTES_PER_DAY - now : close - now;

  return left > 0 ? left : null;
}

/** 130 → "2시간 10분", 40 → "40분", 120 → "2시간" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}분`;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}
