"use client";

import { useId } from "react";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import styles from "./ConfirmDialog.module.css";

type Props = {
  open: boolean;
  /** 질문으로 쓴다. "오늘 영업을 마감할까요?" */
  title: string;
  /** 누르면 무엇이 바뀌는지. "손님 지도에서 '영업 종료'로 바뀌어요" */
  description?: string;
  /** 제목 위 이모지. 피그마 17번의 🌙 자리 */
  icon?: string;
  /** 누르면 일어나는 일을 말한다. "확인"이 아니라 "마감하기" */
  confirmLabel: string;
  /** 취소도 동작을 말한다. "취소"보다 "계속 영업할래요" */
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** 확인 동작을 처리하는 중. 이때는 닫을 수 없다 */
  confirmLoading?: boolean;
  /**
   * 확인 동작이 실패했을 때의 문구. 창 안에 보여준다.
   * 토스트로 띄우면 안 된다 — 창이 브라우저 맨 위 층에 떠 있어서 토스트가 창 뒤에 깔려 안 보인다.
   */
  error?: string;
};

/**
 * 되돌리기 어려운 동작 직전에 묻는 확인창. 피그마 `17 홈 / 영업 종료 확인`의 바텀시트 모양이다.
 * 여닫는 규칙(Esc·뒤로가기·바깥 누르기)은 BottomSheet가 맡는다.
 *
 * 처음 포커스는 **취소 버튼**에 둔다. 확인 버튼에 두면 Enter 한 번에 삭제·마감이 일어난다.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  icon,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmLoading = false,
  error,
}: Props) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <BottomSheet
      open={open}
      onClose={onCancel}
      locked={confirmLoading}
      labelledBy={titleId}
      describedBy={description ? descriptionId : undefined}
    >
      <div className={styles.body}>
        {icon ? (
          <p className={styles.icon} aria-hidden="true">
            {icon}
          </p>
        ) : null}
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button
          variant="primary"
          block
          loading={confirmLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
        <Button
          variant="secondary"
          block
          disabled={confirmLoading}
          onClick={onCancel}
          autoFocus
        >
          {cancelLabel}
        </Button>
      </div>
    </BottomSheet>
  );
}
