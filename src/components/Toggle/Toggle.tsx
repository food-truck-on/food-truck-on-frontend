"use client";

import styles from "./Toggle.module.css";

type Props = {
  /** 무엇을 켜고 끄는지. 스위치만 두지 마라 */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * 켜짐/꺼짐 대신 쓸 문구. 도메인 단어를 맞춘다.
   * 예: 품절 토글이면 ["품절", "판매 중"]
   */
  stateText?: [onText: string, offText: string];
};

/**
 * 피그마 `Toggle` 컴포넌트와 이름·state가 일치한다.
 * state: on / off / disabled
 *
 * 상태를 색으로만 표현하지 않는다 — 켜짐/꺼짐을 글자로도 보여준다.
 */
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  stateText = ["켜짐", "꺼짐"],
}: Props) {
  const [onText, offText] = stateText;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[styles.wrap, checked ? styles.on : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.state}>{checked ? onText : offText}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  );
}
