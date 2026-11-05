import { renderAppIcon } from "@/lib/og/appIcon";

/*
 * 탭 아이콘(파비콘). 그림은 lib/og/appIcon.tsx에 있다.
 * 64px로 만들어 두면 브라우저가 16 · 32px로 줄여 쓴다. 고해상도 화면에서도 선명하다.
 */
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return renderAppIcon(size.width, true);
}
