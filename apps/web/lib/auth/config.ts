// proxy와 서버 코드가 함께 쓰므로 server-only를 붙이지 않는다

export const SESSION_COOKIE = "session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MIN_SECRET_LENGTH = 32;

export interface AuthConfig {
  username: string;
  password: string;
  /** 세션 쿠키 서명 키 */
  secret: string;
}

/**
 * .env에 지정한 고정 계정.
 * 값이 하나라도 없거나 서명 키가 짧으면 null을 돌려주고, 이때는 아무도 로그인할 수 없다.
 */
export function getAuthConfig(): AuthConfig | null {
  const username = process.env.AUTH_USERNAME?.trim();
  const password = process.env.AUTH_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!username || !password || !secret || secret.length < MIN_SECRET_LENGTH) return null;
  return { username, password, secret };
}
