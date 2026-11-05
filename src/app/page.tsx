import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import styles from "@/features/auth/auth.module.css";

/**
 * 시작 화면 — 피그마 온보딩 `01 스플래시` + `02 역할 선택`을 한 장으로 합쳤다.
 *
 * 스플래시를 따로 두고 몇 초 기다리게 하지 않았다. 웹에서는 그 시간이 그냥 빈 화면이고,
 * 앱처럼 불러올 것도 없다. 로고를 위에 두어 스플래시 역할을 하고, 버튼을 바로 아래에 둔다.
 *
 * "손님으로 둘러보기"(/nearby)는 MVP에서 뺐다(11/9 회의에서 정한다).
 * 눌러도 아무 일 없는 활성 버튼을 두지 않는다는 규칙(product-rules.md "알림")에 맞춰 비활성 + "준비 중"으로 둔다.
 * 손님의 주된 입구는 사장님이 보낸 공유 링크(/t/:slug)라 그것을 안내한다.
 */
export default function StartPage() {
  return (
    <main className={styles.screen}>
      <section className={styles.hero}>
        <Image className={styles.logo} src="/logo.png" alt="" width={104} height={104} priority />
        <h1 className={styles.title}>오늘 어디서 팔아요</h1>
        <p className={styles.desc}>
          사장님은 오늘 위치를 올리고, 손님은 링크 하나로 바로 찾아와요
        </p>
      </section>

      <div className={styles.actions}>
        <Link className={styles.primaryLink} href="/login">
          사장님으로 시작하기
        </Link>
        <Button block variant="secondary" disabled>
          손님으로 둘러보기
          <span className={styles.soon}>준비 중</span>
        </Button>
        <p className={styles.caption}>
          손님은 사장님이 보낸 링크로 앱 설치 없이 바로 볼 수 있어요
        </p>

        {/* 개발 서버에서만 보인다. 11/8 /dev 폴더를 지울 때 이 줄도 지운다 */}
        {process.env.NODE_ENV === "development" ? (
          <Link className={styles.devLink} href="/dev/shortcuts">
            개발용 바로가기
          </Link>
        ) : null}
      </div>
    </main>
  );
}
