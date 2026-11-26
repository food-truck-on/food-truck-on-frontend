"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { useToast } from "@/components/Toast/Toast";
import { shareToKakao } from "@/lib/kakao/share";
import {
  closeSession,
  getTodaySession,
  openSession,
  setSessionHours,
} from "@/lib/mock/sessions";
import { getMyFoodTruck } from "@/lib/mock/trucks";
import type { MyFoodTruck, TodaySession } from "@/lib/mock/types";
import { shareLinkFrom, sharePathFrom } from "@/lib/site";
import { formatHours as formatHoursText } from "@/lib/time";
import { HoursSheet } from "./HoursSheet";
import { LogoutButton } from "./LogoutButton";
import { OpenDoneSheet } from "./OpenDoneSheet";
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
 *   closed     → 18. 오늘 영업 끝 (ClosedNotice)
 *
 * 트럭이 없는 사장님(가입만 하고 가게 이름을 등록하지 않음)은 가게 이름 등록(/owner/setup)으로 보낸다.
 * 로그인 응답의 is_new_user가 아니라 **트럭이 있는지**로만 판단한다(2026-11-17).
 *
 * 주소 끝에 ?session=none|preparing|open|closed 로 각 상태를,
 * ?mock=slow|error 로 로딩·에러를, ?truck=none 으로 트럭 없는 사장님을 볼 수 있다.
 */
