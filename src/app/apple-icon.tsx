import { renderAppIcon } from "@/lib/og/appIcon";

/*
 * 아이폰 "홈 화면에 추가" 아이콘. iOS가 모서리를 직접 둥글게 깎으므로 네모로 준다.
 * 둥글게 주면 깎인 모서리 밖으로 흰 귀퉁이가 남는다.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderAppIcon(size.width, false);
}
