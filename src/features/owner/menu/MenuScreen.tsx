"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { MenuCard } from "@/components/MenuCard/MenuCard";
import { useToast } from "@/components/Toast/Toast";
import { getMenus, toggleSoldOut } from "@/lib/mock/menus";
import type { Menu } from "@/lib/mock/types";
import styles from "./MenuScreen.module.css";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; menus: Menu[] };

/**
 * 메뉴 정하기 (/owner/menu). 피그마 사장님 07~11.
 * 로딩 · 에러 · 빈 상태 · 성공 네 상태를 갖는다.
 *
 * 주소 끝에 ?mock=slow / error / empty 를 붙여 각 상태를 볼 수 있다.
 */
export function MenuScreen() {
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: "loading" });
  /** 품절 토글 요청이 진행 중인 메뉴. 연타로 두 번 뒤집히지 않게 막는다 */
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const menus = await getMenus();
      // 사용 안 함(is_active: false) 처리된 메뉴는 오늘 목록에 보이지 않는다
      setState({ kind: "success", menus: menus.filter((m) => m.is_active) });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    // 화면에 들어오자마자 목록을 불러온다. 결과를 받은 뒤 상태를 바꾸는 게 목적이다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleToggle(menu: Menu) {
    if (pendingId !== null) return;
    setPendingId(menu.id);
    try {
      const result = await toggleSoldOut(menu.id);
      setState((prev) =>
        prev.kind === "success"
          ? {
              ...prev,
              menus: prev.menus.map((m) =>
                m.id === result.id ? { ...m, ...result } : m,
              ),
            }
          : prev,
      );
      // 성공 토스트는 띄우지 않는다. 카드의 "품절" 배지와 토글 글자가 바로 바뀌어서
      // 결과가 눈앞에 보이는데, 토스트까지 뜨면 한 번 누른 일에 알림이 세 군데서 난다.
      // 화면에 변화가 안 보이는 실패일 때만 토스트로 알린다
    } catch {
      toast("품절 상태를 바꾸지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>메뉴 정하기</h1>
        <p className={styles.desc}>
          다 팔린 메뉴는 품절로 바꿔 주세요. 오늘 하루만 유지돼요
        </p>
      </header>

      {state.kind === "loading" ? <MenuSkeleton /> : null}

      {state.kind === "error" ? (
        <section className={styles.message} role="alert">
          <h2 className={styles.messageTitle}>메뉴를 불러오지 못했어요</h2>
          <p className={styles.messageDesc}>
            인터넷 연결이 끊겼거나 서버에 문제가 있어요.
            연결을 확인한 뒤 다시 불러와 주세요
          </p>
          <Button variant="secondary" onClick={() => void load()}>
            다시 불러오기
          </Button>
        </section>
      ) : null}

      {state.kind === "success" && state.menus.length === 0 ? (
        <section className={styles.message}>
          <h2 className={styles.messageTitle}>아직 등록한 메뉴가 없어요</h2>
          <p className={styles.messageDesc}>
            메뉴를 추가하면 손님 페이지에 메뉴와 가격이 보여요
          </p>
        </section>
      ) : null}

      {state.kind === "success" && state.menus.length > 0 ? (
        <ul className={styles.list} aria-label="메뉴 목록">
          {state.menus.map((menu) => (
            <li key={menu.id}>
              <MenuCard
                name={menu.name}
                price={menu.price}
                soldOut={menu.is_sold_out}
                onToggleSoldOut={() => void handleToggle(menu)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}

/** 로딩 스켈레톤. MenuCard와 같은 크기 흐름을 따라 불러온 뒤 화면이 튀지 않게 한다 */
function MenuSkeleton() {
  return (
    <ul className={styles.list} aria-busy="true" aria-label="메뉴 불러오는 중">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonCard} aria-hidden="true">
          <span className={styles.skeletonLineWide} />
          <span className={styles.skeletonLine} />
        </li>
      ))}
    </ul>
  );
}
