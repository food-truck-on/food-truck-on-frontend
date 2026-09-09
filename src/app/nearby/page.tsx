import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

export default function NearbyPage() {
  return (
    <RoutePlaceholder
      path="/nearby"
      title="손님 — 주변 트럭"
      note="지도 + 시트 구조. 하단 탭은 두지 않는다. 위치 권한은 지도를 보려는 시점에 요청한다"
    />
  );
}
