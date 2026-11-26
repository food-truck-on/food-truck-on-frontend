import { ApiError, mockFetch } from "./mockFetch";
import type { SocialLoginResult, SocialProvider } from "./types";

/**
 * 1-1. POST /api/v1/auth/social 자리. 목 로그인이다 — 어떤 값을 넣어도 같은 사장님으로 로그인된다.
 *
 * 연동하는 날에는 이 함수 안쪽만 진짜 fetch로 바꾼다:
 *   fetch("/api/v1/auth/social", { method: "POST", body: JSON.stringify({ provider, provider_token }) })
 *
 * client secret은 프론트에 두지 않는다. 토큰 교환은 백엔드 몫이다(frontend.md "소셜 로그인").
 *
 * ?mock=error 로 실패 화면을 볼 수 있다(lib/mock/mockFetch.ts).
 */
export function socialLogin(
  provider: SocialProvider,
  providerToken: string,
): Promise<SocialLoginResult> {
  return mockFetch<SocialLoginResult>({
    access_token: `mock-access-${provider}-${providerToken}`,
    refresh_token: `mock-refresh-${provider}`,
    user: { id: 1, nickname: "타코야끼 달인 사장님" },
    is_new_user: false,
  });
}

/**
 * 1-3. POST /api/v1/auth/logout 자리. 성공하면 204 — 본문이 없다.
 * 서버가 이 사장님의 access_token · refresh_token을 둘 다 지운다.
 *
 * 연동하는 날에는 이 함수 안쪽만 진짜 fetch로 바꾼다:
 *   fetch("/api/v1/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${access_token}` } })
 *
 * 브라우저에 둔 세션은 이 함수가 지우지 않는다. 서버가 답한 뒤 화면이 `clearSession()`을 부른다.
 *
 * ?mock=error 로 실패를 볼 수 있다(lib/mock/mockFetch.ts).
 */
export function logout(): Promise<void> {
  return mockFetch<void>(undefined);
}

/**
 * 로그아웃하려는데 토큰이 이미 만료됐거나 다른 기기 로그인으로 무효가 됐는가(401).
 * 서버 쪽에서는 이미 로그아웃된 것과 같으므로 화면은 이걸 실패로 보이지 않는다.
 * 명세의 공통 에러 응답이 401에 `UNAUTHORIZED`를 쓴다.
 */
export function isAlreadySignedOutError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "UNAUTHORIZED";
}
