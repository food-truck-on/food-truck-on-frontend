"use client";

import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import styles from "./TextInput.module.css";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className" | "id" | "aria-invalid" | "aria-describedby"
> & {
  /**
   * 라벨. **필수다.**
   * placeholder로 대체하지 마라 — 입력하면 사라져서 무슨 칸인지 알 수 없게 된다.
   */
  label: string;
  /**
   * 입력창이 놓인 면. 부모 배경과 반대되는 면을 깔아 테두리 없이도 컨트롤임을 알게 한다.
   * page = 페이지 배경(--bg-page) 위 / card = 카드(--bg-surface) 위
   */
  surface?: "page" | "card";
  /** 오류 메시지. 있으면 error 상태가 된다. 색만이 아니라 이 글자로도 알린다 */
  error?: string;
  /** 오류가 아닐 때 아래에 두는 안내 문구 */
  hint?: string;
};

/**
 * 피그마 `TextInput` 컴포넌트와 이름·state가 일치한다.
 * state: default / focus / error
 *
 * 테두리를 진하게 올리지 않는 대신 면 + 라벨 + 포커스 링으로 접근성을 확보한다.
 * 근거는 docs/design-system.md의 "입력창 테두리를 진하게 하지 않는 이유".
 */
export function TextInput({
  label,
  surface = "page",
  error,
  hint,
  ...rest
}: Props) {
  const inputId = useId();
  const messageId = useId();

  const message = error ?? hint;

  return (
    <div
      className={[
        styles.field,
        surface === "page" ? styles.onPage : styles.onCard,
        error ? styles.error : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {message ? (
        <p id={messageId} className={styles.message}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
