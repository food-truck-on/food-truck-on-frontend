import { BottomNav } from "@/components/BottomNav/BottomNav";
import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function OwnerMenuPage() {
  return (
    <>
      <RoutePlaceholder
        path="/owner/menu"
        title="메뉴 정하기"
        note="피그마 사장님 07~11. MenuCard로 목록, 품절 토글"
      />
      <BottomNav current="menu" />
    </>
  );
}
