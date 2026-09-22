"use client";

import { useId, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { TimeWheel } from "./TimeWheel";
import styles from "./HoursSheet.module.css";

/** 아직 영업시간을 정하지 않았을 때 휠이 처음 가리키는 값. 피그마 `05`와 같다 */
const DEFAULT_OPEN = "16:00";
const DEFAULT_CLOSE = "21:00";

type Props = {
  open: boolean;
  /** 지금 저장된 값. 없으면 기본값(오후 4시 ~ 오후 9시)에서 시작한다 */
  openTime: string | null;
  closeTime: string | null;
  saving: boolean;
  /** 저장 실패 문구. 창 안에 보여준다 — 토스트는 창 뒤에 깔려 안 보인다 */
  error?: string;
  onSave: (openTime: string, closeTime: string) => void;
  onClose: () => void;
};

/**
 * 영업시간 설정. 피그마 `05 홈 / 영업시간 모달`.
 *
 * 마감 시각은 손님에게 보여주는 안내 문구일 뿐이다. 시각이 지나도 영업 상태는 바뀌지 않는다
 * (product-rules.md "영업 상태 판정"). 그래서 마감이 오픈보다 이른 값(다음 날 새벽 마감)도 받는다.
 */
export function HoursSheet({
  open,
  openTime,
  closeTime,
  saving,
  error,
  onSave,
  onClose,
}: Props) {
  const titleId = useId();

  return (
    <BottomSheet open={open} onClose={onClose} locked={saving} labelledBy={titleId}>
      <h2 id={titleId} className={styles.title}>
        영업시간 설정
      </h2>
      {/*
       * 열 때마다 새로 만든다. 저장하지 않고 닫았다가 다시 열면
       * 굴리다 만 값이 아니라 저장된 값에서 시작해야 한다.
       */}
      {open ? (
        <HoursForm
          initialOpen={openTime ?? DEFAULT_OPEN}
          initialClose={closeTime ?? DEFAULT_CLOSE}
          saving={saving}
          error={error}
          onSave={onSave}
        />
      ) : null}
    </BottomSheet>
  );
}

function HoursForm({
  initialOpen,
  initialClose,
  saving,
  error,
  onSave,
}: {
  initialOpen: string;
  initialClose: string;
  saving: boolean;
  error?: string;
  onSave: (openTime: string, closeTime: string) => void;
}) {
  const [openTime, setOpenTime] = useState(initialOpen);
  const [closeTime, setCloseTime] = useState(initialClose);
  const same = openTime === closeTime;

  return (
    <>
      <div className={styles.fields}>
        <div className={styles.field}>
          <p className={styles.fieldLabel}>
            <span aria-hidden="true">🟢 </span>오픈 시간
          </p>
          <TimeWheel label="오픈 시간" value={openTime} onChange={setOpenTime} />
        </div>
        <hr className={styles.divider} />
        <div className={styles.field}>
          <p className={styles.fieldLabel}>
            <span aria-hidden="true">🔴 </span>마감 시간
          </p>
          <TimeWheel label="마감 시간" value={closeTime} onChange={setCloseTime} />
        </div>
      </div>

      {same ? (
        <p className={styles.hint} role="status">
          오픈과 마감 시간이 같아요. 마감 시간을 바꿔 주세요
        </p>
      ) : error ? (
        <p className={styles.hint} role="alert">
          {error}
        </p>
      ) : null}

      <Button
        block
        loading={saving}
        disabled={same}
        onClick={() => onSave(openTime, closeTime)}
      >
        영업시간 저장하기
      </Button>
    </>
  );
}
