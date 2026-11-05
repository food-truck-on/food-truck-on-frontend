/**
 * 서비스의 절대 주소. 카카오톡 미리보기(OG)는 이미지·링크 주소가 `https://`로 시작해야 한다.
 *
 * **주소를 코드에 박지 않는다.** 지금은 Vercel이지만 11/9 회의 뒤 백엔드 EC2로 옮길 수 있다.
 * 옮기면 환경 변수 `NEXT_PUBLIC_SITE_URL` 하나만 바꾼다.
 *
 * 순서
 *   1. NEXT_PUBLIC_SITE_URL                  직접 정한 주소. 배포 후 반드시 넣는다
 *   2. VERCEL_PROJECT_PRODUCTION_URL         Vercel이 자동으로 넣어 주는 값. 1을 넣기 전 첫 배포용
 *   3. http://localhost:3001                 로컬 개발
 */
function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3001";
}

export const siteUrl = new URL(resolveSiteUrl());

export const siteName = "오늘 어디서 팔아요";

/**
 * 백엔드 share_url에서 슬러그만 떼어 `/t/:slug`로 조립한다.
 * "https://오늘어디서팔아요.kr/takoyaki-dalin" → "/t/takoyaki-dalin"
 *
 * 백엔드는 전체 URL을 주는데, 도메인이 바뀌면 저장된 링크가 전부 죽는다.
 * 슬러그만 저장해 달라고 요청해 둔 상태다(status.md). 반영되면 이 함수는 사라진다.
 */
export function sharePathFrom(shareUrl: string): string {
  const slug = shareUrl.split("/").filter(Boolean).at(-1) ?? "";
  return `/t/${slug}`;
}

/**
 * 손님에게 보낼 전체 링크. **브라우저에서만 부른다.**
 * "https://(지금 배포된 주소)/t/takoyaki-dalin"
 *
 * 백엔드가 준 share_url을 그대로 복사하면 그 안의 도메인(명세 예시 `오늘어디서팔아요.kr`)으로 가서 링크가 죽는다.
 * NEXT_PUBLIC_SITE_URL이 있으면 그 주소를, 없으면 지금 열려 있는 주소를 쓴다.
 * (VERCEL_PROJECT_PRODUCTION_URL은 서버에서만 보여서 여기서는 못 쓴다)
 */
export function shareLinkFrom(shareUrl: string): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  return new URL(sharePathFrom(shareUrl), origin).toString();
}
