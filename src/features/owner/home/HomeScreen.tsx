"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { useToast } from "@/components/Toast/Toast";
import { closeSession, getTodaySession, openSession } from "@/lib/mock/sessions";
import { getMyFoodTruck } from "@/lib/mock/trucks";
import type { MyFoodTruck, TodaySession } from "@/lib/mock/types";
import styles from "./HomeScreen.module.css";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; truck: MyFoodTruck; session: TodaySession | null };

/**
 * 사장님 홈 (/owner). 피그마 `01 홈 / 빈 상태` · `12 홈 / 오픈 준비 완료` · `15 홈 / 영업 중`.
 *
 * 오늘 세션의 status 하나로 화면이 갈린다.
 *   null       → 01. 아직 아무것도 안 정함
 *   preparing  → 12. 정하는 중. 다 채우면 "지금 오픈하기"가 눌린다
 *   open       → 15. 영업 중. 공유 링크와 마감 버튼이 보인다
 *   closed     → 18. 오늘 영업 끝 **(미구현 — 아래 ClosedNotice 주석)**
 *
 * 주소 끝에 ?session=none|preparing|open|closed 로 각 상태를,
 * ?mock=slow|error 로 로딩·에러를 볼 수 있다.
 */
export function HomeScreen() {
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: "loading" });
  /** 오픈·마감 요청이 진행 중. 연타로 두 번 보내지 않게 막는다 */
  const [pending, setPending] = useState(false);
  const [closeAsking, setCloseAsking] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      // 둘은 서로를 기다릴 이유가 없다. 같이 보내야 화면이 두 배로 늦지 않는다
      const [truck, session] = await Promise.all([
        getMyFoodTruck(),
        getTodaySession(),
      ]);
      setState({ kind: "success", truck, session });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function patchSession(next: Partial<TodaySession>) {
    setState((prev) =>
      prev.kind === "success" && prev.session
        ? { ...prev, session: { ...prev.session, ...next } }
        : prev,
    );
  }

  async function handleOpen(session: TodaySession) {
    if (pending) return;
    setPending(true);
    try {
      const result = await openSession(session.id);
      patchSession({ status: result.status });
      // "오픈하기"를 눌렀으니 토스트도 같은 말을 쓴다
      toast("오픈했어요. 손님들이 지금 찾아올 수 있어요");
    } catch {
      toast("오픈하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setPending(false);
    }
  }

  async function handleClose(session: TodaySession) {
    if (pending) return;
    setPending(true);
    try {
      const result = await closeSession(session.id);
      patchSession({ status: result.status });
      setCloseAsking(false);
      toast("오늘 영업을 마감했어요");
    } catch {
      toast("마감하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setPending(false);
    }
  }

  async function handleCopyLink(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("링크를 복사했어요");
    } catch {
      // 웹뷰나 http 환경에서는 클립보드가 막혀 있을 수 있다
      toast("링크를 복사하지 못했어요. 주소를 길게 눌러 복사해 주세요");
    }
  }

  if (state.kind === "loading") return <HomeSkeleton />;

  if (state.kind === "error") {
    return (
      <main className={styles.screen}>
        <section className={styles.message} role="alert">
          <h1 className={styles.messageTitle}>오늘 영업 정보를 불러오지 못했어요</h1>
          <p className={styles.messageDesc}>
            인터넷 연결이 끊겼거나 서버에 문제가 있어요. 연결을 확인한 뒤 다시
            불러와 주세요
          </p>
          <Button variant="secondary" onClick={() => void load()}>
            다시 불러오기
          </Button>
        </section>
      </main>
    );
  }

  const { truck, session } = state;

  if (session?.status === "closed") {
    return (
      <main className={styles.screen}>
        <ClosedNotice session={session} />
      </main>
    );
  }

  const isOpen = session?.status === "open";

  return (
    <main className={styles.screen}>
      <header className={isOpen ? styles.headerOpen : styles.header}>
        {isOpen ? (
          <p className={styles.openBadge}>
            <span className={styles.openDot} aria-hidden="true" />
            지금 영업 중
          </p>
        ) : (
          <p className={styles.date}>{formatToday(session?.date)}</p>
        )}
        <h1 className={styles.title}>
          {isOpen ? "손님들이 지금 찾아오고 있어요 🚚" : "오늘 영업 준비되셨나요? 🚚"}
        </h1>
      </header>

      <ul className={styles.rows} aria-label="오늘 영업 설정">
        <SettingRow
          label="위치"
          value={session?.location_label}
          href="/owner/location"
        />
        <SettingRow label="영업시간" value={formatHours(session)} />
        <SettingRow
          label="메뉴"
          value={session?.menus[0]?.name}
          href="/owner/menu"
        />
      </ul>

      {isOpen ? (
        <section className={styles.share}>
          <h2 className={styles.shareTitle}>손님 초대 링크</h2>
          <p className={styles.shareUrl}>{truck.share_url}</p>
          <div className={styles.shareActions}>
            <Button
              variant="secondary"
              onClick={() => void handleCopyLink(truck.share_url)}
            >
              링크 복사하기
            </Button>
            {/*
             * "손님 보기"는 탭이 아니다(2026-09-16 확정).
             * 다른 트럭까지 보이는 /nearby가 아니라 내 트럭의 공유 페이지만 연다.
             */}
            <Link className={styles.previewLink} href={toSharePath(truck.share_url)}>
              내 가게 페이지 미리보기
            </Link>
          </div>
        </section>
      ) : null}

      <footer className={styles.footer}>
        {session === null ? (
          <Button block disabled>
            위치와 메뉴를 먼저 설정해 주세요
          </Button>
        ) : isOpen ? (
          <Button block variant="secondary" onClick={() => setCloseAsking(true)}>
            오늘 영업 마감하기
          </Button>
        ) : (
          <Button
            block
            loading={pending}
            disabled={!canOpen(session)}
            onClick={() => void handleOpen(session)}
          >
            {canOpen(session) ? "🎉 지금 오픈하기" : "위치와 메뉴를 먼저 설정해 주세요"}
          </Button>
        )}
      </footer>

      <ConfirmDialog
        open={closeAsking}
        icon="🌙"
        title="오늘 영업을 마감할까요?"
        description="손님 화면에서 '영업 종료'로 바뀌어요. 오늘은 다시 열 수 없어요"
        confirmLabel="마감하기"
        cancelLabel="계속 영업할래요"
        confirmLoading={pending}
        onConfirm={() => session && void handleClose(session)}
        onCancel={() => setCloseAsking(false)}
      />
    </main>
  );
}

