/**
 * 카카오톡 공유. 화면은 SDK를 직접 부르지 않고 여기만 거친다.
 *
 * 카카오맵 SDK(`window.kakao`, lib/map/kakao.ts)와는 **다른 SDK**다(`window.Kakao`, 대문자).
 * 키는 같은 앱의 JavaScript 키(NEXT_PUBLIC_KAKAO_MAP_KEY)를 쓴다.
 *
 * `sendScrap`은 공유할 페이지의 미리보기 태그(OG)를 카카오가 읽어 가서 카드를 만든다.
 * 그래서 `/t/:slug`의 미리보기(generateMetadata · opengraph-image)가 그대로 카톡 카드가 된다.
 *
 * **카카오 개발자 콘솔 > 플랫폼 > Web에 지금 주소(로컬 http://localhost:3001, 배포 주소)를 등록해야 동작한다.**
 * 등록이 안 된 주소에서는 카카오가 띄운 창에 오류가 뜬다. 이건 코드에서 알 수 없다.
 */

/** 2.8.4 (2026-10-19 배포). 올릴 때는 버전과 integrity를 같이 바꾼다 */
const SDK_URL = "https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js";
/** CDN 파일이 바꿔치기되면 브라우저가 실행을 거부한다. 공식 CDN 파일로 직접 계산한 값이다 */
const SDK_INTEGRITY =
  "sha384-BGX7Wb16GmRFagri4bLJV2DgipVZaU2AI812GZtHtHzzDQJnfHasDXN5houxv45w";

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ?? "";

/** 이 파일에서 쓰는 만큼만 적은 SDK 모양 */
type KakaoSdk = {
  init: (appKey: string) => void;
  isInitialized: () => boolean;
  Share: { sendScrap: (options: { requestUrl: string }) => void };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let loading: Promise<KakaoSdk> | null = null;

/** SDK를 한 번만 불러온다. 실패하면 다음에 다시 시도할 수 있게 비워 둔다 */
function loadSdk(): Promise<KakaoSdk> {
  if (window.Kakao) return Promise.resolve(window.Kakao);

  loading ??= new Promise<KakaoSdk>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.integrity = SDK_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () =>
      window.Kakao ? resolve(window.Kakao) : reject(new Error("카카오 SDK가 비어 있어요"));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("카카오 SDK를 불러오지 못했어요"));
    };
    document.head.append(script);
  });

  return loading;
}

/**
 * 결과
 * - "kakao"     카카오톡 공유 창을 띄웠다
 * - "system"    카카오 SDK가 안 돼서 휴대폰 기본 공유 창을 띄웠다(카카오톡도 그 안에 있다)
 * - "cancelled" 기본 공유 창에서 사용자가 닫았다. 실패가 아니다
 *
 * 둘 다 안 되면 에러를 던진다. 화면은 "링크를 복사해서 붙여 넣어 주세요"로 안내한다.
 */
export async function shareToKakao(url: string): Promise<"kakao" | "system" | "cancelled"> {
  try {
    if (!APP_KEY) throw new Error("카카오 앱 키가 없어요");
    const Kakao = await loadSdk();
    if (!Kakao.isInitialized()) Kakao.init(APP_KEY);
    Kakao.Share.sendScrap({ requestUrl: url });
    return "kakao";
  } catch (kakaoError) {
    if (typeof navigator.share !== "function") throw kakaoError;
    try {
      await navigator.share({ url });
      return "system";
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return "cancelled";
      }
      throw shareError;
    }
  }
}
