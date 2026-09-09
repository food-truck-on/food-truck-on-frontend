import { RoutePlaceholder } from "@/components/RoutePlaceholder/RoutePlaceholder";

/*
 * 공유 링크로 들어오는 단일 트럭 페이지. 로그인 불필요.
 * 이 서비스의 핵심 진입점이라 다른 화면에 의존하지 않고 단독으로 완결돼야 한다.
 *
 * 이 페이지만 서버 렌더링이 반드시 필요하다 — 카카오톡 크롤러가 OG 태그를 읽어가야 하기 때문.
 * OG 태그는 여기에 generateMetadata()를 붙여서 만든다. 아직 안 붙인 이유:
 * 트럭 이름·오늘 위치·영업 상태를 API에서 받아와야 하는데 명세가 확정 전이고,
 * share_url을 슬러그로 줄지 전체 URL로 줄지도 백엔드와 정리가 안 끝났다(status.md Delegate).
 *
 * 필요한 화면 두 가지: 영업 중(위치·영업시간·메뉴) / 오늘은 쉬어요.
 */
export default async function SharedTruckPage({
  params,
}: PageProps<"/t/[slug]">) {
  const { slug } = await params;

  return (
    <RoutePlaceholder
      path={`/t/${slug}`}
      title="공유 링크 — 단일 트럭"
      note="OG 태그(카카오톡 미리보기)는 generateMetadata로. API 명세 확정 후 붙인다"
    />
  );
}
