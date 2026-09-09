import styles from "./RoutePlaceholder.module.css";

type Props = {
  /** 라우트 경로. 예: "/nearby" */
  path: string;
  /** 이 자리에 들어올 화면 이름 */
  title: string;
  /** 아직 못 만든 이유나 다음에 할 일 */
  note?: string;
};

/**
 * 라우트만 뚫어둔 자리. 화면을 만들면서 하나씩 걷어낸다.
 * 마지막 하나를 지울 때 이 컴포넌트도 같이 지운다.
 */
export function RoutePlaceholder({ path, title, note }: Props) {
  return (
    <main className={styles.wrap}>
      <p className={styles.path}>{path}</p>
      <h1 className={styles.title}>{title}</h1>
      {note ? <p className={styles.note}>{note}</p> : null}
    </main>
  );
}
