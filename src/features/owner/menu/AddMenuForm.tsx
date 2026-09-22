"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button/Button";
import { TextInput } from "@/components/TextInput/TextInput";
import type { NewMenu } from "@/lib/mock/menus";
import styles from "./MenuScreen.module.css";

type Props = {
  saving: boolean;
  onSubmit: (menu: NewMenu) => void;
  onCancel: () => void;
};

/**
 * 메뉴 추가 입력 카드. 피그마 `10 메뉴 정하기 / 메뉴 추가 입력`.
 *
 * 오류는 "추가하기"를 누른 뒤에만 보여준다. 첫 글자를 치기도 전에 빨간 글씨가 뜨면 혼나는 기분이 든다.
 * 한 번 누른 뒤에는 고치는 즉시 오류가 사라지게 매 입력마다 다시 검사한다.
 */
export function AddMenuForm({ saving, onSubmit, onCancel }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tried, setTried] = useState(false);

  const trimmed = name.trim();
  const nameError = tried && !trimmed ? "메뉴 이름을 적어 주세요" : undefined;
  const priceError =
    tried && !/^\d+$/.test(price) ? "가격을 숫자로만 적어 주세요. 예: 5000" : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTried(true);
    if (!trimmed || !/^\d+$/.test(price)) return;
    onSubmit({ name: trimmed, price: Number(price) });
  }

  return (
    <form
      className={styles.addForm}
      onSubmit={handleSubmit}
      noValidate
      // 입력 카드가 열려 있는 동안에는 이 카드가 하단 버튼 자리다
      data-bottom-cta
    >
      <TextInput
        label="메뉴 이름"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError}
        autoFocus
        autoComplete="off"
        enterKeyHint="next"
      />
      <TextInput
        label="가격 (원)"
        value={price}
        // 쉼표·"원"을 같이 쳐도 숫자만 남긴다. "5,000원" → "5000"
        onChange={(event) => setPrice(event.target.value.replace(/\D/g, ""))}
        error={priceError}
        hint={!priceError && price ? `${Number(price).toLocaleString("ko-KR")}원` : undefined}
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
      />
      <div className={styles.addActions}>
        <Button type="submit" block loading={saving}>
          추가하기
        </Button>
        <Button variant="secondary" block disabled={saving} onClick={onCancel}>
          그만두기
        </Button>
      </div>
    </form>
  );
}
