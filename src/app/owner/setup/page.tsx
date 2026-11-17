import { SetupScreen } from "@/features/owner/setup/SetupScreen";

/**
 * 가게 이름 등록. 트럭이 없는 사장님만 온다.
 * 하단 탭(BottomNav)을 두지 않는다 — 트럭이 없으면 갈 탭이 없다.
 * 로그인 확인은 app/owner/layout.tsx가 맡는다.
 */
export default function OwnerSetupPage() {
  return <SetupScreen />;
}
