import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * 미리보기 이미지(next/og)용 디자인 토큰.
 *
 * 미리보기 이미지는 HTML이 아니라 PNG로 그려져서 CSS 변수(`var(--brand-primary)`)를 읽지 못한다.
 * 그렇다고 여기에 `#ff6b35`를 다시 적으면 색 정의가 두 군데가 된다(design-system.md 대원칙 1).
 * 그래서 **`tokens.css`를 직접 읽어서** 값을 꺼낸다. 색을 바꾸면 이미지도 같이 바뀐다.
 *
 * 서버에서만 쓴다(node:fs).
 */
const css = readFileSync(join(process.cwd(), "src/styles/tokens.css"), "utf8")
  // 주석 안에도 `--orange-500: #ff6b35` 같은 예시가 있다. 먼저 지워야 엉뚱한 값을 읽지 않는다
  .replace(/\/\*[\s\S]*?\*\//g, "");

const raw = new Map<string, string>();
for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
  raw.set(match[1], match[2].trim());
}

/** `--brand-primary` → `var(--orange-500)` → `#ff6b35`처럼 끝까지 따라가 실제 값을 돌려준다 */
export function token(name: `--${string}`): string {
  let value = raw.get(name);
  for (let depth = 0; value?.startsWith("var(") && depth < 5; depth += 1) {
    value = raw.get(value.slice(4, -1).trim());
  }
  if (!value) throw new Error(`tokens.css에 ${name}이 없어요`);
  return value;
}

/**
 * 이미지 캔버스는 1200×630이다. 앱 화면(기준 폭 393px)의 약 3배라서
 * 간격·글자 크기 토큰을 3배로 키워 쓴다. 숫자를 따로 정하지 않고 앱과 비율을 맞춘다.
 */
export const OG_SCALE = 3;

/** `--space-5`(24px) → 72 */
export function scaled(name: `--${string}`): number {
  return Number.parseFloat(token(name)) * OG_SCALE;
}
