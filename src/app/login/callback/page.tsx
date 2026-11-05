import { CallbackScreen } from "@/features/auth/CallbackScreen";
import { isProvider } from "@/lib/auth/social";

/**
 * 카카오·구글 인증을 마치고 돌아오는 자리. 인증 페이지가 주소 끝에 결과를 붙여 보낸다.
 *   ?provider=kakao&code=…            성공
 *   ?provider=kakao&error=access_denied  사용자가 취소
 *
 * 실제 연동 때는 카카오·구글 개발자 콘솔의 Redirect URI에 이 주소를 등록한다.
 */
export default async function LoginCallbackPage({
  searchParams,
}: PageProps<"/login/callback">) {
  const { provider, code, error } = await searchParams;

  return (
    <CallbackScreen
      provider={isProvider(provider) ? provider : null}
      code={typeof code === "string" ? code : null}
      error={typeof error === "string" ? error : null}
    />
  );
}
