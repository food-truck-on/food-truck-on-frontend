import { cache } from "react";
import { ApiError, type MockScenario } from "@/lib/mock/mockFetch";
import { getMockSharedTruck, isMockSharedSlug } from "@/lib/mock/sharedTrucks";
import type { SessionStatus, SharedTruck } from "@/lib/mock/types";

/**
 * 손님 화면이 부르는 실제 API. **서버에서만 부른다.**
 *
 * 처음으로 실제 백엔드에 붙인 곳이다(2026-11-17). 공유 링크 페이지(`/t/:slug`)는 서버에서 그려지므로
 * 브라우저 호출 차단(CORS)과 로그인 없이도 부를 수 있다. 사장님 화면은 둘 다 풀려야 해서 아직 목데이터다.
 *
 * 주소는 코드에 박지 않는다. 환경 변수 `API_BASE_URL`로 받는다(lib/site.ts와 같은 이유).
 *   API_BASE_URL=https://food-truck-on-backend.onrender.com
 * `NEXT_PUBLIC_`을 붙이지 않았다. 서버만 쓰는 값이라 브라우저 번들에 넣을 이유가 없다.
 * 사장님 화면을 붙일 때는 브라우저가 직접 불러야 하므로 그때 공개용 변수를 따로 정한다.
 */
const API_BASE_URL = (process.env.API_BASE_URL ?? "").replace(/\/+$/, "");

/**
 * 응답을 기다리는 최대 시간.
 *
 * 백엔드 서버는 한동안 요청이 없으면 잠든다. 깨어나는 데 34초(11/16), 82초(11/17)가 걸렸다.
 * 그 시간을 스켈레톤으로 버티게 하지 않고, 10초에 끊어 "다시 불러오기"를 보여 준다.
 * 다시 누르는 동안 서버가 깨어난다. 근본 해결은 백엔드 쪽이다(서버를 재우지 않거나 미리 깨워 둔다).
 */
const TIMEOUT_MS = 10_000;

/**
 * 백엔드 주소 중 슬러그가 아닌 것. `GET /customer/food-trucks/nearby`는 주변 목록 조회라
 * `/t/nearby`로 들어오면 "위도·경도가 없다"는 400이 온다. 부르지 않고 없는 트럭으로 본다.
 */
const RESERVED_SLUGS = new Set(["nearby"]);

const STATUSES: readonly SessionStatus[] = ["preparing", "open", "closed"];

/** 6-2 응답. `CustomerFoodTruckDetailDto` (https://food-truck-on-backend.onrender.com/api/docs) */
type TruckDetailResponse = {
  id: number;
  name: string;
  status: SessionStatus;
  location_label: string | null;
  open_time: string | null;
  close_time: string | null;
  distance_m: number | null;
  latitude: number | null;
  longitude: number | null;
  menus: { id: number; name: string; price: number; is_sold_out: boolean }[];
};

function isTruckDetail(value: unknown): value is TruckDetailResponse {
  if (typeof value !== "object" || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.id === "number" &&
    typeof data.name === "string" &&
    STATUSES.includes(data.status as SessionStatus) &&
    Array.isArray(data.menus)
  );
}

/**
 * 백엔드 응답을 화면이 쓰는 모양으로 바꾼다. 칸 이름은 그대로고 **status 하나만 다르다.**
 *
 * 백엔드는 오늘 세션이 없는 트럭도 `closed`로 준다. 그대로 쓰면 쉬는 날에도 "오늘 영업을 마쳤어요"가 뜬다.
 * 마감은 영업 중일 때만 되고(백엔드 sessions.service `close`), 오픈하면 `open_time`이 반드시 채워진다.
 * 그래서 **`closed`인데 `open_time`이 없으면 오늘 연 적이 없는 것**으로 보고 "오늘은 쉬어요"(null)로 바꾼다.
 * 백엔드에 세션이 없을 때 구분해서 달라고 요청해 둔 상태다. 반영되면 이 추측은 지운다.
 *
 * `open_time` · `close_time`은 사장님이 정한 예정 시각이 아니라 **오픈·마감을 누른 시각**이다.
 * 영업 중에는 `close_time`이 null이라 영업시간 줄과 "마감까지 N분"은 그려지지 않는다(화면이 둘 다 있을 때만 그린다).
 */
