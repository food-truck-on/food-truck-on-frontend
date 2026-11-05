"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { hasSession, subscribeSession } from "@/lib/auth/session";

/**
 * 사장님 화면(/owner/*)은 로그인이 필요하다(frontend.md 라우팅 표).
 * 로그인하지 않았으면 /login으로 보낸다.
 *
 * 로그인 상태는 브라우저에만 있어서 서버에서 그릴 때는 알 수 없다(null).
 * 확인이 끝나기 전에는 아무것도 그리지 않는다 — 남의 화면이 잠깐 비쳤다 사라지는 것보다 낫다.
 */
export default function OwnerLayout({ children }: LayoutProps<"/owner">) {
  const router = useRouter();
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => null);

  useEffect(() => {
    if (signedIn === false) router.replace("/login");
  }, [signedIn, router]);

  return signedIn ? children : null;
}
