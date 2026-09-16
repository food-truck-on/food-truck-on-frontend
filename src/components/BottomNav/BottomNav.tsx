import Link from "next/link";
import styles from "./BottomNav.module.css";

export type BottomNavTab = "home" | "location" | "menu";

const TABS: { id: BottomNavTab; href: string; label: string }[] = [
  { id: "home", href: "/owner", label: "사장님 홈" },
  { id: "location", href: "/owner/location", label: "위치 정하기" },
  { id: "menu", href: "/owner/menu", label: "메뉴 정하기" },
];

type Props = {
  /** 지금 보고 있는 탭. 피그마 컴포넌트의 "선택된 탭" 속성과 같다 */
  current: BottomNavTab;
};

/**
 * 피그마 `BottomNav` 컴포넌트와 이름이 일치한다. state: 선택된 탭
 *
 * **사장님 화면 전용이다.** 손님 화면은 하단 탭 없이 지도 + 시트 구조로 간다
 * (docs/product-rules.md "손님 하단 네비게이션 오류", 2026-09-16 확정).
 *
 * 탭에 넣지 않은 것 — 2026-09-16 결정
 * - "손님 보기": 탭이 아니다. 홈 화면의 "내 가게 페이지 미리보기" 버튼으로 바꾼다.
 *   주변 트럭 지도(/nearby)가 아니라 내 트럭의 공유 링크 페이지(/t/:slug)만 연다
 * - 설정·로그아웃: 자주 누르지 않으므로 홈 상단 아이콘으로 둔다
 *
 * 선택 상태를 색으로만 표현하지 않는다 — 위쪽 막대와 aria-current를 함께 쓴다.
 */
export function BottomNav({ current }: Props) {
  return (
    <nav aria-label="사장님 메뉴" className={styles.nav}>
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const selected = tab.id === current;
          return (
            <li key={tab.id} className={styles.item}>
              <Link
                href={tab.href}
                aria-current={selected ? "page" : undefined}
                className={[styles.tab, selected ? styles.selected : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
