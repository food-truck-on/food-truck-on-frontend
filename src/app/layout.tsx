import type { Metadata, Viewport } from "next";
import { Jua } from "next/font/google";
import { ToastProvider } from "@/components/Toast/Toast";
import { siteName, siteUrl } from "@/lib/site";
import "./globals.css";

/*
 * 서체는 둘이다(2026-11-15, styles/tokens.css "타이포그래피").
 *   제목용  주아체(Jua)   — next/font로 불러온다. Regular 한 가지 굵기뿐이다
 *   본문용  프리텐다드     — 아래 <head>의 <link>로 불러온다
 * 굵기는 토큰(--font-body-strong 등)에 들어 있다. font-weight를 직접 쓰지 마라.
 */

/*
 * 프리텐다드는 next/font의 구글 폰트 목록에 없다. 그래서 프리텐다드가 공식으로 안내하는
 * "다이나믹 서브셋" 스타일시트를 CDN에서 불러온다.
 * - 한글을 92조각으로 나눠 두고 **화면에 실제로 나온 글자가 든 조각만** 내려받는다.
 *   서체 파일 하나를 통째로 받으면 2MB인데, 손님은 링크를 눌러 바로 봐야 한다
 * - 가변 서체라 굵기 400·500·600을 파일 하나로 쓴다
 * - 버전을 주소에 못 박았다. 올릴 때는 주소의 v1.3.9만 바꾼다
 * - CDN이 막히면 tokens.css의 대체 서체(기기 기본 한글 서체)로 보인다. 화면은 깨지지 않는다
 */
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

const jua = Jua({
  variable: "--font-jua",
  weight: "400",
  display: "swap",
  // subsets를 지정하지 않는다. next/font의 폰트 목록에 주아체의 korean 서브셋이
  // 빠져 있어서(latin만 있다고 나온다) subsets: ["latin"]으로 두면 한글 글리프를
  // 아예 안 받아온다. 생략하면 구글이 주는 CSS 전체(=한글 포함)를 쓴다.
  // 대신 preload를 켤 수 없어 false로 둔다.
  preload: false,
});

export const metadata: Metadata = {
  // 미리보기 이미지·링크를 상대 주소로 써도 절대 주소로 바꿔 준다(lib/site.ts)
  metadataBase: siteUrl,
  title: siteName,
  description: "오늘 푸드트럭이 어디서 여는지 알려드려요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 웹뷰 안전영역(env(safe-area-inset-*))이 동작하려면 반드시 필요하다
  viewportFit: "cover",
  // 다크 모드를 만들지 않는다
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * suppressHydrationWarning — 브라우저 확장 프로그램이 서버 HTML이 화면에 붙기 전에
   * <html> · <body>에 속성을 끼워 넣으면 React가 "서버와 다르다"고 경고한다(2026-11-26).
   * 우리 코드가 만든 차이가 아니고 배포된 화면에는 영향이 없어 이 두 태그에서만 끈다.
   * 이 표시는 그 태그 자신의 속성에만 듣는다. 안쪽 화면의 불일치는 그대로 경고된다.
   */
  return (
    <html lang="ko" className={jua.variable} suppressHydrationWarning>
      <head>
        {/* 서체 조각을 받을 서버와 미리 연결해 둔다. 첫 글자가 뜨는 시간이 줄어든다 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} />
      </head>
      <body suppressHydrationWarning>
        <div className="app-shell">
          {/* 어느 화면에서든 useToast()로 토스트를 띄울 수 있게 앱 전체를 감싼다 */}
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
