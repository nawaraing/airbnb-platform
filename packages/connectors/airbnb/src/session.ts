import { writeFileSync } from "node:fs";
import type { BrowserContext } from "playwright-core";
import { AIRBNB_ORIGIN, STORAGE_STATE_PATH } from "./paths";

export interface AirbnbUser {
  id: string;
  name: string | null;
}

/**
 * 로그인 여부 판별. 로그인하면 `_user_attributes` 쿠키(URL 인코딩된 JSON)에 사용자 id가 들어간다고 보고 시작한다.
 * M0에서 실제 쿠키를 보고 확정한다 (NOTES.md).
 */
export async function currentUser(context: BrowserContext): Promise<AirbnbUser | null> {
  const cookies = await context.cookies(AIRBNB_ORIGIN);
  const attrs = cookies.find((c) => c.name === "_user_attributes");
  if (!attrs) return null;
  try {
    const value = JSON.parse(decodeURIComponent(attrs.value)) as Record<string, unknown>;
    if (value.id === undefined || value.id === null) return null;
    return { id: String(value.id), name: typeof value.name === "string" ? value.name : null };
  } catch {
    return null;
  }
}

export async function airbnbCookieNames(context: BrowserContext): Promise<string[]> {
  return (await context.cookies(AIRBNB_ORIGIN)).map((c) => c.name).sort();
}

/** 에어비앤비 도메인 쿠키만 파일로 저장한다 (Google 등 다른 사이트 쿠키는 저장하지 않음) */
export async function saveAirbnbStorageState(context: BrowserContext): Promise<number> {
  const state = await context.storageState();
  const isAirbnb = (domainOrOrigin: string) => /(^|\.)airbnb\.[a-z.]+$/.test(domainOrOrigin.replace(/^https?:\/\//, "").replace(/^\./, ""));
  const filtered = {
    cookies: state.cookies.filter((c) => isAirbnb(c.domain)),
    origins: state.origins.filter((o) => isAirbnb(o.origin)),
  };
  writeFileSync(STORAGE_STATE_PATH, JSON.stringify(filtered, null, 2), { mode: 0o600 });
  return filtered.cookies.length;
}
