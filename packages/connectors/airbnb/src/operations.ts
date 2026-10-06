// GraphQL persisted query 해시 목록.
// 기본값은 2026-10-06 확인값. 화면이 다른 해시로 요청하면 그 값을 배우고 로컬 캐시에 저장해 다음부터 쓴다.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SESSION_DIR } from "./paths";

export type OperationName = "getDLSHostCalendar" | "EditPanelQuery" | "EditPanelPricingSettingsMutation";

const DEFAULT_HASHES: Record<OperationName, string> = {
  getDLSHostCalendar: "5b153a16f8f392d6d4c6b5ee6259cf7f89ef972e0f79bf3f87753136af9a338c",
  EditPanelQuery: "b8a9c042676f94e7fb2d43d1d5dea72aef001da200953be0f1d1ea872d67b398",
  EditPanelPricingSettingsMutation: "e27fed4f08dd4ab4c0267c5d6c0a7e4920730deadf48f92feba9b0d08befafa4",
};

const CACHE_PATH = path.join(SESSION_DIR, "operations.json");
const OPERATION_PATH = /\/api\/v3\/([^/]+)\/([a-f0-9]{64})/;

export class OperationRegistry {
  private hashes: Record<string, string>;

  constructor() {
    let cached: Record<string, string> = {};
    if (existsSync(CACHE_PATH)) {
      try {
        cached = JSON.parse(readFileSync(CACHE_PATH, "utf8")) as Record<string, string>;
      } catch {
        cached = {};
      }
    }
    this.hashes = { ...DEFAULT_HASHES, ...cached };
  }

  hash(op: OperationName): string {
    return this.hashes[op] ?? DEFAULT_HASHES[op];
  }

  /** 테스트용: 해시를 강제로 바꾼다 */
  override(op: OperationName, hash: string) {
    this.hashes[op] = hash;
  }

  /** 화면이 보낸 요청 URL에서 해시를 배운다. 바뀐 값이면 true */
  learn(url: string): boolean {
    const m = OPERATION_PATH.exec(new URL(url).pathname);
    if (!m) return false;
    const [, op, hash] = m as unknown as [string, string, string];
    if (this.hashes[op] === hash) return false;
    this.hashes[op] = hash;
    try {
      writeFileSync(CACHE_PATH, JSON.stringify(this.hashes, null, 2), { mode: 0o600 });
    } catch {
      // 캐시 저장 실패는 무시 (다음 실행에서 다시 배운다)
    }
    return true;
  }
}
