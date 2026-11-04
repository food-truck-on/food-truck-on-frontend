import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import { MenuCard } from "@/components/MenuCard/MenuCard";
import type { SharedTruck } from "@/lib/mock/types";
import { formatHours, formatTime } from "@/lib/time";
import { RemainingTime } from "./RemainingTime";
import styles from "./SharedTruckScreen.module.css";

/**
 * 공유 링크로 들어온 손님이 보는 트럭 한 대 (`/t/:slug`). 로그인 없이 열린다.
 *
 * 피그마 손님 `02 트럭 상세 시트`를 한 장짜리 페이지로 펼쳤다(9/21 회고 "범위 조정").
 * 시트에 필요한 내용(영업 상태 · 위치 · 영업시간 · 메뉴 · 알림 버튼)이 이미 다 있다.
 * 시트 위쪽 지도는 넣지 않았다. 손님은 "카카오맵으로 길찾기"로 바로 지도를 연다.
 *
 * 서버 컴포넌트다. 카카오톡 미리보기가 서버가 만든 HTML을 읽어 가기 때문이다.
 * 브라우저 시각이 필요한 남은 시간만 클라이언트 컴포넌트(RemainingTime)로 뺐다.
 *
 *   status open       → 영업 중: 남은 시간까지
 *   status preparing  → 준비 중: 오픈 예정 시각 안내
 *   status closed     → 영업 종료 안내
 *   status null       → 오늘은 쉬어요 (명세에 없어 가정한 모양. types.ts SharedTruck)
 */
export function SharedTruckScreen({ truck }: { truck: SharedTruck }) {
  if (truck.status === null || truck.status === "closed") {
    return <RestNotice truck={truck} />;
  }

  const isOpen = truck.status === "open";
  const hours = formatHours(truck.open_time, truck.close_time);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        {isOpen ? (
          <p className={styles.badgeOpen}>
            <span className={styles.dotOpen} aria-hidden="true" />
            영업 중
          </p>
        ) : (
          <p className={styles.badgePreparing}>
            <span className={styles.dotPreparing} aria-hidden="true" />
            준비 중
          </p>
        )}

        <h1 className={styles.name}>{truck.name}</h1>

        {hours ? <p className={styles.hours}>영업시간 {hours}</p> : null}

        {isOpen && truck.close_time ? (
          <RemainingTime openTime={truck.open_time} closeTime={truck.close_time} />
        ) : null}

        {!isOpen ? (
          <p className={styles.notice}>
            {truck.open_time
              ? `아직 문을 열기 전이에요. ${formatTime(truck.open_time)}에 열 예정이에요`
              : "아직 문을 열기 전이에요. 사장님이 오픈하면 이 화면에 바로 보여요"}
          </p>
        ) : null}
      </header>

      {truck.location_label ? <LocationCard truck={truck} /> : null}

      <section className={styles.menus} aria-labelledby="menus-title">
        <h2 id="menus-title" className={styles.sectionTitle}>
          오늘의 메뉴
        </h2>

        {truck.menus.length === 0 ? (
          <p className={styles.menusEmpty}>
            사장님이 아직 오늘 메뉴를 올리지 않았어요. 잠시 뒤에 이 링크를 다시 열어 주세요
          </p>
        ) : (
          <ul className={styles.menuList}>
            {truck.menus.map((menu) => (
              <li key={menu.id}>
                {/* 품절 메뉴를 숨기지 않는다. 회색 처리 + "품절" 배지로 남긴다 */}
                <MenuCard name={menu.name} price={menu.price} soldOut={menu.is_sold_out} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <NotifyButton />
    </main>
  );
}

function LocationCard({ truck }: { truck: SharedTruck }) {
  const href = directionsUrl(truck);

  return (
    <section className={styles.location} aria-labelledby="location-title">
      <h2 id="location-title" className={styles.locationTitle}>
        오늘 위치
      </h2>
      <p className={styles.locationLabel}>
        <span className={styles.locationIcon}>
          <Icon name="pin" />
        </span>
        {truck.location_label}
      </p>
      {href ? (
        <a className={styles.directions} href={href} target="_blank" rel="noopener noreferrer">
          카카오맵으로 길찾기
        </a>
      ) : null}
    </section>
  );
}

/**
 * 카카오맵 길찾기 링크. 앱 키 없이 열리고, 카카오맵 앱이 있으면 앱으로 넘어간다.
 * 좌표가 없으면 null — 버튼을 그리지 않는다.
 */
function directionsUrl(truck: SharedTruck): string | null {
  if (truck.latitude === null || truck.longitude === null || !truck.location_label) {
    return null;
  }
  const place = encodeURIComponent(`${truck.name} · ${truck.location_label}`);
  return `https://map.kakao.com/link/to/${place},${truck.latitude},${truck.longitude}`;
}

/**
 * 오늘은 쉬어요 / 오늘 영업을 마쳤어요.
 *
 * 링크가 트럭마다 고정이라는 점(product-rules.md "공유 링크")을 여기서 알린다.
 * 단골이 이 링크를 저장해 두면 다음 영업 날 같은 주소로 위치를 본다.
 *
 * 사장님 `18 영업 종료`와 달리 밝게 그린다. 어두운 면 토큰은 그 한 장에만 쓴다(tokens.css).
 */
function RestNotice({ truck }: { truck: SharedTruck }) {
  const closed = truck.status === "closed";

  return (
    <main className={styles.screen}>
      <section className={styles.rest}>
        <p className={styles.restIcon} aria-hidden="true">
          {closed ? "🌙" : "😴"}
        </p>
        <p className={styles.restTruck}>{truck.name}</p>
        <h1 className={styles.restTitle}>
          {closed ? "오늘 영업을 마쳤어요" : "오늘은 쉬어요"}
        </h1>
        <p className={styles.restDesc}>
          {closed && truck.location_label
            ? `오늘 ${truck.location_label}에서의 영업이 끝났어요`
            : "사장님이 오늘은 영업하지 않아요"}
        </p>
        <p className={styles.restDesc}>
          이 링크는 바뀌지 않아요. 저장해 두고 다음 영업 날 다시 열어 주세요
        </p>
      </section>

      <NotifyButton />
    </main>
  );
}

/**
 * 오픈 알림 — **1차 범위가 아니다(product-rules.md "알림").**
 * 버튼은 두되 비활성으로 두고 "준비 중"을 글자로 보인다. 구독 API는 부르지 않는다.
 */
function NotifyButton() {
  return (
    <footer className={styles.footer}>
      <Button block variant="secondary" disabled>
        🔔 오픈 알림 받기
        <span className={styles.soon}>준비 중</span>
      </Button>
    </footer>
  );
}

/** 불러오는 동안 보이는 뼈대. 불러온 뒤와 덩어리 배치가 같아 화면이 덜 튄다 */
export function SharedTruckSkeleton() {
  return (
    <main className={styles.screen} aria-busy="true" aria-label="트럭 정보 불러오는 중">
      <div className={styles.header} aria-hidden="true">
        <span className={styles.skeletonBadge} />
        <span className={styles.skeletonTitle} />
        <span className={styles.skeletonLine} />
      </div>
      <div className={styles.skeletonBlock} aria-hidden="true" />
      <div className={styles.menuList} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.skeletonBlock} />
        ))}
      </div>
    </main>
  );
}
