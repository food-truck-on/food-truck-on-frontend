import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function LoginPage() {
  return (
    <RoutePlaceholder
      path="/login"
      title="사장님 로그인"
      note="카카오 · 구글. 실제 연동은 3주차. 구글은 웹뷰 안에서 OAuth가 차단되므로 외부 브라우저로 띄운다"
    />
  );
}
