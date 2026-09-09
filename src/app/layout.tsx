import type { Metadata, Viewport } from "next";
import { Jua } from "next/font/google";
import "./globals.css";

/*
 * 본문 서체는 주아체(Jua). Regular 한 가지 굵기뿐이다.
 * font-weight: bold 를 쓰지 마라 — globals.css에서 기본 굵기를 지워두었다.
 */
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
  title: "오늘 어디서 팔아요",
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
  return (
    <html lang="ko" className={jua.variable}>
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
