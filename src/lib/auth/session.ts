import type { SocialLoginResult } from "@/lib/mock/types";

/**
 * 로그인 상태. 지금은 목 로그인 결과를 브라우저(localStorage)에 둔다.
 *
 * **토큰을 어디에 둘지는 아직 정하지 않았다.** localStorage는 페이지 스크립트가 읽을 수 있어서
 * 실제 토큰을 두기에는 약하다. 백엔드가 httpOnly 쿠키로 내려줄 수 있는지 확인이 필요하다(status.md).
 * 화면은 이 파일의 함수만 쓰므로 저장 방식이 바뀌어도 여기만 고친다.
 *
 * 저장소가 막힌 환경(사생활 보호 모드 등)에서도 화면이 죽지 않게 모든 접근을 try로 감싼다.
 */

const KEY = "food-truck-on:session";
/** 같은 탭 안에서 로그인·로그아웃을 알리는 신호. storage 이벤트는 다른 탭에서만 온다 */
const CHANGE_EVENT = "food-truck-on:session-change";

type Session = Pick<SocialLoginResult, "access_token" | "refresh_token" | "user">;

export function saveSession(result: SocialLoginResult): void {
  const session: Session = {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    user: result.user,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // 저장이 막혀 있으면 이번 방문 동안만 로그인 없이 진행된다. 다음 화면에서 다시 로그인을 요청한다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 지울 수 없으면 이미 없는 것과 같다
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function hasSession(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

/** useSyncExternalStore용. 로그인 상태가 바뀌면 다시 그리게 한다 */
export function subscribeSession(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}
