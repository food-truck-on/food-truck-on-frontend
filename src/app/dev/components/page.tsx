"use client";

import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { TextInput } from "@/components/TextInput/TextInput";
import { Toggle } from "@/components/Toggle/Toggle";
import styles from "./page.module.css";

/*
 * 개발 전용 확인 페이지. 배포 전에 이 폴더째 지운다.
 * docs/frontend.md 라우팅 표에도 그렇게 적어두었다.
 *
 * 긴 문구로 테스트한다 — 메뉴명은 실제로 15자를 넘는다.
 */
const LONG_MENU = "매콤 크림치즈 타코야끼 세트";

const TYPO = [
  ["--font-display", "화면 대표 제목"],
  ["--font-title", "섹션 제목"],
  ["--font-subtitle", "카드 제목, 메뉴명"],
  ["--font-body", "본문"],
  ["--font-caption", "보조 설명"],
  ["--font-label", "배지, 라벨"],
] as const;

const COLORS = [
  "--brand-primary",
  "--brand-primary-subtle",
  "--brand-primary-text",
  "--text-default",
  "--text-secondary",
  "--text-muted",
  "--text-on-brand",
  "--bg-surface",
  "--bg-page",
  "--border-default",
  "--border-strong",
  "--border-focus",
  "--status-open",
  "--status-open-bg",
  "--info",
] as const;

export default function ComponentsPreviewPage() {
  const [soldOut, setSoldOut] = useState(false);
  const [notify, setNotify] = useState(true);

  return (
    <main className={styles.page}>
      <header>
        <h1 className={styles.pageTitle}>컴포넌트 확인</h1>
        <p className={styles.pageNote}>
          개발 전용. 배포 전에 지운다. 폭을 360px까지 줄여서 깨지는지 본다
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Button</h2>

        <div className={styles.group}>
          <p className={styles.groupTitle}>variant — default</p>
          <Button variant="primary">오픈하기</Button>
          <Button variant="secondary">나중에 하기</Button>
          <Button variant="kakao">카카오로 시작하기</Button>
          <Button variant="google">구글로 시작하기</Button>
        </div>

        <div className={styles.group}>
          <p className={styles.groupTitle}>state — loading / disabled</p>
          <Button variant="primary" loading>
            오픈하는 중
          </Button>
          <Button variant="primary" disabled>
            오픈하기
          </Button>
          <Button variant="secondary" disabled>
            알림 받기 (준비 중)
          </Button>
        </div>

        <div className={styles.group}>
          <p className={styles.groupTitle}>block — 긴 문구</p>
          <Button variant="primary" block>
            {LONG_MENU} 품절 처리하기
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>TextInput</h2>

        <div className={styles.group}>
          <p className={styles.groupTitle}>surface=&quot;page&quot; — 페이지 위</p>
          <TextInput label="상호명" placeholder="타코야끼 달인" />
          <TextInput
            label="메뉴 이름"
            defaultValue={LONG_MENU}
            hint="15자가 넘어도 밀리지 않아야 한다"
          />
          <TextInput
            label="가격"
            defaultValue="0"
            error="가격은 100원 이상으로 적어주세요"
          />
          <TextInput label="슬러그" defaultValue="takoyaki-dalin" disabled />
        </div>

        <div className={styles.card}>
          <p className={styles.groupTitle}>surface=&quot;card&quot; — 카드 위</p>
          <TextInput
            label="영업 시간"
            surface="card"
            placeholder="18:00 ~ 23:00"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Toggle</h2>

        <div className={styles.card}>
          <Toggle
            label={LONG_MENU}
            checked={soldOut}
            onChange={setSoldOut}
            stateText={["품절", "판매 중"]}
          />
          <Toggle label="알림 받기" checked={notify} onChange={setNotify} />
          <Toggle
            label="자동 마감 (만들지 않음)"
            checked={false}
            onChange={() => {}}
            disabled
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>토큰</h2>

        <div className={styles.group}>
          <p className={styles.groupTitle}>색 15종</p>
          <div className={styles.swatches}>
            {COLORS.map((name) => (
              <div
                key={name}
                className={styles.swatch}
                style={{ background: `var(${name})` }}
                title={name}
              >
                {name.replace("--", "").slice(0, 6)}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.groupTitle}>타이포 6종 — 굵기는 하나뿐이다</p>
          {TYPO.map(([token, use]) => (
            <p
              key={token}
              className={styles.typeRow}
              style={{ font: `var(${token})` }}
            >
              {use} · 타코야끼 달인
            </p>
          ))}
        </div>
      </section>
    </main>
  );
}
