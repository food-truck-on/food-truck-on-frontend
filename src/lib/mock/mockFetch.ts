/**
 * 가짜 서버 호출. 실제 API가 오기 전까지 화면은 이 함수를 거쳐 데이터를 받는다.
 *
 * 진짜 fetch처럼 (1) 시간이 걸리고 (2) 실패할 수 있다.
 * 그래야 로딩 · 에러 · 빈 상태 화면을 지금 만들어 볼 수 있다.
 *
 * 브라우저 주소 끝에 ?mock=… 을 붙이면 상황을 바꿔 볼 수 있다.
 *   /owner/menu?mock=slow    3초 걸린다       → 스켈레톤 확인
 *   /owner/menu?mock=error   서버 오류가 난다 → 에러 화면 확인
 *   /owner/menu?mock=empty   빈 데이터가 온다 → 빈 상태 확인
 */

export type MockScenario = "normal" | "slow" | "error" | "empty";

/**
 * API가 실패했을 때 던지는 에러.
 * 명세서 "공통 에러 응답"의 { error: { code, message } } 모양을 따른다.
 */
export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function currentScenario(): MockScenario {
  // 서버에서 실행될 때는 주소창이 없다
  if (typeof window === "undefined") return "normal";

  const value = new URLSearchParams(window.location.search).get("mock");
  if (value === "slow" || value === "error" || value === "empty") return value;
  return "normal";
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * @param data      평소에 돌려줄 목데이터
 * @param emptyData ?mock=empty 일 때 돌려줄 값. 생략하면 data를 그대로 준다
 */
export async function mockFetch<T>(data: T, emptyData: T = data): Promise<T> {
  const scenario = currentScenario();

  // 진짜 네트워크도 0초가 아니다. 짧게라도 기다려야 로딩 처리를 빼먹은 게 드러난다
  await sleep(scenario === "slow" ? 3000 : 400);

  if (scenario === "error") {
    throw new ApiError("INTERNAL_SERVER_ERROR", "서버에 연결하지 못했어요");
  }

  // 화면이 받은 값을 고쳐도 목데이터 원본은 안 바뀌게 복사본을 준다
  return structuredClone(scenario === "empty" ? emptyData : data);
}
