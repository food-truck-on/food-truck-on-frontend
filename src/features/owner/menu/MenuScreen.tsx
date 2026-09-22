"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import { MenuCard } from "@/components/MenuCard/MenuCard";
import { useToast } from "@/components/Toast/Toast";
import { addMenu, getMenus, toggleSoldOut, type NewMenu } from "@/lib/mock/menus";
import { getTodaySession, importYesterdayMenus } from "@/lib/mock/sessions";
import type { Menu, TodaySession } from "@/lib/mock/types";
import { AddMenuForm } from "./AddMenuForm";
import styles from "./MenuScreen.module.css";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; menus: Menu[]; session: TodaySession | null };

/**
 * 메뉴 정하기 (/owner/menu). 피그마 사장님 07~11.
 * 로딩 · 에러 · 빈 상태 · 성공 네 상태를 갖는다.
 *
 * 피그마와 다르게 만든 것
 * - 아래 "저장" 버튼을 두지 않았다. 품절 토글도 메뉴 추가도 누르는 순간 저장된다.
 *   저장 버튼이 따로 있으면 "추가했는데 저장은 안 된" 상태가 생겨 손님 화면과 어긋난다
 * - 메뉴 수정(연필)·삭제(휴지통)는 아직 만들지 않았다. product-rules.md "아직 없는 화면"에 올라가 있다
 *
 * 어제 메뉴 불러오기(4-5)는 **오늘 세션**에 메뉴를 넣는다. 이 화면의 목록(4-1)은 트럭의 전체 메뉴라
 * 불러와도 목록은 그대로고, 홈의 "메뉴" 줄이 채워진다. 두 목록을 어떻게 이을지는 백엔드에 물어본 상태다(status.md)
 *
 * 주소 끝에 ?mock=slow / error / empty 를 붙여 각 상태를 볼 수 있다.
 */
export function MenuScreen() {
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: "loading" });
  /** 품절 토글 요청이 진행 중인 메뉴. 연타로 두 번 뒤집히지 않게 막는다 */
  const [pendingId, setPendingId] = useState<number | null>(null);
  /** 메뉴 추가 입력 카드가 열려 있는가 (피그마 10) */
  const [adding, setAdding] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      // 둘은 서로를 기다릴 이유가 없다. 세션은 어제 메뉴 불러오기에 id가 필요해서 받는다
      const [menus, session] = await Promise.all([getMenus(), getTodaySession()]);
      // 사용 안 함(is_active: false) 처리된 메뉴는 오늘 목록에 보이지 않는다
      setState({
        kind: "success",
        menus: menus.filter((m) => m.is_active),
        session,
      });
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
      // 저장 버튼이 없어서 배지만 바뀌면 서버에 저장됐는지 알 수 없다.
      // 품절은 손님 화면에 바로 나가는 정보라 "저장됐고 손님에게도 보인다"를 토스트로 알린다(2026-09-22)
      toast(
        result.is_sold_out
          ? "품절로 바꿨어요. 손님 화면에도 바로 보여요"
          : "다시 판매로 바꿨어요. 손님 화면에도 바로 보여요",
      );
    } catch {
      toast("품절 상태를 바꾸지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setPendingId(null);
    }
  }

  async function handleImport(session: TodaySession) {
    if (importing) return;
    setImporting(true);
    try {
      const result = await importYesterdayMenus(session.id);
      // "불러오기"를 눌렀으니 토스트도 같은 말을 쓴다. 빈 결과면 다음 행동을 알려준다
      toast(
        result.imported_count > 0
          ? `어제 메뉴 ${result.imported_count}개를 불러왔어요. 홈에서 바로 오픈할 수 있어요`
          : "어제 영업한 메뉴가 없어요. 아래에서 메뉴를 추가해 주세요",
      );
    } catch {
      toast("어제 메뉴를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setImporting(false);
    }
  }

  async function handleAdd(menu: NewMenu) {
    if (addSaving) return;
    setAddSaving(true);
    try {
      const created = await addMenu(menu);
      setState((prev) =>
        prev.kind === "success" ? { ...prev, menus: [...prev.menus, created] } : prev,
      );
      setAdding(false);
      // "추가하기"를 눌렀으니 토스트도 같은 말을 쓴다
      toast("메뉴를 추가했어요");
    } catch {
      // 입력 카드를 닫지 않는다. 적어 둔 이름·가격을 그대로 두고 다시 누르게 한다
      toast("메뉴를 추가하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setAddSaving(false);
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

      {/* 오늘 세션이 없으면 넣을 곳이 없다. 누를 수 없는 버튼을 두지 않고 숨긴다 */}
      {state.kind === "success" && state.session ? (
        <Button
          variant="secondary"
          block
          loading={importing}
          onClick={() => state.session && void handleImport(state.session)}
        >
          <Icon name="history" size="sm" />
          어제 메뉴 불러오기
        </Button>
      ) : null}

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
            아래 &ldquo;메뉴 추가하기&rdquo;를 누르면 손님 페이지에 메뉴와 가격이 보여요
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

      {state.kind === "success" ? (
        adding ? (
          <AddMenuForm
            saving={addSaving}
            onSubmit={(menu) => void handleAdd(menu)}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button
            variant="secondary"
            block
            onClick={() => setAdding(true)}
            data-bottom-cta
          >
            <Icon name="plus" size="sm" />
            메뉴 추가하기
          </Button>
        )
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
