import type { NextConfig } from "next";

/*
 * 메타 태그를 <head> 안에 넣어 줘야 하는 크롤러 목록.
 *
 * Next.js는 보통 메타 태그를 HTML 뒤쪽에 나중에 끼워 넣는다(streaming metadata).
 * 브라우저는 상관없지만, 링크 미리보기 크롤러는 처음 받은 <head>만 읽는 경우가 많다.
 * 기본 목록에 **카카오톡 크롤러(kakaotalk-scrap)가 없어서** 공유 링크 미리보기가 안 뜰 수 있었다(2026-11-05 확인).
 *
 * 이 설정은 기본 목록을 **덮어쓴다.** 그래서 Next 16.3의 기본 목록
 * (node_modules/next/dist/shared/lib/router/utils/html-bots.js)을 그대로 옮기고 카카오를 덧붙였다.
 * Next를 올릴 때 기본 목록이 바뀌었는지 확인할 것.
 */
const NEXT_DEFAULT_BOTS =
  "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight";

const nextConfig: NextConfig = {
  htmlLimitedBots: new RegExp(`${NEXT_DEFAULT_BOTS}|kakaotalk-scrap`, "i"),
};

export default nextConfig;
