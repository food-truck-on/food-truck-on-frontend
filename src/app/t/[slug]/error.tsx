"use client";

import { Button } from "@/components/Button/Button";
import styles from "@/features/customer/share/SharedTruckScreen.module.css";

/**
 * 트럭 정보를 불러오지 못했을 때. 사과하지 않고 원인과 해결책을 말한다.
 * `retry()`는 서버에서 데이터를 다시 받아 와 그린다(Next 16.3부터 정식).
 */
export default function SharedTruckError({ retry }: { retry: () => void }) {
  return (
    <main className={styles.screen}>
      <section className={styles.message} role="alert">
        <h1 className={styles.messageTitle}>트럭 정보를 불러오지 못했어요</h1>
        <p className={styles.messageDesc}>
          인터넷 연결이 끊겼거나 서버에 문제가 있어요. 연결을 확인한 뒤 다시 불러와 주세요
        </p>
        <Button variant="secondary" onClick={() => retry()}>
          다시 불러오기
        </Button>
      </section>
    </main>
  );
}
