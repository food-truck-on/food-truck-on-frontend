import { BottomNav } from "@/components/BottomNav/BottomNav";
import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function OwnerLocationPage() {
  return (
    <>
      <RoutePlaceholder
        path="/owner/location"
        title="위치 정하기"
        note="피그마 사장님 02·03. 카카오맵 + 자주 가는 장소"
      />
      <BottomNav current="location" />
    </>
  );
}
