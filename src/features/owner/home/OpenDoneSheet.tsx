"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";
import { Button } from "@/components/Button/Button";
import { shareToKakao } from "@/lib/kakao/share";
import styles from "./OpenDoneSheet.module.css";

/** "복사했어요" 표시를 보여 주는 시간. 지나면 다시 복사 버튼으로 돌아온다 */
const COPIED_MS = 3000;

type Props = {
  open: boolean;
  /** 손님에게 보낼 전체 링크. lib/site.ts shareLinkFrom()으로 만든다 */
  link: string;
  onClose: () => void;
};

/**
 * 오픈 직후 뜨는 시트. 피그마 `13 홈 / 오픈 완료 모달` · `14 홈 / 링크 복사됨`.
 * 근거 이미지: docs/assets/v3-2026.09.16.png (피그마를 쓸 수 없어 화면흐름도로 대조했다)
 *
 * 오픈하자마자 손님에게 링크를 보내는 게 다음 행동이라, 그 두 가지(복사 · 카카오톡 공유)만 둔다.
 *
 * - 제목은 피그마의 "오픈 완료!" 대신 **"오픈했어요"**. "오픈하기"를 눌렀으면 결과도 같은 말을 쓴다(frontend.md 문구 작성)
 * - 복사·공유 결과는 토스트가 아니라 **시트 안에** 보인다. 열린 `<dialog>` 위로는 토스트가 못 올라온다(9/22 개발일지)
 * - 피그마 `14`의 초록 "복사됐어요" 칸은 버튼이 아니라 상태 표시다. Button에 없는 모양을 새로 만들지 않고
 *   버튼 자리에 같은 크기의 상태 글자를 잠깐 띄운다
 */
export function OpenDoneSheet({ open, link, onClose }: Props) {
  const titleId = useId();
  const descId = useId();

  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 시트가 사라지면 "복사했어요" 타이머도 같이 치운다
  useEffect(() => () => clearTimeout(timer.current), []);

  function close() {
    clearTimeout(timer.current);
    setCopied(false);
    setError(undefined);
    onClose();
  }

  async function handleCopy() {
    setError(undefined);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // 웹뷰나 http 환경에서는 클립보드가 막혀 있을 수 있다
      setError("링크를 복사하지 못했어요. 위 주소를 길게 눌러 복사해 주세요");
    }
  }

  async function handleKakao() {
    setError(undefined);
    setSharing(true);
    try {
      await shareToKakao(link);
    } catch {
      setError("카카오톡을 열지 못했어요. 링크를 복사해서 카카오톡에 붙여 넣어 주세요");
    } finally {
      setSharing(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={close} labelledBy={titleId} describedBy={descId}>
      <header className={styles.header}>
        <p className={styles.icon} aria-hidden="true">
          🎉
        </p>
        <h2 id={titleId} className={styles.title}>
          오픈했어요
        </h2>
        <p id={descId} className={styles.desc}>
          손님들이 지금 찾아올 수 있어요. 링크를 보내서 오늘 위치를 알려 주세요
        </p>
      </header>

      <p className={styles.link} aria-label="손님에게 공유할 링크">
        {link}
      </p>

      {/*
       * 카카오톡이 주 행동이다(2026-11-11). 사장님은 이 링크를 카톡방에 보낸다.
       * 전에는 주황 "링크 복사하기"가 맨 위였고 바로 아래 노랑 "카카오톡"이 붙어서
       * 강조색 두 개가 같은 무게로 겨뤘다. 복사를 보조 버튼으로 내려 하나만 눈에 띄게 했다.
       */}
      <div className={styles.actions}>
        <Button block variant="kakao" loading={sharing} onClick={() => void handleKakao()}>
          카카오톡으로 공유하기
        </Button>

        {copied ? (
          // 버튼 자리를 같은 크기로 잠깐 차지한다. 스크린리더에는 바뀐 순간 읽어 준다
          <p className={styles.copied} role="status">
            ✓ 링크를 복사했어요
          </p>
        ) : (
          <Button block variant="secondary" onClick={() => void handleCopy()}>
            링크 복사하기
          </Button>
        )}

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <Button block variant="secondary" onClick={close}>
          닫기
        </Button>
      </div>
    </BottomSheet>
  );
}
