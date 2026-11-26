"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { Icon } from "@/components/Icon/Icon";
import { clearSession } from "@/lib/auth/session";
import { isAlreadySignedOutError, logout } from "@/lib/mock/auth";
import styles from "./LogoutButton.module.css";

type Props = {
  /** 어두운 면(`18 홈 / 영업 종료`) 위에 놓일 때. 아이콘을 흰색으로 칠한다 */
  inverse?: boolean;
};

/**
 * 사장님 홈 상단의 로그아웃 아이콘. 백엔드 `1-3. POST /api/v1/auth/logout`.
 *
 * 로그아웃은 탭이 아니다. 자주 누르지 않으므로 홈 상단 아이콘으로 둔다(design-system.md BottomNav).
 * 잘못 눌러도 바로 나가지 않게 한 번 묻는다. 첫 포커스는 취소 버튼이다(ConfirmDialog).
 *
 * 서버가 토큰을 지운 뒤에 브라우저의 세션을 지운다. 순서를 바꾸면 요청에 실을 토큰이 없다.
 * 끝나면 로그인 화면을 **새로 불러온다.** 목데이터가 탭 메모리에 남아 다음 로그인으로
 * 넘어가지 않게 하고(lib/mock/sessions.ts), 뒤로가기로 사장님 화면에 돌아오지 않게 기록을 바꿔 넣는다.
 */
export function LogoutButton({ inverse = false }: Props) {
  const [asking, setAsking] = useState(false);
  const [pending, setPending] = useState(false);
  /** 창 안에 보여줄 실패 문구. 창이 떠 있는 동안 토스트는 창 뒤에 깔린다 */
  const [error, setError] = useState<string>();

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    setError(undefined);
    try {
      await logout();
    } catch (err) {
      // 토큰이 이미 무효(401)면 서버 쪽은 로그아웃된 것과 같다. 브라우저 세션만 지우면 끝난다
      if (!isAlreadySignedOutError(err)) {
        setError("로그아웃하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
        setPending(false);
        return;
      }
    }
    clearSession();
    // 페이지를 새로 불러오므로 pending을 풀지 않는다. 그 사이에 다시 눌리지 않는다
    window.location.replace("/login");
  }

  return (
    <>
      <button
        type="button"
        className={inverse ? styles.inverse : styles.button}
        aria-label="로그아웃"
        onClick={() => setAsking(true)}
      >
        <Icon name="logout" />
      </button>

      <ConfirmDialog
        open={asking}
        title="로그아웃할까요?"
        description="다시 들어오려면 카카오나 구글로 로그인해야 해요. 오늘 영업 정보는 그대로 남아요"
        confirmLabel="로그아웃하기"
        cancelLabel="계속 쓸래요"
        confirmLoading={pending}
        error={error}
        onConfirm={() => void handleLogout()}
        onCancel={() => {
          setAsking(false);
          setError(undefined);
        }}
      />
    </>
  );
}