export function HomeScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<State>({ kind: "loading" });
  /** 오픈·마감 요청이 진행 중. 연타로 두 번 보내지 않게 막는다 */
  const [pending, setPending] = useState(false);
  const [closeAsking, setCloseAsking] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  /** 오픈 직후 뜨는 시트(피그마 13·14). 링크를 바로 보내게 한다 */
  const [openDone, setOpenDone] = useState(false);
  const [hoursSaving, setHoursSaving] = useState(false);
  /** 시트 안에 보여줄 실패 문구. 시트가 떠 있는 동안 토스트는 창 뒤에 깔려 보이지 않는다 */
  const [hoursError, setHoursError] = useState<string>();
  const [closeError, setCloseError] = useState<string>();
  /** 카카오톡 공유 창을 여는 중. SDK를 처음 불러올 때 1~2초 걸린다 */
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      // 둘은 서로를 기다릴 이유가 없다. 같이 보내야 화면이 두 배로 늦지 않는다
      const [truck, session] = await Promise.all([
        getMyFoodTruck(),
        getTodaySession(),
      ]);
      if (!truck) {
        // 트럭이 없으면 보여 줄 홈이 없다. 스켈레톤을 그대로 둔 채 등록 화면으로 보낸다.
        // 뒤로가기로 빈 홈에 돌아오지 않게 기록을 바꿔 넣는다
        router.replace("/owner/setup");
        return;
      }
      setState({ kind: "success", truck, session });
    } catch {
      setState({ kind: "error" });
    }
  }, [router]);

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

  async function handleSaveHours(
    session: TodaySession,
    openTime: string,
    closeTime: string,
  ) {
    if (hoursSaving) return;
    setHoursSaving(true);
    setHoursError(undefined);
    try {
      const result = await setSessionHours(session.id, {
        open_time: openTime,
        close_time: closeTime,
      });
      patchSession({ open_time: result.open_time, close_time: result.close_time });
      setHoursOpen(false);
      // "영업시간 저장하기"를 눌렀으니 토스트도 같은 말을 쓴다
      toast("영업시간을 저장했어요");
    } catch {
      // 창을 닫지 않는다. 굴려 놓은 값을 그대로 두고 다시 누르게 한다
      setHoursError("영업시간을 저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setHoursSaving(false);
    }
  }

  async function handleOpen(session: TodaySession) {
    if (pending) return;
    setPending(true);
    try {
      const result = await openSession(session.id);
      patchSession({ status: result.status });
      // 토스트 대신 오픈 완료 시트를 띄운다. 시트 제목이 "오픈했어요"로 같은 말을 한다
      setOpenDone(true);
    } catch {
      toast("오픈하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요", "notice");
    } finally {
      setPending(false);
    }
  }

  async function handleClose(session: TodaySession) {
    if (pending) return;
    setPending(true);
    setCloseError(undefined);
    try {
      const result = await closeSession(session.id);
      patchSession({ status: result.status });
      setCloseAsking(false);
      toast("오늘 영업을 마감했어요");
    } catch {
      // 확인창이 열려 있어 토스트는 창 뒤에 깔린다. 창 안에 보여준다
      setCloseError("마감하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
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
      toast("링크를 복사하지 못했어요. 주소를 길게 눌러 복사해 주세요", "notice");
    }
  }

  /**
   * 영업 중 홈에서도 카카오톡으로 보낼 수 있어야 한다(2026-11-11).
   * 전에는 오픈 직후 시트에만 있어서, 시트를 닫으면 "링크 복사하기"밖에 남지 않았다.
   * 카카오톡 창이 뜨는 게 곧 결과라 성공 토스트는 띄우지 않는다.
   */
  async function handleKakao(shareUrl: string) {
    if (sharing) return;
    setSharing(true);
    try {
      await shareToKakao(shareUrl);
    } catch {
      toast(
        "카카오톡을 열지 못했어요. 링크를 복사해서 카카오톡에 붙여 넣어 주세요",
        "notice",
      );
    } finally {
      setSharing(false);
    }
  }

  if (state.kind === "loading") return <HomeSkeleton />;

  if (state.kind === "error") {
    return (
      <main className={styles.screen}>
        {/* 홈을 못 불러와도 나갈 수는 있어야 한다 */}
        <div className={styles.topBar}>
          <LogoutButton />
        </div>
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
  const ready = session ? canOpen(session) : false;
  const hint = openHint(session);
  const shareUrl = shareLinkFrom(truck.share_url);

  return (
    <main className={styles.screen}>
      <header className={isOpen ? styles.headerOpen : styles.header}>
        <div className={styles.headerTop}>
          {/* 내 가게 이름. 방금 등록한 이름이 맞게 들어갔는지 홈에서 바로 보인다(2026-11-17) */}
          <p className={styles.truckName}>{truck.name}</p>
          {/* 설정·로그아웃은 탭이 아니다. 홈 상단 아이콘으로 둔다(design-system.md BottomNav) */}
          <LogoutButton />
        </div>
        {isOpen ? (
          <p className={styles.openBadge}>
            <span className={styles.openDot} aria-hidden="true" />
            지금 영업 중
          </p>
        ) : (
          <p className={styles.date}>{formatToday(session?.date)}</p>
        )}
        {/*
         * 머리말이 지금 상태를 말한다. 전에는 다 채운 뒤에도 "준비되셨나요?"를 물었다.
         * 긴 제목 둘에는 트럭 그림을 붙이지 않는다 — 360px에서 그림만 혼자 다음 줄로 넘어갔다.
         */}
        <h1 className={styles.title}>
          {isOpen
            ? "손님들이 지금 찾아오고 있어요"
            : ready
              ? "준비 끝! 이제 오픈만 하면 돼요"
              : "오늘 영업 준비되셨나요? 🚚"}
        </h1>
      </header>

      <ul className={styles.rows} aria-label="오늘 영업 설정">
        <SettingRow
          label="위치"
          value={session?.location_label}
          href="/owner/location"
          plain={isOpen}
        />
        <SettingRow
          label="영업시간"
          value={formatHours(session)}
          // 오늘 세션이 없으면 저장할 곳이 없다. 누를 수 없는 줄로 둔다
          onClick={session ? () => setHoursOpen(true) : undefined}
          plain={isOpen}
        />
        <SettingRow
          label="메뉴"
          value={session?.menus[0]?.name}
          href="/owner/menu"
          plain={isOpen}
        />
      </ul>

      {isOpen ? (
        <section className={styles.share}>
          <div className={styles.shareHead}>
            <h2 className={styles.shareTitle}>손님에게 공유할 링크</h2>
            {/*
             * "손님 보기"는 탭이 아니다(2026-09-16 확정).
             * 다른 트럭까지 보이는 /nearby가 아니라 내 트럭의 공유 페이지만 연다.
             */}
            <Link className={styles.previewLink} href={sharePathFrom(truck.share_url)}>
              내 가게 페이지 미리보기
            </Link>
          </div>
          {/* 백엔드 share_url이 아니라 지금 배포된 주소로 만든 링크를 보여 주고 복사한다(lib/site.ts) */}
          <p className={styles.shareUrl}>{shareUrl}</p>
          {/*
           * 영업 중인 사장님이 여기서 제일 자주 할 일은 링크를 카톡방에 보내는 것이다.
           * 그래서 카카오톡을 위에 두고, 복사는 보조로 둔다(오픈 완료 시트와 같은 순서).
           */}
          <div className={styles.shareActions}>
            <Button
              block
              variant="kakao"
              loading={sharing}
              onClick={() => void handleKakao(shareUrl)}
            >
              카카오톡으로 공유하기
            </Button>
            <Button block variant="secondary" onClick={() => void handleCopyLink(shareUrl)}>
              링크 복사하기
            </Button>
          </div>
        </section>
      ) : null}

      {/*
       * 오픈 전에는 버튼 위에 "무엇이 남았는지" 한 줄을 둔다(2026-11-11).
       * 전에는 그 안내를 비활성 버튼 안에 넣었다. 비활성 버튼은 흐리게 칠해져서(불투명도 0.4)
       * 대비가 1.62:1이었다 — 빈 화면에서 제일 필요한 말이 제일 안 보였다.
       * 버튼 문구는 켜져 있든 꺼져 있든 "지금 오픈하기"다. 버튼은 누르면 일어날 일만 말한다.
       */}
      <footer
        className={styles.footer}
        data-bottom-cta={!isOpen && hint ? "with-hint" : ""}
      >
        {isOpen ? (
          <Button block variant="secondary" onClick={() => setCloseAsking(true)}>
            오늘 영업 마감하기
          </Button>
        ) : (
          <>
            {hint ? <p className={styles.footerHint}>{hint}</p> : null}
            <Button
              block
              loading={pending}
              disabled={!session || !ready}
              onClick={() => session && void handleOpen(session)}
            >
              🎉 지금 오픈하기
            </Button>
          </>
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
        error={closeError}
        onConfirm={() => session && void handleClose(session)}
        onCancel={() => {
          setCloseAsking(false);
          setCloseError(undefined);
        }}
      />

      <HoursSheet
        open={hoursOpen}
        openTime={session?.open_time ?? null}
        closeTime={session?.close_time ?? null}
        saving={hoursSaving}
        error={hoursError}
        onSave={(openTime, closeTime) =>
          session && void handleSaveHours(session, openTime, closeTime)
        }
        onClose={() => {
          setHoursOpen(false);
          setHoursError(undefined);
        }}
      />

      <OpenDoneSheet
        open={openDone}
        link={shareUrl}
        onClose={() => setOpenDone(false)}
      />
    </main>
  );
}

/** 위치·영업시간·메뉴 한 줄. 값이 있으면 채워진 모양, 없으면 회색 안내 */
function SettingRow({
  label,
  value,
  href,
  onClick,
  plain = false,
}: {
  label: string;
  value?: string | null;
  /** 다른 화면으로 가는 줄 */
  href?: string;
  /** 이 화면에서 창을 여는 줄. href와 같이 쓰지 않는다 */
  onClick?: () => void;
  /**
   * 영업 중에는 채워진 줄을 주황으로 칠하지 않는다(피그마 `15`와 같다).
   * 주황 면은 "하나씩 채워 가는 중"을 보여 주는 표시인데, 오픈한 뒤에는 그 뜻이 끝났다.
   * 그대로 두면 초록 머리말 · 주황 줄 · 노랑 카카오 버튼이 한 화면에서 겨룬다.
   */
  plain?: boolean;
}) {
  const filled = Boolean(value);
  const body = (
    <>
      <span className={styles.rowLabel}>{label}</span>
      <span className={filled ? styles.rowValue : styles.rowEmpty}>
        {/* 탭 이름이 "위치 정하기" · "메뉴 정하기"다. 같은 동작은 같은 단어로 — "설정"이 아니라 "정하기" */}
        {filled ? value : "아직 정하지 않았어요"}
      </span>
    </>
  );

  return (
    <li
      className={
        filled ? (plain ? styles.rowPlain : styles.rowFilled) : styles.row
      }
    >
      {/*
       * 갈 곳도 열 창도 없는 항목은 누를 수 있게 만들지 않는다.
       * 눌러도 아무 일이 없는 버튼을 두면 데모에서 반드시 눌린다.
       */}
      {href ? (
        <Link className={styles.rowLink} href={href}>
          {body}
          <span className={styles.rowChevron} aria-hidden="true">
            ›
          </span>
        </Link>
      ) : onClick ? (
        <button type="button" className={styles.rowLink} onClick={onClick}>
          {body}
          <span className={styles.rowChevron} aria-hidden="true">
            ›
          </span>
        </button>
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
      {/* 마감한 뒤에 가장 자주 하는 일이 앱을 닫는 것이다. 여기서도 로그아웃할 수 있다 */}
      <div className={styles.closedTop}>
        <LogoutButton inverse />
      </div>
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

      {/* 마감 직후 "오늘 영업을 마감했어요" 토스트가 이 글자를 덮지 않게 하단 요소로 표시한다(globals.css) */}
      <p className={styles.closedOutro} data-bottom-cta>
        푹 쉬고 내일 또 힘내볼까요?
      </p>
    </section>
  );
}

/** 로딩 스켈레톤. 불러온 뒤 줄 수가 같아서 화면이 튀지 않는다 */
function HomeSkeleton() {
  return (
    <main className={styles.screen} aria-busy="true">
      <div className={styles.header} aria-hidden="true">
        <span className={styles.skeletonLine} />
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

/**
 * 오픈하려면 무엇이 남았는지 한 줄로. 다 됐으면 null — 버튼이 켜진 것으로 충분하다.
 * 영업시간은 넣지 않는다. 오픈 조건인지 아직 정해지지 않았다(product-rules.md `[미정]`).
 */
function openHint(session: TodaySession | null): string | null {
  const needLocation = !session?.location_label;
  const needMenu = !session || session.menu_count === 0;

  if (needLocation && needMenu) return "위치와 메뉴를 정하면 오픈할 수 있어요";
  if (needLocation) return "위치만 정하면 오픈할 수 있어요";
  if (needMenu) return "메뉴만 정하면 오픈할 수 있어요";
  return null;
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
  return formatHoursText(session?.open_time, session?.close_time);
}
