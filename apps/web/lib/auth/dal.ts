import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESSION_COOKIE } from "./config";
import { LOGIN_PATH } from "./redirect";
import { readSession } from "./session";

export interface Viewer {
  username: string;
}

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return session ? { username: session.sub } : null;
});

/**
 * 데이터를 읽는 곳에서 세션을 다시 확인한다. proxy는 1차 확인일 뿐이므로 이 함수가 실제 방어선이다.
 * (node_modules/next/dist/docs/01-app/02-guides/authentication.md — Data Access Layer)
 */
export const requireViewer = cache(async (): Promise<Viewer> => {
  const viewer = await getViewer();
  if (!viewer) redirect(LOGIN_PATH);
  return viewer;
});
