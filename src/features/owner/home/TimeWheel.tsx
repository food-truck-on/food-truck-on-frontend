"use client";

import { useEffect, useRef } from "react";
import styles from "./HoursSheet.module.css";

type Meridiem = "am" | "pm";

/** "16:00" 같은 24시간제 글자를 휠 세 줄로 나눈 값 */
type Parts = { meridiem: Meridiem; hour: number; minute: number };

const MERIDIEMS: { value: Meridiem; label: string }[] = [
  { value: "am", label: "오전" },
  { value: "pm", label: "오후" },
];
const HOURS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}시` }));
/** 10분 단위. 피그마 `05`와 같다 */
const MINUTES = [0, 10, 20, 30, 40, 50].map((m) => ({
  value: m,
  label: `${String(m).padStart(2, "0")}분`,
}));

/** "16:05" → 오후 4시 00분. 10분 단위가 아닌 값은 내림해서 휠에 맞춘다 */
function toParts(value: string): Parts {
  const [h, m] = value.split(":").map(Number);
  return {
    meridiem: h < 12 ? "am" : "pm",
    hour: h % 12 === 0 ? 12 : h % 12,
    minute: Math.floor(m / 10) * 10,
  };
}

/** 오후 12시 → "12:00", 오전 12시 → "00:00" */
function fromParts({ meridiem, hour, minute }: Parts): string {
  const h = (hour % 12) + (meridiem === "pm" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

type Props = {
  /** "오픈 시간" · "마감 시간". 세 줄을 묶는 이름으로 스크린리더가 읽는다 */
  label: string;
  /** "16:00" 모양. 서버의 open_time · close_time과 같다 */
  value: string;
  onChange: (value: string) => void;
};

/** 오전/오후 · 시 · 분 세 줄짜리 휠. 피그마 `05 홈 / 영업시간 모달`의 TimeWheel */
export function TimeWheel({ label, value, onChange }: Props) {
  const parts = toParts(value);
  const change = (next: Partial<Parts>) => onChange(fromParts({ ...parts, ...next }));

  return (
    <div className={styles.wheel} role="group" aria-label={label}>
      <WheelColumn
        label={`${label} 오전 오후`}
        options={MERIDIEMS}
        value={parts.meridiem}
        onChange={(meridiem) => change({ meridiem })}
      />
      <WheelColumn
        label={`${label} 시`}
        options={HOURS}
        value={parts.hour}
        onChange={(hour) => change({ hour })}
      />
      <WheelColumn
        label={`${label} 분`}
        options={MINUTES}
        value={parts.minute}
        onChange={(minute) => change({ minute })}
      />
    </div>
  );
}

type ColumnProps<T> = {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * 휠 한 줄. 손가락으로 굴리면 가운데 멈춘 값이 선택되고, 값을 눌러도 선택된다.
 *
 * 스크롤이 칸 단위로 딱 멈추는 건 CSS scroll-snap이 맡는다. 위아래에 한 칸씩 여백을 둬서
 * i번째 값이 가운데 올 때 scrollTop이 정확히 "i × 한 칸 높이"가 된다.
 * 값마다 버튼이라 키보드(Tab → Enter)로도 고를 수 있다.
 */
function WheelColumn<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: ColumnProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  /** 처음 열 때의 위치. 이후 값이 바뀔 때마다 다시 스크롤하면 손가락과 싸운다 */
  const initialIndex = useRef(index);

  const rowHeight = () =>
    (ref.current?.querySelector("button") as HTMLElement | null)?.offsetHeight ?? 0;

  useEffect(() => {
    // 창이 열린 직후 한 프레임 뒤에 맞춘다. 닫혀 있는 동안에는 높이가 0이라 계산이 안 된다
    const frame = requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = initialIndex.current * rowHeight();
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer.current);
    };
  }, []);

  /** 굴리기를 멈추고 잠깐 기다린 뒤 가운데 칸을 값으로 삼는다 */
  function handleScroll() {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const height = rowHeight();
      if (!ref.current || height === 0) return;
      const next = options[Math.round(ref.current.scrollTop / height)];
      if (next && next.value !== value) onChange(next.value);
    }, 120);
  }

  function pick(i: number) {
    ref.current?.scrollTo({ top: i * rowHeight(), behavior: "smooth" });
    onChange(options[i].value);
  }

  return (
    <div className={styles.column}>
      {/* 가운데 선택 띠와 위아래 흐림. 누르기를 가로막지 않게 pointer-events를 끈다 */}
      <span className={styles.band} aria-hidden="true" />
      <div
        ref={ref}
        className={styles.scroller}
        role="group"
        aria-label={label}
        onScroll={handleScroll}
      >
        {options.map((option, i) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={i === index}
            className={i === index ? styles.optionSelected : styles.option}
            onClick={() => pick(i)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className={styles.fadeTop} aria-hidden="true" />
      <span className={styles.fadeBottom} aria-hidden="true" />
    </div>
  );
}
