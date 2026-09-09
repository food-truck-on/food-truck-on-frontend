import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "kakao" | "google";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  /** 화면 폭을 꽉 채운다. 하단 고정 CTA에 쓴다 */
  block?: boolean;
  /**
   * 처리 중. 버튼이 비활성화되고 스피너가 붙는다.
   * 문구는 그대로 둔다 — 사라지면 무슨 버튼이었는지 알 수 없다.
   */
  loading?: boolean;
  children: ReactNode;
};

/**
 * 피그마 `Button` 컴포넌트와 이름·variant가 일치한다.
 * variant: primary / secondary / kakao / google
 * state:   default / pressed(:active) / disabled(:disabled) / loading(prop)
 *
 * 문구는 **누르면 무슨 일이 일어나는지** 말한다. "확인"이 아니라 "오픈하기".
 */
export function Button({
  variant = "primary",
  block = false,
  loading = false,
  disabled = false,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[styles.button, styles[variant], block ? styles.block : ""]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
