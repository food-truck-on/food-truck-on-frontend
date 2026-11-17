"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import { TextInput } from "@/components/TextInput/TextInput";
import { useToast } from "@/components/Toast/Toast";
import {
  createFoodTruck,
  getMyFoodTruck,
  isTruckExistsError,
} from "@/lib/mock/trucks";
import styles from "./SetupScreen.module.css";

/** 가게 이름 최대 글자 수. 피그마 `00-1` 상호명과 같다 */
const NAME_MAX = 20;

type State = "loading" | "error" | "form";

/**
 * 가게 이름 등록 (/owner/setup). 피그마 `00-1`~`00-4` 중 **상호명 입력만** 만들었다(2026-11-17).
 * 업종 칩과 로고는 백엔드에 저장할 칸이 없어서 만들지 않았다(product-rules.md "아직 없는 화면").
 * 피그마를 열 수 없어 기존 토큰과 공통 컴포넌트만으로 만들었다. 피그마가 돌아오면 대조한다.
 *
 * 처음 로그인한 사장님은 아직 트럭이 없다. 가게 이름을 받아 트럭을 만들고 홈으로 보낸다.
 *
 * - **트럭이 있는지로만 판단한다.** 로그인 응답의 is_new_user로 가르지 않는다.
 *   가입만 하고 나갔다 돌아온 사장님도 트럭이 없다
 * - 들어왔는데 트럭이 이미 있으면 홈으로 보낸다
 * - 하단 탭을 두지 않는다. 트럭이 없으면 갈 탭이 없다 (app/owner/setup/page.tsx)
 * - 주 버튼을 화면 아래에 붙이지 않는다. 글자를 입력하는 화면이라 키보드가 올라오면 가려진다(design-system.md)
 *
 * 주소 끝에 ?truck=none 을 붙이면 트럭 없는 상태를, ?truck=taken 이면 "이미 등록됨"(409)을,
 * ?mock=slow / error 로 확인 중·불러오기 실패를 볼 수 있다(lib/mock/trucks.ts).
 */
export function SetupScreen() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<State>("loading");
  const [name, setName] = useState("");
  /** "가게 등록하기"를 한 번이라도 눌렀는가. 누르기 전에는 입력 오류를 보이지 않는다(AddMenuForm과 같다) */
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const load = useCallback(async () => {
    setState("loading");
    try {
      const truck = await getMyFoodTruck();
      if (truck) {
        // 이미 등록한 사장님이 주소를 직접 치고 들어온 경우. 뒤로가기로 다시 오지 않게 바꿔 넣는다
        router.replace("/owner");
        return;
      }
      setState("form");
    } catch {
      setState("error");
    }
  }, [router]);

  useEffect(() => {
    // 화면에 들어오자마자 트럭이 있는지 확인한다. 결과를 받은 뒤 상태를 바꾸는 게 목적이다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const trimmed = name.trim();
  // 한글은 한 글자가 코드 한 칸이지만, 이모지처럼 두 칸짜리 글자도 한 글자로 센다
  const length = [...trimmed].length;
  const nameError = !tried
    ? undefined
    : length === 0
      ? "가게 이름을 적어 주세요"
      : length > NAME_MAX
        ? `가게 이름은 ${NAME_MAX}자까지 쓸 수 있어요. 지금 ${length}자예요`
        : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (length === 0 || length > NAME_MAX) return;
    // 버튼은 로딩 중에 눌리지 않지만 키보드의 완료 키로는 다시 보낼 수 있다
    if (saving) return;

    setSaving(true);
    setSaveError(undefined);
    try {
      await createFoodTruck(trimmed);
      // "가게 등록하기"를 눌렀으니 토스트도 같은 말을 쓴다. 토스트는 앱 전체에 걸려 있어 홈에서도 보인다
      toast("가게를 등록했어요");
      // 뒤로가기로 이 화면에 다시 오지 않게 기록을 바꿔 넣는다. 홈으로 넘어갈 때까지 버튼은 로딩으로 둔다
      router.replace("/owner");
    } catch (error) {
      if (isTruckExistsError(error)) {
        // 다른 기기에서 먼저 등록했다. 잘못한 게 아니라서 오류로 보이지 않고 홈으로 보낸다
        toast("이미 등록한 가게가 있어서 홈으로 왔어요", "notice");
        router.replace("/owner");
        return;
      }
      // 적어 둔 이름을 지우지 않는다. 그대로 두고 다시 누르게 한다
      setSaveError(
        "가게를 등록하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요",
      );
      setSaving(false);
    }
  }

  if (state === "loading") return <SetupSkeleton />;

  if (state === "error") {
    return (
      <main className={styles.screen}>
        <section className={styles.message} role="alert">
          <h1 className={styles.messageTitle}>가게 정보를 불러오지 못했어요</h1>
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

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>가게 이름을 알려 주세요</h1>
        <p className={styles.desc}>
          처음 한 번만 정하면 돼요. 손님이 보는 화면에 이 이름이 그대로 보여요
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <TextInput
          label="가게 이름"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError}
          hint={`${NAME_MAX}자까지 쓸 수 있어요 · 지금 ${length}자`}
          placeholder="예: 타코야끼 달인"
          autoFocus
          autoComplete="off"
          enterKeyHint="done"
        />

        {/*
         * 백엔드가 가게 이름으로 공유 링크를 만들고, 이름을 고치는 API가 아직 없다.
         * 누르기 전에 알아야 하는 일이라 입력 칸 바로 아래에 늘 보이는 글자로 둔다.
         * (TextInput의 hint에 넣으면 입력 오류가 뜰 때 가려진다)
         */}
        <p className={styles.note}>
          <span className={styles.noteIcon}>
            <Icon name="alert" size="sm" />
          </span>
          <span>
            이 이름은 손님에게 보내는 공유 링크에도 들어가요. 지금은 등록한 뒤에
            고칠 수 없으니 한 번 더 확인해 주세요
          </span>
        </p>

        {/* 키보드가 올라와 있으면 화면 아래의 토스트가 가려진다. 버튼 바로 위에 글자로 보인다 */}
        {saveError ? (
          <p className={styles.saveError} role="alert">
            <span className={styles.noteIcon}>
              <Icon name="alert" size="sm" />
            </span>
            <span>{saveError}</span>
          </p>
        ) : null}

        <Button type="submit" block loading={saving}>
          가게 등록하기
        </Button>
      </form>
    </main>
  );
}

/** 트럭이 있는지 확인하는 동안. 입력 화면과 덩어리 배치가 같아 화면이 덜 튄다 */
function SetupSkeleton() {
  return (
    <main
      className={styles.screen}
      aria-busy="true"
      aria-label="가게 정보 확인하는 중"
    >
      <div className={styles.header} aria-hidden="true">
        <span className={styles.skeletonTitle} />
        <span className={styles.skeletonLine} />
      </div>
      <div className={styles.form} aria-hidden="true">
        <span className={styles.skeletonInput} />
        <span className={styles.skeletonLine} />
        <span className={styles.skeletonInput} />
      </div>
    </main>
  );
}
