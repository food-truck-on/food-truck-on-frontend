import styles from "./Icon.module.css";

/** `public/icons/`에 있는 파일 이름. 피그마에서 내보낸 SVG를 그대로 넣어 둔 것이다 */
export type IconName = "pin" | "target" | "star" | "check";

type Props = {
  name: IconName;
  /** 글자 한 줄 높이에 맞춘다. sm = 보조 설명(20px), md = 본문(24px). 기본은 md */
  size?: "sm" | "md";
};

/**
 * SVG 아이콘. **색은 부모의 글자색(`color`)을 따른다.**
 *
 * SVG 파일 안의 색을 쓰지 않고 모양만 가면(mask)으로 떠서 `currentColor`로 칠한다.
 * 그래야 아이콘 색도 토큰으로 정할 수 있다 — 파일에 `#ff6b35`가 박혀 있으면
 * 색을 바꿀 때 SVG를 다시 내보내야 하고, TDS로 옮길 때도 토큰만 바꿔서는 안 바뀐다.
 *
 * 뜻을 전하지 않는 장식이라 스크린리더에서 숨긴다. 뜻이 필요하면 옆에 글자를 둔다.
 */
export function Icon({ name, size = "md" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={[styles.icon, styles[size]].join(" ")}
      style={{ maskImage: `url(/icons/${name}.svg)` }}
    />
  );
}
