import Link from "next/link";
import styles from "@/features/auth/auth.module.css";

/**
 * 없는 주소로 들어왔을 때. 이게 없으면 Next.js 기본 화면("404 This page could not be found.")이 영어로 뜬다(2026-11-05 QA).
 * 공유 링크(/t/:slug)의 없는 트럭은 t/[slug]/not-found.tsx가 따로 맡는다.
 * 시작 화면과 같은 틀을 빌려 쓰고, 다음 행동으로 처음 화면을 안내한다.
 */
export default function NotFound() {
  return (
    <main className={styles.screen}>
      <section className={styles.hero}>
        <h1 className={styles.title}>없는 페이지예요</h1>
        <p className={styles.desc}>
          주소가 잘못 입력됐을 수 있어요. 손님이라면 사장님이 보낸 링크를 다시 열어 주세요
        </p>
      </section>

      <div className={styles.actions}>
        <Link className={styles.primaryLink} href="/">
          처음 화면으로 가기
        </Link>
      </div>
    </main>
  );
}