/** 위치·영업시간·메뉴 한 줄. 값이 있으면 채워진 모양, 없으면 회색 안내 */
function SettingRow({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  const filled = Boolean(value);
  const body = (
    <>
      <span className={styles.rowLabel}>{label}</span>
      <span className={filled ? styles.rowValue : styles.rowEmpty}>
        {value ?? "아직 설정하지 않았어요"}
      </span>
    </>
  );

  return (
    <li className={filled ? styles.rowFilled : styles.row}>
      {/*
       * 화면이 없는 항목은 링크로 만들지 않는다.
       * 눌러도 아무 일이 없는 버튼을 두면 데모에서 반드시 눌린다.
       * 영업시간 모달(피그마 05)은 저장할 API가 없어 아직 못 만든다(status.md Delegate).
       */}
      {href ? (
        <Link className={styles.rowLink} href={href}>
          {body}
          <span className={styles.rowChevron} aria-hidden="true">
            ›
          </span>
        </Link>
      ) : (
        <div className={styles.rowStatic}>{body}</div>
      )}
    </li>
  );
}

/**
 * 피그마 `18 홈 / 영업 종료`. 하루를 마무리하는 화면이라 이 한 장만 어둡게 그린다.
 *
 * **다크 모드가 아니다.** 시스템 설정과 무관하게 항상 어둡고, 다른 화면은 그대로 밝다.
 * 색은 `--bg-inverse` · `--text-on-inverse`(tokens.css)를 쓴다.
 */
function ClosedNotice({ session }: { session: TodaySession }) {
  return (
    <section className={styles.closed}>
      <p className={styles.closedIcon} aria-hidden="true">
        🌙
      </p>
      <h1 className={styles.closedTitle}>오늘도 영업 수고하셨어요</h1>
      <p className={styles.closedDesc}>
        {session.location_label}에서 손님들을 만났어요
      </p>

      <dl className={styles.closedSummary}>
        <div className={styles.closedItem}>
          <dt className={styles.rowLabel}>오늘 판매 메뉴</dt>
          <dd className={styles.rowValue}>{session.menu_count}개</dd>
        </div>
        <div className={styles.closedItem}>
          <dt className={styles.rowLabel}>영업 위치</dt>
          <dd className={styles.rowValue}>{session.location_label}</dd>
        </div>
      </dl>

      <p className={styles.closedOutro}>푹 쉬고 내일 또 힘내볼까요?</p>
    </section>
  );
}

/** 로딩 스켈레톤. 불러온 뒤 줄 수가 같아서 화면이 튀지 않는다 */
function HomeSkeleton() {
  return (
    <main className={styles.screen} aria-busy="true">
      <div className={styles.header} aria-hidden="true">
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonLineWide} />
      </div>
      <ul className={styles.rows} aria-label="오늘 영업 정보 불러오는 중">
        {[0, 1, 2].map((i) => (
          <li key={i} className={styles.skeletonRow} aria-hidden="true" />
        ))}
      </ul>
    </main>
  );
}

/** 위치와 메뉴가 둘 다 있어야 오픈할 수 있다. 명세 5-2의 조건과 같다 */
function canOpen(session: TodaySession): boolean {
  return Boolean(session.location_label) && session.menu_count > 0;
}

/** "2026-09-20" → "2026년 9월 20일 (일요일)". 값이 없으면 오늘 날짜를 쓴다 */
function formatToday(date?: string): string {
  const base = date ? new Date(`${date}T00:00:00+09:00`) : new Date();
  return base.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/** "16:00" "21:00" → "오후 4시 ~ 오후 9시". 한쪽이라도 없으면 null */
function formatHours(session: TodaySession | null): string | null {
  if (!session?.open_time || !session.close_time) return null;
  return `${formatTime(session.open_time)} ~ ${formatTime(session.close_time)}`;
}

/** "16:00" → "오후 4시", "16:30" → "오후 4시 30분" */
function formatTime(value: string): string {
  const [hour, minute] = value.split(":").map(Number);
  const meridiem = hour < 12 ? "오전" : "오후";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${meridiem} ${display}시`
    : `${meridiem} ${display}시 ${minute}분`;
}

/**
 * share_url에서 슬러그만 떼어 /t/:slug로 조립한다.
 *
 * 백엔드가 전체 URL을 주는데(`https://오늘어디서팔아요.kr/tk-달인-오늘`) 도메인이 바뀌면
 * 링크가 죽는다. 슬러그만 저장해 달라고 요청해 둔 상태다(status.md).
 * 요청이 반영되면 이 함수는 사라진다.
 */
function toSharePath(shareUrl: string): string {
  const slug = shareUrl.split("/").filter(Boolean).at(-1) ?? "";
  return `/t/${slug}`;
}
