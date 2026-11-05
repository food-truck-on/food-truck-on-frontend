/**
 * 미리보기 이미지에 쓸 주아체를 **이미지에 들어갈 글자만** 잘라 받는다.
 *
 * 주아체 전체 파일은 한글 때문에 MB 단위라 next/og 용량 제한(500KB)을 넘는다.
 * 구글 폰트는 `text=`에 글자를 넘기면 그 글자만 담은 TTF를 준다. 수십 KB로 끝난다.
 *
 * 받아 오지 못하면 null. 그때 next/og는 한글을 기본 고딕으로 그린다 — 미리보기가 안 뜨는 것보다 낫다.
 */
export async function loadJuaSubset(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Jua&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!fontUrl) return null;

    const font = await fetch(fontUrl);
    return font.ok ? await font.arrayBuffer() : null;
  } catch {
    return null;
  }
}
