import { ImageResponse } from "next/og";
import { token } from "./tokens";

/**
 * 탭 아이콘(파비콘) · 홈 화면 아이콘.
 *
 * `logo.png`를 그대로 줄이면 16px에서 트럭이 5px쯤 되어 흰 줄로만 보인다.
 * 로고에는 둘레 여백과 그림자가 있어서 주황 칸도 작아지고 테두리가 번진다(2026-11-05).
 * 그래서 작은 크기 전용으로 다시 그렸다.
 *   - 여백·그림자 없이 칸을 꽉 채운다
 *   - 트럭을 칸 폭의 약 75%로 키운다
 *   - 16px에서도 남는 굵은 도형만 쓴다: 짐칸 · 판매 창 · 운전석 창 · 바퀴 둘
 *
 * 색은 tokens.css에서 읽는다(lib/og/tokens.ts). 로고와 같은 주황 칸 + 흰 트럭이다.
 *
 * @param rounded 탭 아이콘은 둥근 칸. 아이폰 홈 화면은 iOS가 모서리를 직접 깎으므로 네모로 준다
 */
export function renderAppIcon(size: number, rounded: boolean) {
  const brand = token("--brand-primary");
  const body = token("--bg-surface");
  const wheel = token("--text-default");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand,
          borderRadius: rounded ? "22%" : 0,
        }}
      >
        <svg width={size} height={size} viewBox="0 0 64 64">
          {/* 짐칸 */}
          <rect x="6" y="17" width="36" height="25" rx="3" fill={body} />
          {/* 판매 창 — 푸드트럭임을 알리는 가로 창 */}
          <rect x="11" y="22" width="26" height="7" rx="1.5" fill={brand} />
          {/* 운전석 */}
          <rect x="41" y="25" width="17" height="17" rx="3" fill={body} />
          <rect x="45" y="28" width="9" height="6" rx="1.5" fill={brand} />
          {/* 바퀴 — 주황 테로 흰 몸통과 떼어 놓아야 작은 크기에서 뭉개지지 않는다 */}
          <circle cx="18" cy="44" r="6.5" fill={wheel} stroke={brand} strokeWidth="2.5" />
          <circle cx="47" cy="44" r="6.5" fill={wheel} stroke={brand} strokeWidth="2.5" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
