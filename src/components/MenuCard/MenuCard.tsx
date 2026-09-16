import { Toggle } from "@/components/Toggle/Toggle";
import styles from "./MenuCard.module.css";

type Props = {
  /** 메뉴명. 15자를 넘는 이름이 실제로 들어온다 */
  name: string;
  /** 원 단위 정수. 표시용 콤마는 이 컴포넌트가 붙인다 */
  price: number;
  soldOut?: boolean;
  /**
   * 주면 품절 토글이 붙는다(사장님 화면).
   * 주지 않으면 읽기 전용이다(손님 화면).
   *
   * 손님 화면에서는 품절 메뉴를 **숨기지 않는다.** 숨기면 그 메뉴가
   * 원래 있는지조차 알 수 없다. 회색 처리 + "품절" 배지로 남긴다.
   */
  onToggleSoldOut?: (soldOut: boolean) => void;
};

/**
 * 피그마 `MenuCard` 컴포넌트와 이름·state가 일치한다.
 * state: available / soldout
 *
 * 상태를 색으로만 표현하지 않는다 — 회색 처리와 함께 "품절" 글자를 띄운다.
 */
export function MenuCard({ name, price, soldOut = false, onToggleSoldOut }: Props) {
  return (
    <article
      /* 메뉴가 여러 장 늘어서므로 카드마다 이름을 붙여준다.
         안쪽 토글의 라벨만으로는 어느 메뉴인지 알 수 없다 */
      aria-label={name}
      className={[styles.card, soldOut ? styles.soldout : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.head}>
        <h3 className={styles.name}>{name}</h3>

        {soldOut ? <span className={styles.badge}>품절</span> : null}

        <p className={styles.price}>{price.toLocaleString("ko-KR")}원</p>
      </div>

      {onToggleSoldOut ? (
        <div className={styles.action}>
          <Toggle
            label="판매 상태"
            checked={soldOut}
            onChange={onToggleSoldOut}
            stateText={["품절", "판매 중"]}
          />
        </div>
      ) : null}
    </article>
  );
}
