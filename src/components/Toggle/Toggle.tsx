"use client";

import styles from "./Toggle.module.css";

type Props = {
  /** 무엇을 켜고 끄는지. 스위치만 두지 마라. **켜졌을 때 참이 되는 말**로 쓴다 — "품절", "알림 받기" */
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * 켜짐/꺼짐 대신 쓸 문구. 도메인 단어를 맞춘다.
   *
   * `null`을 주면 상태 글자를 그리지 않는다. **상태를 다른 글자가 이미 말해 줄 때만** 쓴다.
   * 메뉴 카드가 그렇다 — 켜지면 카드에 "품절" 배지가 붙고 메뉴명이 흐려진다(MenuCard).
   * 그런 장치가 없는 곳에서 `null`을 주면 상태가 색과 손잡이 위치로만 남는다.
   */
  stateText?: [onText: string, offText: string] | null;
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
      {stateText ? (
        <span className={styles.state}>{checked ? stateText[0] : stateText[1]}</span>
      ) : null}
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </button>
  );
}
