import { mockFetch } from "./mockFetch";
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
