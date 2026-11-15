import { ImageResponse } from "next/og";
import {
  shareDescription,
  statusLabel,
} from "@/features/customer/share/shareText";
import { getSharedTruck } from "@/lib/mock/sharedTrucks";
import { loadJuaSubset } from "@/lib/og/font";
import { scaled, token } from "@/lib/og/tokens";
import { formatHours } from "@/lib/time";
import { siteName } from "@/lib/site";

/*
 * 카카오톡 미리보기 이미지 (/t/:slug/opengraph-image).
 * product-rules.md: 미리보기 카드에 **트럭 이름 + 오늘 위치 + 영업 상태**가 담겨야 한다.
 *
 * 영업 상태는 하루에도 바뀐다(준비 중 → 영업 중 → 영업 종료). 그래서 캐시하지 않고 요청마다 그린다.
 * 단, 카카오톡은 한 번 읽은 미리보기를 자기 쪽에 한동안 저장해 둔다.
 * 오래된 상태가 보이면 카카오 개발자 사이트의 "공유 디버거"에서 캐시를 지운다.
 *
 * 이미지는 PNG로 그려져서 CSS를 못 쓴다. 색·크기는 tokens.css에서 읽어 온다(lib/og/tokens.ts).
 * 이모지는 넣지 않았다. 이모지 이미지를 매번 밖에서 받아 와야 해서 실패할 곳이 하나 늘어난다.
 */
export const dynamic = "force-dynamic";

export const alt = "트럭 이름, 오늘 위치, 영업 상태";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const truck = await getSharedTruck(slug, "normal");

  // 없는 슬러그 — 서비스 이름만 그린다
  if (!truck) {
    return render({
      title: siteName,
      lines: ["오늘 푸드트럭이 어디서 여는지 알려드려요"],
    });
  }

  const isOpen = truck.status === "open";
  const isActive = isOpen || truck.status === "preparing";
  const hours = formatHours(truck.open_time, truck.close_time);

  const lines = isActive
    ? [
        truck.location_label && `오늘 위치 · ${truck.location_label}`,
        hours,
      ].filter((line): line is string => Boolean(line))
    : [shareDescription(truck)];

  return render({
    badge: { text: statusLabel(truck), open: isOpen },
    title: truck.name,
    lines,
  });
}

type Content = {
  badge?: { text: string; open: boolean };
  title: string;
  lines: string[];
};

async function render(content: Content) {
  const text = [content.badge?.text, content.title, ...content.lines, siteName]
    .filter(Boolean)
    .join("");
  const font = await loadJuaSubset(text);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: scaled("--space-3"),
        padding: `${scaled("--space-5")}px ${scaled("--space-6")}px`,
        background: token("--brand-primary-subtle"),
        fontFamily: font ? "Jua" : undefined,
      }}
    >
      {/* 상태 배지와 서비스 이름을 한 줄에 둔다. 따로 두면 1200×630 안에 다 안 들어간다.
          배지가 없는 경우(없는 링크)는 제목이 곧 서비스 이름이라 이 줄을 통째로 뺀다 */}
      {content.badge ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: scaled("--space-4"),
          }}
        >
          <div
            style={{
              display: "flex",
              padding: `${scaled("--space-2")}px ${scaled("--space-4")}px`,
              fontSize: scaled("--font-caption-size"),
              // "영업 중" 글자는 초록(--status-open)이 아니라 --text-default로 쓴다. 초록 면 위에서
              // 초록 글자는 3.92:1이다. 화면의 상태 배지와 같은 규칙이다(tokens.css, 2026-11-11)
              color: token(
                content.badge.open ? "--text-default" : "--text-muted",
              ),
              background: token(
                content.badge.open ? "--status-open-bg" : "--bg-surface",
              ),
              borderRadius: scaled("--space-5"),
            }}
          >
            {content.badge.text}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: scaled("--font-caption-size"),
              color: token("--brand-primary-text"),
            }}
          >
            {siteName}
          </div>
        </div>
      ) : null}

      <div
        style={{
          fontSize: scaled("--font-display-size"),
          lineHeight: 1.25,
          color: token("--text-default"),
          wordBreak: "keep-all",
        }}
      >
        {content.title}
      </div>

      {content.lines.map((line, i) => (
        <div
          key={line}
          style={{
            fontSize: scaled(
              i === 0 ? "--font-subtitle-size" : "--font-body-size",
            ),
            lineHeight: 1.4,
            color: token(i === 0 ? "--text-default" : "--text-secondary"),
            // 한글이 낱말 중간에서 끊기지 않게 어절 단위로 줄을 바꾼다(화면 CSS와 같다)
            wordBreak: "keep-all",
          }}
        >
          {line}
        </div>
      ))}
    </div>,
    {
      ...size,
      fonts: font
        ? [{ name: "Jua", data: font, style: "normal", weight: 400 }]
        : undefined,
    },
  );
}
