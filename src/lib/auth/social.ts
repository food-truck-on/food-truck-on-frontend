import type { SocialProvider } from "@/lib/mock/types";

/**
 * 소셜 로그인 인증 페이지 주소.
 *
 * 프론트가 하는 일은 세 가지뿐이다(frontend.md "소셜 로그인").
 *   1. 인증 페이지로 보낸다         ← 이 파일
 *   2. 돌아온 값을 백엔드에 넘긴다   ← /login/callback
 *   3. 결과 세션을 저장한다          ← lib/auth/session.ts
 *
 * **지금은 목 로그인이다.** 카카오·구글로 가지 않고 곧장 /login/callback으로 돌아온다.
 * 백엔드 POST /api/v1/auth/social이 아직 없기 때문이다(9/21 회고 "범위 조정").
 *
 * 실제로 붙일 때 지킬 것
 * - 구글은 앱 안 웹뷰에서 OAuth를 막는다(disallowed_useragent). 웹뷰에서는 외부 브라우저
 *   (Android Custom Tabs / iOS SFSafariViewController)나 네이티브 SDK로 띄운다
 * - client secret은 프론트에 두지 않는다
 */

export const PROVIDER_NAME: Record<SocialProvider, string> = {
  kakao: "카카오",
  google: "구글",
};

/**
 * 시험용 상황 바꾸기. 로그인 화면 주소 끝에 붙인다.
 *   /login?mock=cancel   인증 페이지에서 "취소"를 누르고 돌아온 경우
 *   /login?mock=error    돌아왔는데 서버가 실패한 경우
 *   /login?mock=slow     서버가 느린 경우 (로딩 화면 확인)
 */
export function authorizeUrl(provider: SocialProvider, mock: string | null): string {
  const params = new URLSearchParams({ provider });

  if (mock === "cancel") {
    // 카카오·구글 모두 사용자가 동의하지 않으면 error=access_denied를 붙여 돌려보낸다
    params.set("error", "access_denied");
  } else {
    params.set("code", `mock-${Date.now()}`);
    if (mock === "error" || mock === "slow") params.set("mock", mock);
  }

  return `/login/callback?${params}`;
}

export function isProvider(value: unknown): value is SocialProvider {
  return value === "kakao" || value === "google";
}
