import styles from "@/features/customer/share/SharedTruckScreen.module.css";

/**
 * 없는 슬러그로 들어왔을 때. 링크를 잘못 복사했거나 중간이 잘린 경우가 대부분이다.
 * 손님이 할 수 있는 다음 행동은 사장님께 링크를 다시 받는 것뿐이라 그것을 안내한다.
 */
export default function SharedTruckNotFound() {
  return (
    <main className={styles.screen}>
      <section className={styles.message}>
        <h1 className={styles.messageTitle}>이 링크로는 트럭을 찾을 수 없어요</h1>
        <p className={styles.messageDesc}>
          주소가 잘못 복사됐거나 일부가 잘렸을 수 있어요. 사장님께 링크를 다시 받아 열어 주세요
        </p>
      </section>
    </main>
  );
}
