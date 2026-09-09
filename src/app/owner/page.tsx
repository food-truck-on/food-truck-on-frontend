import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function OwnerHomePage() {
  return (
    <RoutePlaceholder
      path="/owner"
      title="사장님 홈"
      note="로그인 필수. 하위 화면(위치 정하기 · 메뉴 정하기 · 영업 중)은 2주차에 붙인다"
    />
  );
}
