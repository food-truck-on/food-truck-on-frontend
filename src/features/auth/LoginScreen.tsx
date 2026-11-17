"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/Button/Button";
import { hasSession, subscribeSession } from "@/lib/auth/session";
import { authorizeUrl, PROVIDER_NAME } from "@/lib/auth/social";
import type { SocialProvider } from "@/lib/mock/types";
import styles from "./auth.module.css";

/**
 * 사장님 로그인 — 피그마 온보딩 `03`. 손님은 로그인하지 않는다(product-rules.md "사용자").
 *
 * 버튼을 누르면 카카오·구글 인증 페이지로 **떠난다.** 떠나는 사이 화면이 멈춘 것처럼 보이지 않게
 * 누른 버튼에 로딩을 걸고 "이동하고 있어요"를 띄운다(frontend.md "인증 페이지를 다녀오는 사이의 로딩 화면").
 *
 * @param mock ?mock= 값. 목 로그인에서 취소·실패 상황을 고르는 데만 쓴다(lib/auth/social.ts)
 */
export function LoginScreen({ mock }: { mock: string | null }) {
  const router = useRouter();
  const [leaving, setLeaving] = useState<SocialProvider | null>(null);
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => null);

  // 이미 로그인했으면 홈으로 보낸다. 로그인 직후 홈에서 뒤로가기를 누르면 여기로 오기 때문이다
  useEffect(() => {
    if (signedIn) router.replace("/owner");
  }, [signedIn, router]);

  /*
   * 인증 페이지에서 브라우저 뒤로가기로 돌아오면 브라우저가 떠나기 직전 화면을 그대로 되살린다(bfcache).
   * 그러면 로딩이 걸린 채로 멈춰 있게 된다. 되살아난 순간 로딩을 푼다.
   */
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setLeaving(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  function start(provider: SocialProvider) {
    setLeaving(provider);
    window.location.assign(authorizeUrl(provider, mock));
  }

  /*
   * 이미 로그인한 사람에게는 로그인 화면을 그리지 않는다. 위 effect가 홈으로 보내는 건 화면을 한 번 그린 뒤라,
   * 그 사이 카카오·구글 버튼이 잠깐 비쳤다가 사라졌다(2026-11-17).
   * 확인 중(null)일 때는 그대로 그린다. 로그인 안 한 사람이 대부분인 화면이라, 그때까지 비워 두면
   * 서버가 그려 준 화면을 버리고 빈 화면부터 보게 된다(사장님 화면 owner/layout.tsx와 반대로 정한 이유).
   */
  if (signedIn) return null;

  return (
    <main className={styles.screen}>
      <section className={styles.hero}>
        <h1 className={styles.title}>사장님 로그인</h1>
        <p className={styles.desc}>
          카카오나 구글 계정으로 시작해요. 오늘 위치와 메뉴를 올리면 손님에게 보낼 링크가 생겨요
        </p>
      </section>

      <div className={styles.actions}>
        <Button
          block
          variant="kakao"
          loading={leaving === "kakao"}
          disabled={leaving !== null}
          onClick={() => start("kakao")}
        >
          카카오로 시작하기
        </Button>
        <Button
          block
          variant="google"
          loading={leaving === "google"}
          disabled={leaving !== null}
          onClick={() => start("google")}
        >
          구글로 시작하기
        </Button>

        <p className={styles.status} role="status">
          {leaving ? `${PROVIDER_NAME[leaving]} 로그인 화면으로 이동하고 있어요` : ""}
        </p>

        {/* 데모에서 실제 계정을 넣어도 되는지 망설이지 않게 미리 말해 둔다 */}
        <p className={styles.caption}>
          지금은 시험용 로그인이에요. 실제 계정 정보는 받지 않아요
        </p>
      </div>
    </main>
  );
}