function toSharedTruck(data: TruckDetailResponse): SharedTruck {
  const neverOpenedToday = data.status === "closed" && data.open_time === null;

  return {
    id: data.id,
    name: data.name,
    status: neverOpenedToday ? null : data.status,
    location_label: data.location_label,
    open_time: data.open_time,
    close_time: data.close_time,
    distance_m: data.distance_m,
    latitude: data.latitude,
    longitude: data.longitude,
    menus: data.menus.map(({ id, name, price, is_sold_out }) => ({
      id,
      name,
      price,
      is_sold_out,
    })),
  };
}

/**
 * 주소에서 받은 슬러그를 한 가지 모양으로 맞춘다.
 * 백엔드 슬러그에는 한글이 들어간다(`타코야끼-달인-3fa9c1`). 주소창을 거치면 `%ED%83%80…`로 올 수도,
 * 한글 그대로 올 수도 있어서 먼저 풀어 놓고, 백엔드에 보낼 때 한 번만 다시 감싼다.
 */
function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    // 깨진 %가 섞인 주소. 그대로 두면 백엔드가 없는 트럭(404)으로 답한다
    return slug.trim();
  }
}

/**
 * 6-2. GET /api/v1/customer/food-trucks/:shareSlug — 없는 슬러그면 null.
 *
 * 이 화면은 위치 권한을 묻지 않아서 `lat` · `lng`를 보내지 않는다. `distance_m`은 null로 온다.
 * 영업 상태는 하루에도 바뀌므로 캐시하지 않는다.
 *
 * @throws ApiError 서버가 답하지 않거나(시간 초과 포함) 404가 아닌 오류를 줬을 때
 */
export async function fetchSharedTruck(slug: string): Promise<SharedTruck | null> {
  if (!slug || RESERVED_SLUGS.has(slug)) return null;

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/customer/food-trucks/${encodeURIComponent(slug)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
  } catch {
    throw new ApiError("NETWORK_ERROR", "서버에 연결하지 못했어요");
  }

  if (response.status === 404) return null;

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // 명세 "공통 에러 응답"의 { error: { code, message } }
    const error = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
    throw new ApiError(
      typeof error?.code === "string" ? error.code : "INTERNAL_SERVER_ERROR",
      typeof error?.message === "string" ? error.message : "서버에 문제가 있어요",
    );
  }

  if (!isTruckDetail(body)) {
    throw new ApiError("INVALID_RESPONSE", "서버가 알 수 없는 모양으로 답했어요");
  }
  return toSharedTruck(body);
}

/**
 * 공유 링크 페이지(`/t/:slug`)가 부르는 함수. 없는 슬러그면 null.
 *
 * **실제 API와 목데이터를 슬러그로 가른다.**
 * - 목데이터에 있는 슬러그 네 개(`takoyaki-dalin` 등) → 목데이터.
 *   사장님 화면이 아직 목데이터라, 사장님 홈의 "내 가게 페이지 미리보기"와 공유 링크가 이 슬러그를 가리킨다.
 *   이것까지 실제 API로 보내면 사장님 흐름의 링크가 전부 "없는 트럭"이 된다
 * - 그 밖의 슬러그 → 실제 API. 백엔드 슬러그는 끝에 무작위 6자가 붙어 목 슬러그와 겹치지 않는다
 * - `API_BASE_URL`이 없으면 전부 목데이터다. 환경 변수를 넣기 전의 배포본도 전처럼 동작한다
 *
 * 사장님 화면을 실제 API에 붙이는 날 목데이터 갈래를 지운다.
 *
 * `cache`로 감싸서 한 요청 안에서는 한 번만 부른다.
 * 페이지 본문과 카카오톡 미리보기(generateMetadata)가 같은 데이터를 쓰기 때문이다.
 *
 * @param scenario `?mock=` 값. 목 슬러그에만 듣는다(로딩·에러·쉬어요 확인용)
 */
export const getSharedTruck = cache(
  (slug: string, scenario: MockScenario): Promise<SharedTruck | null> => {
    const key = normalizeSlug(slug);

    if (!API_BASE_URL || isMockSharedSlug(key)) {
      return getMockSharedTruck(key, scenario);
    }
    return fetchSharedTruck(key);
  },
);
