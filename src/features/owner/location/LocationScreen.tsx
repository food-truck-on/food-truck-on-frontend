"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/Button/Button";
import { Icon } from "@/components/Icon/Icon";
import { useToast } from "@/components/Toast/Toast";
import { DEFAULT_CENTER, reverseGeocode, useKakaoMap } from "@/lib/map/kakao";
import { getSavedLocations, setLocationFavorite } from "@/lib/mock/locations";
import { getTodaySession, setSessionLocation } from "@/lib/mock/sessions";
import type { SavedLocation, TodaySession } from "@/lib/mock/types";
import { LocationMap } from "./LocationMap";
import styles from "./LocationScreen.module.css";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "success"; session: TodaySession | null; places: SavedLocation[] };

/**
 * 고른 위치. 자주 가는 장소에서 골랐으면 locationId가 있고,
 * "현재 위치 불러오기"로 골랐으면 null이다. 3-4 요청 본문의 location_id와 같다.
 */
type Picked = {
  locationId: number | null;
  name: string;
  label: string;
  lat: number;
  lng: number;
};

/**
 * 위치 정하기 (/owner/location). 피그마 `02 위치 정하기 / 기본` · `03 위치 정하기 / 장소 선택됨`.
 *
 * 자주 가는 장소를 누르거나 현재 위치를 불러와 고른 뒤, "이 위치로 설정"을 눌러야 저장된다.
 * 고르기만 해서는 저장되지 않는다 — 잘못 누른 장소가 바로 손님 화면에 나가면 안 된다.
 *
 * 주소 끝에 ?mock=slow / error / empty 를 붙여 각 상태를 볼 수 있다.
 *
 * 피그마와 다르게 만든 것
 * - 뒤로가기 화살표를 뺐다. 하단 탭으로 들어오는 화면이라 돌아갈 곳이 없다(메뉴 정하기와 같다)
 * - "현재 위치로 설정" → "현재 위치 불러오기". 누르면 저장되는 게 아니라 위치를 찾아 고르기만 한다
 * - 별은 선택 표시가 아니라 **맨 위 고정** 버튼이다(2026-09-21 결정). 선택은 테두리·체크로 표시한다
 * - 자주 가는 장소 추가·편집·삭제는 디자인이 없어 만들지 않았다(product-rules.md "아직 없는 화면")
 */
