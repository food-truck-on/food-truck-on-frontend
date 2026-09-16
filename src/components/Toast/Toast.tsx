"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import styles from "./Toast.module.css";

/** 토스트가 떠 있는 시간(ms). 한 문장을 읽기에 충분하고 다음 동작을 막지 않는 길이 */
const DURATION = 2500;

type ShowToast = (message: string) => void;

const ToastContext = createContext<ShowToast | null>(null);

/**
 * 앱 전체에 토스트를 띄울 수 있게 한다. `app/layout.tsx`에서 한 번만 감싼다.
 *
 * 한 번에 하나만 띄운다. 새 토스트가 오면 이전 것을 바로 바꾼다.
 * 연달아 쌓이면 사용자가 무엇이 최신인지 알 수 없다.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback<ShowToast>((message) => {
    clearTimeout(timer.current);
    nextId.current += 1;
    setToast({ id: nextId.current, message });
    timer.current = setTimeout(() => setToast(null), DURATION);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}

      {/*
       * 스크린리더가 읽으려면 알림 영역이 처음부터 화면에 있어야 한다.
       * 토스트가 뜰 때 영역까지 새로 만들면 내용 변화를 알아채지 못한다.
       */}
      <div role="status" aria-live="polite" className={styles.region}>
        {toast ? (
          <p key={toast.id} className={styles.toast}>
            {toast.message}
          </p>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * 토스트를 띄우는 함수를 돌려준다.
 *
 * 문구는 **끝난 일을 과거형으로** 말한다. 누른 버튼과 같은 단어를 쓴다.
 * "오픈하기"를 눌렀으면 "오픈했어요". "완료되었습니다" 같은 뭉뚱그린 말을 쓰지 마라.
 *
 * @example
 * const toast = useToast();
 * toast("링크를 복사했어요");
 */
export function useToast(): ShowToast {
  const show = useContext(ToastContext);
  if (!show) {
    throw new Error("useToast는 ToastProvider 안에서만 쓸 수 있다");
  }
  return show;
}
