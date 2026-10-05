import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthConfig } from "./config";

const digest = (value: string) => createHash("sha256").update(value).digest();

/** 길이와 내용으로 시간 차이가 생기지 않게 해시 후 상수 시간 비교한다 */
export function credentialsMatch(config: AuthConfig, username: string, password: string): boolean {
  const usernameOk = timingSafeEqual(digest(username), digest(config.username));
  const passwordOk = timingSafeEqual(digest(password), digest(config.password));
  return usernameOk && passwordOk;
}
