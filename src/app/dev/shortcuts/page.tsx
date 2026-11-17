"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/Button/Button";
import { clearSession, hasSession, subscribeSession } from "@/lib/auth/session";
import styles from "../components/page.module.css";

/*
 * 개발 전용 바로가기. **배포 전(11/8) /dev 폴더째 지운다**(frontend.md 라우팅 표).
 * 11/4에 / 자리에 임시로 두었던 목록을 시작 화면이 생기면서 여기로 옮겼다.
 */
const groups = [
  {
    title: "온보딩",
    links: [
      ["/", "시작 화면"],
      ["/login", "사장님 로그인"],
      ["/login?mock=slow", "로그인 — 서버 느림(로딩)"],
      ["/login?mock=cancel", "로그인 — 취소하고 돌아옴"],
      ["/login?mock=error", "로그인 — 서버 실패"],
    ],
  },
  {
    title: "사장님 (로그인 필요)",
    links: [
      ["/owner", "사장님 홈"],
      ["/owner?truck=none", "가게 이름 등록 — 트럭 없는 사장님 (홈 → 등록 화면)"],
      ["/owner/setup?truck=taken", "가게 이름 등록 — 등록하면 '이미 등록됨'(409)"],
      ["/owner/location", "위치 정하기"],
      ["/owner/menu", "메뉴 정하기"],
    ],
  },
  {
    title: "손님 — 공유 링크",
    links: [
      ["/t/takoyaki-dalin", "영업 중"],
      ["/t/gilgeori-tteokbokki", "준비 중"],
      ["/t/wangmandu-halmeoni", "영업 종료"],
      ["/t/sotddukkeong-dakgangjeong", "오늘은 쉬어요"],
      ["/t/takoyaki-dalin?mock=slow", "로딩 (3초)"],
      ["/t/takoyaki-dalin?mock=error", "에러"],
      ["/t/no-such-truck", "없는 링크"],
      ["/t/takoyaki-dalin/opengraph-image", "카카오톡 미리보기 이미지"],
    ],
  },
  {
    title: "개발용",
    links: [["/dev/components", "공통 컴포넌트 모음"]],
  },
] as const;

function logout() {
  clearSession();
  window.location.reload();
}

export default function DevShortcutsPage() {
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => null);

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>개발용 바로가기</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>로그인 상태: {signedIn === null ? "확인 중" : signedIn ? "로그인됨" : "로그아웃됨"}</h2>
        {/* 목데이터는 탭 메모리에 남아 있다. 이 페이지를 새로 불러와야 다음 로그인이 처음 상태에서 시작한다 */}
        <Button variant="secondary" disabled={!signedIn} onClick={logout}>
          로그아웃하기 (목 세션 지우기)
        </Button>
      </section>

      {groups.map(({ title, links }) => (
        <section key={title} className={styles.section}>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <ul className={styles.group}>
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href}>
                  {label} — <code>{href}</code>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
