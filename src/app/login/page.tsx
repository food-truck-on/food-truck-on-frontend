import { LoginScreen } from "@/features/auth/LoginScreen";

/** 사장님 로그인. 주소 끝 ?mock=cancel | error | slow 로 돌아온 뒤의 상황을 바꿔 볼 수 있다 */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { mock } = await searchParams;
  return <LoginScreen mock={typeof mock === "string" ? mock : null} />;
}
