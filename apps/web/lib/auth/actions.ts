"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, SESSION_COOKIE, SESSION_TTL_SECONDS } from "./config";
import { credentialsMatch } from "./credentials";
import { createLoginLimiter } from "./rate-limit";
import { LOGIN_PATH, safeNextPath } from "./redirect";
import { createSessionPayload, signSession } from "./session";

export interface LoginState {
  error: string | null;
  /** 실패해도 아이디는 다시 채워 둔다 */
  username: string;
}

const limiter = createLoginLimiter({ maxFailures: 5, windowMs: 15 * 60_000 });
const FAILURE_DELAY_MS = 600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!username || !password) return { error: "아이디와 비밀번호를 입력해 주세요.", username };

  const config = getAuthConfig();
  if (!config) {
    return { error: "로그인 설정이 없습니다. 서버의 .env(AUTH_USERNAME, AUTH_PASSWORD, AUTH_SECRET)를 확인해 주세요.", username };
  }

  const key = await clientKey();
  const lock = limiter.check(key);
  if (lock.locked) {
    const minutes = Math.max(1, Math.ceil(lock.retryAfterMs / 60_000));
    return { error: `로그인 시도가 너무 많습니다. ${minutes}분 후 다시 시도해 주세요.`, username };
  }

  if (!credentialsMatch(config, username, password)) {
    limiter.fail(key);
    await sleep(FAILURE_DELAY_MS);
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다.", username };
  }

  limiter.reset(key);
  const token = await signSession(createSessionPayload(config.username), config.secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(next);
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect(LOGIN_PATH);
}
