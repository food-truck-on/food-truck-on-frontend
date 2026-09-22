"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./BottomSheet.module.css";

type Props = {
  open: boolean;
  /** 닫아 달라는 요청. Esc·뒤로가기·바깥 누르기가 모두 여기로 온다 */
  onClose: () => void;
  /** 처리 중이라 닫으면 안 될 때. 이때는 Esc·바깥 누르기를 무시한다 */
  locked?: boolean;
  /** 제목 요소의 id. 스크린리더가 창 이름으로 읽는다 */
  labelledBy: string;
  describedBy?: string;
  children: ReactNode;
};

/**
 * 화면 아래에서 올라오는 창. 확인 다이얼로그와 영업시간 설정이 같이 쓴다.
 *
 * 브라우저 기본 `<dialog>`를 쓴다. 따로 구현하지 않아도
 * 포커스가 창 안에 갇히고, 뒤 화면을 누를 수 없고, 뒤로가기·Esc로 닫힌다.
 * 모양과 여닫는 규칙만 여기서 정하고, 안에 무엇을 넣을지는 쓰는 쪽이 정한다.
 */
export function BottomSheet({
  open,
  onClose,
  locked = false,
  labelledBy,
  describedBy,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

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

  const requestClose = () => {
    if (!locked) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      // Esc·뒤로가기. 브라우저가 직접 닫지 않게 막고 부모 상태로 닫는다
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      /*
       * 브라우저가 우리 허락 없이 창을 닫은 경우를 수습한다.
       * 크롬은 사용자가 화면을 직접 누른 적이 없으면 Esc를 preventDefault로 막지 못하게 한다
       * (닫히지 않는 광고 창을 막기 위한 규칙). 그러면 창은 닫혔는데 open prop은 true로 남아
       * 다시 열 수 없게 된다. 처리 중이면 다시 띄우고, 아니면 닫기로 처리해 상태를 맞춘다.
       * 부모가 open을 false로 바꿔서 닫힌 경우에는 open이 이미 false라 아무것도 하지 않는다.
       */
      onClose={() => {
        if (!open) return;
        if (locked) ref.current?.showModal();
        else onClose();
      }}
      // 어두운 바깥을 누르면 닫는다. 창 안쪽 클릭은 .sheet가 받으므로 여기 오지 않는다
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className={styles.sheet}>{children}</div>
    </dialog>
  );
}
