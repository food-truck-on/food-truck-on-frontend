import Link from "next/link";
import styles from "./page.module.css";

/*
 * **임시 화면.** 스플래시 → 역할 선택(피그마 온보딩 01·02)은 11/7에 만든다.
 * 그 전까지는 만들어 둔 화면으로 바로 가는 목록을 띄운다. 11/7에 이 파일을 통째로 바꾼다.
 */
const links = [
  {
    group: "사장님",
    items: [
      { href: "/owner", label: "사장님 홈" },
      { href: "/owner/location", label: "위치 정하기" },
      { href: "/owner/menu", label: "메뉴 정하기" },
    ],
  },
  {
    group: "손님 — 공유 링크",
    items: [
      { href: "/t/takoyaki-dalin", label: "영업 중" },
      { href: "/t/gilgeori-tteokbokki", label: "준비 중" },
      { href: "/t/wangmandu-halmeoni", label: "영업 종료" },
      { href: "/t/sotddukkeong-dakgangjeong", label: "오늘은 쉬어요" },
      { href: "/t/takoyaki-dalin?mock=slow", label: "로딩 (3초)" },
      { href: "/t/takoyaki-dalin?mock=error", label: "에러" },
      { href: "/t/no-such-truck", label: "없는 링크" },
    ],
  },
  {
    group: "개발용",
    items: [{ href: "/dev/components", label: "공통 컴포넌트 모음" }],
  },
];

export default function HomePage() {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.notice}>스플래시는 11/7에 만들어요. 그 전까지 임시 목록이에요</p>
        <h1 className={styles.title}>오늘 어디서 팔아요</h1>
      </header>

      {links.map(({ group, items }) => (
        <section key={group} className={styles.group}>
          <h2 className={styles.groupTitle}>{group}</h2>
          <ul className={styles.list}>
            {items.map(({ href, label }) => (
              <li key={href}>
                <Link className={styles.link} href={href}>
                  {label}
                  <span className={styles.path}>{href}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
