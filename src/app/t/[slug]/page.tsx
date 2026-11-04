import { notFound } from "next/navigation";
import { SharedTruckScreen } from "@/features/customer/share/SharedTruckScreen";
import { parseScenario } from "@/lib/mock/mockFetch";
import { getSharedTruck } from "@/lib/mock/sharedTrucks";

/*
 * 공유 링크로 들어오는 단일 트럭 페이지. 로그인 불필요.
 * 이 서비스의 핵심 진입점이라 다른 화면에 의존하지 않고 단독으로 완결돼야 한다.
 *
 * 서버에서 그린다 — 카카오톡 크롤러가 서버가 만든 HTML에서 OG 태그를 읽어 가기 때문이다.
 *
 * 네 상태
 *   로딩  loading.tsx    스켈레톤
 *   에러  error.tsx      다시 불러오기
 *   없음  not-found.tsx  잘못된 링크
 *   성공  이 파일         영업 중 · 준비 중 · 영업 종료 · 오늘은 쉬어요
 *
 * 목데이터 확인: 주소 끝에 ?mock=slow | error | empty (lib/mock/mockFetch.ts)
 */
export default async function SharedTruckPage({
  params,
  searchParams,
}: PageProps<"/t/[slug]">) {
  const { slug } = await params;
  const { mock } = await searchParams;

  const truck = await getSharedTruck(slug, parseScenario(mock));
  if (!truck) notFound();

  return <SharedTruckScreen truck={truck} />;
}
