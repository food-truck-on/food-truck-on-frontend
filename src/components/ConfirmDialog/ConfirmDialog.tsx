"use client";

import { useEffect, useId, useRef } from "react";
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
};

/**
 * 되돌리기 어려운 동작 직전에 묻는 확인창. 피그마 `17 홈 / 영업 종료 확인`의 바텀시트 모양이다.
 *
 * 브라우저 기본 `<dialog>`를 쓴다. 따로 구현하지 않아도
 * 포커스가 창 안에 갇히고, 뒤 화면을 누를 수 없고, 뒤로가기·Esc로 닫힌다.
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
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    if (!open) return;

    // 창이 떠 있는 동안 뒤 화면이 스크롤되지 않게 막는다
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  const requestCancel = () => {
    if (!confirmLoading) onCancel();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc·뒤로가기. 브라우저가 직접 닫지 않게 막고 부모 상태로 닫는다
      onCancel={(event) => {
        event.preventDefault();
        requestCancel();
      }}
      /*
       * 브라우저가 우리 허락 없이 창을 닫은 경우를 수습한다.
       * 크롬은 사용자가 화면을 직접 누른 적이 없으면 Esc를 preventDefault로 막지 못하게 한다
       * (닫히지 않는 광고 창을 막기 위한 규칙). 그러면 창은 닫혔는데 open prop은 true로 남아
       * 다시 열 수 없게 된다. 처리 중이면 다시 띄우고, 아니면 취소로 처리해 상태를 맞춘다.
       * 부모가 open을 false로 바꿔서 닫힌 경우에는 open이 이미 false라 아무것도 하지 않는다.
       */
      onClose={() => {
        if (!open) return;
        if (confirmLoading) ref.current?.showModal();
        else onCancel();
      }}
      // 어두운 바깥을 누르면 닫는다. 창 안쪽 클릭은 .sheet가 받으므로 여기 오지 않는다
      onClick={(event) => {
        if (event.target === event.currentTarget) requestCancel();
      }}
    >
      <div className={styles.sheet}>
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
            onClick={requestCancel}
            autoFocus
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
