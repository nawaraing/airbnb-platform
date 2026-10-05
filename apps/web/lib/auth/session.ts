// HMAC-SHA256으로 서명한 상태 없는(stateless) 세션 토큰: base64url(payload).base64url(signature)
// Web Crypto만 써서 proxy와 서버 코드 어디서든 동작한다
import { getAuthConfig, SESSION_TTL_SECONDS } from "./config";

export interface SessionPayload {
  /** 아이디 */
  sub: string;
  /** 발급 시각(초) */
  iat: number;
  /** 만료 시각(초) */
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

const keyCache = new Map<string, Promise<CryptoKey>>();

function hmacKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
      "sign",
      "verify",
    ]);
    keyCache.set(secret, key);
  }
  return key;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function createSessionPayload(username: string, now = nowSeconds()): SessionPayload {
  return { sub: username, iat: now, exp: now + SESSION_TTL_SECONDS };
}

export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.sub === "string" && Number.isInteger(v.iat) && Number.isInteger(v.exp);
}

/** 서명이 맞고 만료되지 않은 토큰이면 payload, 아니면 null */
export async function verifySession(
  token: string | undefined,
  secret: string,
  now = nowSeconds(),
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts as [string, string];

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;
  // verify는 상수 시간 비교를 한다
  const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), signatureBytes, encoder.encode(body));
  if (!valid) return null;

  const json = fromBase64Url(body);
  if (!json) return null;
  let payload: unknown;
  try {
    payload = JSON.parse(decoder.decode(json));
  } catch {
    return null;
  }
  if (!isSessionPayload(payload) || payload.exp <= now) return null;
  return payload;
}

/**
 * 쿠키 값으로 현재 세션을 읽는다.
 * .env의 아이디가 바뀌면 기존 세션은 무효가 된다. 모든 세션을 끊으려면 AUTH_SECRET을 바꾼다.
 */
export async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  const config = getAuthConfig();
  if (!config) return null;
  const payload = await verifySession(token, config.secret);
  return payload && payload.sub === config.username ? payload : null;
}
