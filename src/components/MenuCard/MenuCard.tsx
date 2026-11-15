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
 *
 * 사장님 카드는 피그마 `08`처럼 **한 줄**이다: 왼쪽에 메뉴명·가격, 오른쪽에 "품절" 토글(2026-11-11).
 * 전에는 아래 줄에 "판매 상태" 라벨 + 토글을 따로 뒀다. 꺼진 토글 옆에 "판매 중"이 붙어
 * "판매 상태가 꺼져 있다"로 읽혔고, 스크린리더도 "판매 상태, 꺼짐"이라고 읽었다.
 * 라벨을 "품절"로 바꾸면 켜짐 = 품절이라 방향이 맞는다. 카드 높이도 절반이 된다.
 */
export function MenuCard({ name, price, soldOut = false, onToggleSoldOut }: Props) {
  const priceText = `${price.toLocaleString("ko-KR")}원`;
  const badge = soldOut ? <span className={styles.badge}>품절</span> : null;

  return (
    <article
      /* 메뉴가 여러 장 늘어서므로 카드마다 이름을 붙여준다.
         안쪽 토글의 라벨만으로는 어느 메뉴인지 알 수 없다 */
      aria-label={name}
      className={[
        styles.card,
        soldOut ? styles.soldout : "",
        onToggleSoldOut ? styles.editable : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {onToggleSoldOut ? (
        <>
          <div className={styles.text}>
            <h3 className={styles.name}>{name}</h3>
            <p className={styles.meta}>
              <span className={styles.price}>{priceText}</span>
              {badge}
            </p>
          </div>

          <div className={styles.action}>
            {/* 상태 글자는 왼쪽의 "품절" 배지가 말한다. 토글 옆에 또 쓰면 "품절 품절"이 된다 */}
            <Toggle
              label="품절"
              checked={soldOut}
              onChange={onToggleSoldOut}
              stateText={null}
            />
          </div>
        </>
      ) : (
        <div className={styles.head}>
          <h3 className={styles.name}>{name}</h3>
          {badge}
          <p className={styles.price}>{priceText}</p>
        </div>
      )}
    </article>
  );
}
