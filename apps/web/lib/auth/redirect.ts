export const AFTER_LOGIN_PATH = "/dashboard";
export const LOGIN_PATH = "/login";

const ORIGIN = "http://internal.invalid";

/**
 * 로그인 후 돌아갈 경로. 같은 사이트의 내부 경로만 허용한다(오픈 리다이렉트 방지).
 * `//evil.com`, `/\evil.com`, 탭·줄바꿈이 섞인 경로처럼 브라우저가 외부 주소로 해석하는 값은 기본 경로로 바꾼다.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return AFTER_LOGIN_PATH;
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return AFTER_LOGIN_PATH;
  }
  if (url.origin !== ORIGIN || url.pathname === LOGIN_PATH || url.pathname.startsWith(`${LOGIN_PATH}/`)) {
    return AFTER_LOGIN_PATH;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
