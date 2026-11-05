"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import { saveSession } from "@/lib/auth/session";
import { PROVIDER_NAME } from "@/lib/auth/social";
import { socialLogin } from "@/lib/mock/auth";
import type { SocialProvider } from "@/lib/mock/types";
import styles from "./auth.module.css";

type Props = {
  provider: SocialProvider | null;
  /** 인증 페이지가 붙여 준 값. 백엔드에 provider_token으로 넘긴다 */
  code: string | null;
  /** 인증 페이지가 붙여 준 오류. 사용자가 동의하지 않고 닫으면 "access_denied" */
  error: string | null;
};

/**
 * 카카오·구글 인증 페이지에서 돌아오는 자리(/login/callback).
 *
 *   error=access_denied → 취소 화면. 사용자가 일부러 닫은 것이라 실패와 문구를 다르게 쓴다
 *   code 있음          → 로딩 → 백엔드 로그인 → 세션 저장 → 사장님 홈
 *   그 밖              → 실패 화면
 */
export function CallbackScreen({ provider, code, error }: Props) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  /*
   * 개발 모드(StrictMode)는 effect를 두 번 실행한다. 실제 인증 code는 한 번 쓰면 버려져서
   * 두 번 보내면 두 번째가 실패한다. 한 번만 보내게 막는다.
   */
  const sent = useRef(false);

  const name = provider ? PROVIDER_NAME[provider] : "소셜";
  const cancelled = error === "access_denied";
  const invalid = !provider || (!code && !cancelled) || (error !== null && !cancelled);

  useEffect(() => {
    if (sent.current || !provider || !code || error) return;
    sent.current = true;

    socialLogin(provider, code)
      .then((result) => {
        saveSession(result);
        // 뒤로가기로 이 화면에 다시 오지 않게 기록을 바꿔 넣는다
        router.replace("/owner");
      })
      .catch(() => setFailed(true));
  }, [provider, code, error, router]);

  if (cancelled) {
    return (
      <Message
        title="로그인을 취소했어요"
        desc={`${name} 화면에서 동의하지 않으면 로그인할 수 없어요. 다시 시작하려면 아래 버튼을 눌러 주세요`}
        onRetry={() => router.replace("/login")}
      />
    );
  }

  if (failed || invalid) {
    return (
      <Message
        alert
        title="로그인하지 못했어요"
        desc="인터넷 연결이 끊겼거나 서버에 문제가 있어요. 연결을 확인한 뒤 다시 로그인해 주세요"
        onRetry={() => router.replace("/login")}
      />
    );
  }

  return (
    <main className={styles.screen} aria-busy="true">
      <section className={styles.hero}>
        <span className={styles.spinner} aria-hidden="true" />
        <h1 className={styles.title}>로그인하고 있어요</h1>
        <p className={styles.desc} role="status">
          {name} 계정을 확인하고 있어요. 잠시만 기다려 주세요
        </p>
      </section>
    </main>
  );
}

function Message({
  title,
  desc,
  alert = false,
  onRetry,
}: {
  title: string;
  desc: string;
  alert?: boolean;
  onRetry: () => void;
}) {
  return (
    <main className={styles.screen}>
      <section className={styles.hero} role={alert ? "alert" : undefined}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.desc}>{desc}</p>
      </section>
      <div className={styles.actions}>
        <Button block onClick={onRetry}>
          다시 로그인하기
        </Button>
      </div>
    </main>
  );
}
