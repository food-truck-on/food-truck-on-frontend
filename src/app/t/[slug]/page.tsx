import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedTruckScreen } from "@/features/customer/share/SharedTruckScreen";
import { shareDescription, shareTitle } from "@/features/customer/share/shareText";
import { parseScenario } from "@/lib/mock/mockFetch";
import { getSharedTruck } from "@/lib/api/customer";
import { siteName } from "@/lib/site";

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
 * 데이터는 lib/api/customer.ts에서 온다. 목 슬러그 네 개(lib/mock/sharedTrucks.ts)는 목데이터,
 * 그 밖의 슬러그는 실제 API다(2026-11-17).
 * 목데이터 확인: 목 슬러그 주소 끝에 ?mock=slow | error | empty (lib/mock/mockFetch.ts)
 */

/**
 * 카카오톡 미리보기 제목·설명. 이미지는 같은 폴더의 opengraph-image.tsx가 붙인다.
 * 본문과 같은 데이터를 쓴다 — getSharedTruck이 cache로 감싸져 있어 한 번만 불린다.
 */
export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/t/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { mock } = await searchParams;

  const truck = await getSharedTruck(slug, parseScenario(mock));
  if (!truck) return { title: `트럭을 찾을 수 없어요 · ${siteName}` };

  const title = shareTitle(truck);
  const description = shareDescription(truck);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/t/${slug}`,
      siteName,
      locale: "ko_KR",
      type: "website",
    },
  };
}
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