export function LocationScreen() {
  const router = useRouter();
  const toast = useToast();
  const mapStatus = useKakaoMap();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [picked, setPicked] = useState<Picked | null>(null);
  /** 현재 위치를 찾는 중. 권한 창 → 좌표 → 주소 변환까지 몇 초 걸린다 */
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  /** 별 켜기·끄기 요청이 진행 중인 장소. 연타로 순서가 여러 번 뒤바뀌지 않게 막는다 */
  const [favoritePendingId, setFavoritePendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [session, places] = await Promise.all([
        getTodaySession(),
        getSavedLocations(),
      ]);
      setState({ kind: "success", session, places: sortByFavorite(places) });
    } catch {
      setState({ kind: "error" });
    }
  }, []);

  useEffect(() => {
    // 화면에 들어오자마자 목록을 불러온다. 결과를 받은 뒤 상태를 바꾸는 게 목적이다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function pickPlace(place: SavedLocation) {
    setPicked({
      locationId: place.id,
      name: place.name,
      label: place.address,
      lat: place.latitude,
      lng: place.longitude,
    });
  }

  async function handleFavorite(place: SavedLocation) {
    if (favoritePendingId !== null) return;
    setFavoritePendingId(place.id);
    try {
      const result = await setLocationFavorite(place.id, !place.is_favorite);
      setState((prev) =>
        prev.kind === "success"
          ? { ...prev, places: applyFavorite(prev.places, result.id, result.is_favorite) }
          : prev,
      );
      // 성공 토스트는 띄우지 않는다. 별 색·"고정" 글자·순서가 바로 바뀌어 결과가 눈앞에 보인다
    } catch {
      toast("고정하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    } finally {
      setFavoritePendingId(null);
    }
  }

  /**
   * 위치 권한은 이 버튼을 누른 순간에만 묻는다. 화면에 들어오자마자 묻지 않는다.
   * 맥락 없이 뜨면 대부분 거부한다(product-rules.md "위치").
   */
  function handleLocate() {
    if (locating) return;
    if (!("geolocation" in navigator)) {
      toast("이 기기에서는 현재 위치를 찾을 수 없어요. 자주 가는 장소에서 골라 주세요");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await reverseGeocode(coords.latitude, coords.longitude);
          setPicked({
            locationId: null,
            name: "현재 위치",
            label: address,
            lat: coords.latitude,
            lng: coords.longitude,
          });
        } catch {
          toast("현재 위치의 주소를 찾지 못했어요. 잠시 뒤 다시 눌러 주세요");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        toast(
          error.code === error.PERMISSION_DENIED
            ? "위치 권한이 꺼져 있어요. 휴대폰 설정에서 권한을 켜거나 자주 가는 장소에서 골라 주세요"
            : "현재 위치를 찾지 못했어요. 잠시 뒤 다시 누르거나 자주 가는 장소에서 골라 주세요",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleSave(session: TodaySession) {
    if (!picked || saving) return;
    setSaving(true);
    try {
      await setSessionLocation(session.id, {
        location_id: picked.locationId,
        latitude: picked.lat,
        longitude: picked.lng,
        location_label: picked.label,
      });
      // "이 위치로 설정"을 눌렀으니 토스트도 같은 말을 쓴다. 토스트는 앱 전체에 걸려 있어 홈에서도 보인다
      toast("위치를 설정했어요");
      router.push("/owner");
    } catch {
      toast("위치를 설정하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
      setSaving(false);
    }
  }

  const places = state.kind === "success" ? state.places : [];
  const first = places[0];
  const center = picked
    ? { lat: picked.lat, lng: picked.lng }
    : first
      ? { lat: first.latitude, lng: first.longitude }
      : DEFAULT_CENTER;

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>위치 정하기</h1>
        <p className={styles.desc}>
          오늘 장사할 곳을 골라 주세요. 손님 페이지에 이 위치가 보여요
        </p>
      </header>

      <LocationMap status={mapStatus} center={center} picked={picked} />

      <Button
        variant="secondary"
        block
        loading={locating}
        // 주소 변환에 지도 SDK가 필요하다. 지도가 안 뜨면 목록에서 고르게 한다
        disabled={mapStatus !== "ready"}
        onClick={handleLocate}
      >
        <Icon name="target" size="sm" />
        현재 위치 불러오기
      </Button>

      <section className={styles.section} aria-labelledby="saved-places">
        <h2 id="saved-places" className={styles.sectionTitle}>
          자주 가는 장소
        </h2>

        {state.kind === "loading" ? <PlaceSkeleton /> : null}

        {state.kind === "error" ? (
          <div className={styles.message} role="alert">
            <p className={styles.messageTitle}>자주 가는 장소를 불러오지 못했어요</p>
            <p className={styles.messageDesc}>
              인터넷 연결이 끊겼거나 서버에 문제가 있어요.
              연결을 확인한 뒤 다시 불러와 주세요
            </p>
            <Button variant="secondary" onClick={() => void load()}>
              다시 불러오기
            </Button>
          </div>
        ) : null}

        {state.kind === "success" && places.length === 0 ? (
          <div className={styles.message}>
            <p className={styles.messageTitle}>저장한 장소가 아직 없어요</p>
            <p className={styles.messageDesc}>
              장사할 곳에 도착했다면 &ldquo;현재 위치 불러오기&rdquo;를 눌러 주세요
            </p>
          </div>
        ) : null}

        {places.length > 0 ? (
          <ul className={styles.list}>
            {places.map((place) => {
              const selected = picked?.locationId === place.id;
              return (
                <li
                  key={place.id}
                  className={[styles.place, selected ? styles.placeSelected : ""]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* 버튼 안에 버튼을 넣을 수 없어서 별과 고르기를 나란히 둔다 */}
                  <button
                    type="button"
                    aria-pressed={place.is_favorite}
                    aria-label={`${place.name} 맨 위에 고정`}
                    disabled={favoritePendingId !== null}
                    className={[
                      styles.placeStar,
                      place.is_favorite ? styles.placeStarOn : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => void handleFavorite(place)}
                  >
                    <Icon name="star" />
                  </button>
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={styles.placePick}
                    onClick={() => pickPlace(place)}
                  >
                    <span className={styles.placeText}>
                      <span className={styles.placeName}>{place.name}</span>
                      <span className={styles.placeAddress}>{place.address}</span>
                    </span>
                    {/* 고정 여부를 별 색으로만 말하지 않는다. 글자를 함께 둔다 */}
                    {place.is_favorite ? (
                      <span className={styles.placeBadge}>고정</span>
                    ) : null}
                    {/* 선택 상태도 색으로만 말하지 않는다. 체크 표시를 함께 둔다 */}
                    {selected ? (
                      <span className={styles.placeCheck}>
                        <Icon name="check" size="sm" />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>

      {state.kind === "success" && !state.session ? (
        // 오늘 세션이 없으면 위치를 저장할 곳이 없다. 5-1이 이때 무엇을 주는지 백엔드에 물어본 상태다
        <p className={styles.notice} role="status">
          오늘 영업 정보를 불러오지 못해 위치를 저장할 수 없어요. 홈에서 다시 들어와 주세요
        </p>
      ) : null}

      <div className={styles.footer}>
        <Button
          block
          loading={saving}
          disabled={!picked || state.kind !== "success" || !state.session}
          onClick={() => {
            if (state.kind === "success" && state.session) {
              void handleSave(state.session);
            }
          }}
        >
          이 위치로 설정
        </Button>
      </div>
    </main>
  );
}

/**
 * 처음 불러올 때 한 번만 쓴다. 별을 켠 장소를 맨 위로, 같은 묶음 안에서는 서버가 준 순서 그대로
 * (sort는 안정 정렬이다). 서버가 정렬해서 줄지는 정해지지 않아 프론트에서 맞춘다.
 */
function sortByFavorite(places: SavedLocation[]): SavedLocation[] {
  return [...places].sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));
}

/**
 * 별을 누른 뒤의 목록 순서.
 * - 켜면: 고정 묶음 안으로 들어간다. 나머지 순서는 그대로
 * - 끄면: 원래 자리를 찾아가지 않고 **남은 고정 장소 바로 아래**에 둔다(2026-09-21 결정).
 *   방금 누른 자리 근처에 머물러야 목록이 덜 튄다
 *
 * 이 순서는 화면에만 있다. 다시 불러오면 sortByFavorite 순서로 돌아간다.
 * 서버에 순서 칸이 없어서다(MenuItem의 display_order 요청과 같은 문제).
 */
function applyFavorite(
  places: SavedLocation[],
  id: number,
  isFavorite: boolean,
): SavedLocation[] {
  const target = places.find((p) => p.id === id);
  if (!target) return places;

  const updated = { ...target, is_favorite: isFavorite };
  if (isFavorite) {
    return sortByFavorite(places.map((p) => (p.id === id ? updated : p)));
  }

  const rest = places.filter((p) => p.id !== id);
  const favoriteCount = rest.filter((p) => p.is_favorite).length;
  return [...rest.slice(0, favoriteCount), updated, ...rest.slice(favoriteCount)];
}

/** 로딩 스켈레톤. 장소 카드와 같은 높이 흐름이라 불러온 뒤 화면이 튀지 않는다 */
function PlaceSkeleton() {
  return (
    <ul className={styles.list} aria-busy="true" aria-label="자주 가는 장소 불러오는 중">
      {[0, 1, 2].map((i) => (
        <li key={i} className={styles.skeletonCard} aria-hidden="true">
          <span className={styles.skeletonLineWide} />
          <span className={styles.skeletonLine} />
        </li>
      ))}
    </ul>
  );
}
