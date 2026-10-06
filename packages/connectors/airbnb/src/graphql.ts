// 로그인된 화면(페이지) 안에서 에어비앤비 GraphQL을 호출한다.
// 화면이 실제로 보낸 요청의 헤더(API 키, CSRF 토큰 등)를 그대로 쓰고, 쿠키는 브라우저가 붙인다.
import type { BrowserContext, Page, Request } from "playwright-core";
import { OperationRegistry, type OperationName } from "./operations";
import { AIRBNB_ORIGIN } from "./paths";

// 화면 요청에서 복사할 헤더. 값은 메모리에만 두고 기록하지 않는다.
const FORWARDED_HEADERS = [
  "accept",
  "x-airbnb-api-key",
  "x-airbnb-graphql-platform",
  "x-airbnb-graphql-platform-client",
  "x-airbnb-supports-airlock-v2",
  "x-client-version",
  "x-csrf-token",
  "x-csrf-without-token",
];

export class AirbnbApiError extends Error {
  constructor(
    readonly operation: string,
    /** unknown_hash: 해시 만료(배포), schema: 응답 형식 변경, rejected: 에어비앤비가 거부 */
    readonly kind: "unknown_hash" | "http" | "graphql" | "schema" | "rejected",
    message: string,
  ) {
    super(`[${operation}] ${message}`);
    this.name = "AirbnbApiError";
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** 사람처럼 요청 사이에 약간의 간격을 둔다 (docs/04 §4.4) */
const politePause = () => sleep(300 + Math.random() * 500);

export class GraphqlSession {
  readonly operations = new OperationRegistry();
  private headers: Record<string, string> | null = null;
  /** 우리가 보낸 요청 중에는 해시를 배우지 않는다 (만료된 해시를 캐시에 저장하지 않도록) */
  private sending = 0;

  private constructor(readonly page: Page) {
    page.on("request", (req) => void this.observe(req));
  }

  /** 새 탭을 열고 주어진 화면으로 이동한 뒤, 화면이 API를 부를 때까지 기다린다 */
  static async open(context: BrowserContext, path: string): Promise<GraphqlSession> {
    const session = new GraphqlSession(await context.newPage());
    await session.page.goto(`${AIRBNB_ORIGIN}${path}`, { waitUntil: "load", timeout: 45_000 });
    for (let i = 0; i < 100 && !session.headers; i++) await sleep(200);
    if (!session.headers) throw new Error("화면에서 API 요청을 확인하지 못했습니다. 로그인 상태를 확인하세요.");
    return session;
  }

  private async observe(req: Request) {
    if (!req.url().includes("/api/v3/")) return;
    if (this.sending === 0) this.operations.learn(req.url());
    if (this.headers) return;
    const all = await req.allHeaders();
    const picked: Record<string, string> = {};
    for (const name of FORWARDED_HEADERS) if (all[name]) picked[name] = all[name];
    if (picked["x-airbnb-api-key"]) this.headers = picked;
  }

  async query<T>(op: OperationName, variables: unknown): Promise<T> {
    const hash = this.operations.hash(op);
    const params = new URLSearchParams({
      operationName: op,
      locale: "ko",
      currency: "KRW",
      variables: JSON.stringify(variables),
      extensions: JSON.stringify({ persistedQuery: { version: 1, sha256Hash: hash } }),
    });
    return this.send<T>(op, `/api/v3/${op}/${hash}?${params}`, "GET");
  }

  async mutate<T>(op: OperationName, variables: unknown): Promise<T> {
    const hash = this.operations.hash(op);
    const params = new URLSearchParams({ operationName: op, locale: "ko", currency: "KRW" });
    const body = JSON.stringify({
      operationName: op,
      variables,
      extensions: { persistedQuery: { version: 1, sha256Hash: hash } },
    });
    return this.send<T>(op, `/api/v3/${op}/${hash}?${params}`, "POST", body);
  }

  private async send<T>(op: string, url: string, method: "GET" | "POST", body?: string): Promise<T> {
    if (!this.headers) throw new Error("API 헤더가 준비되지 않았습니다.");
    await politePause();
    const headers = { ...this.headers, ...(body ? { "content-type": "application/json" } : {}) };
    this.sending += 1;
    let res: { status: number; text: string };
    try {
      res = await this.page.evaluate(
        async ({ url, method, headers, body }) => {
          const r = await fetch(url, { method, headers, body, credentials: "include" });
          return { status: r.status, text: await r.text() };
        },
        { url, method, headers, body },
      );
    } finally {
      this.sending -= 1;
    }

    // GraphQL 표준 오류({errors})와 에어비앤비 고유 오류({error_type, error_message}) 둘 다 온다.
    // 해시 만료: HTTP 400 {"error_type":"persisted_query_not_found","error_message":"PersistedQueryNotFound"}
    let json: { data?: unknown; errors?: { message?: string }[]; error_type?: string; error_message?: string };
    try {
      json = JSON.parse(res.text);
    } catch {
      throw new AirbnbApiError(op, "http", `HTTP ${res.status}, JSON이 아닌 응답`);
    }
    const message = [json.error_type, json.error_message, ...(json.errors?.map((e) => e.message ?? "") ?? [])]
      .filter(Boolean)
      .join("; ");
    if (/persisted_?query_?not_?found/i.test(message)) throw new AirbnbApiError(op, "unknown_hash", message);
    if (res.status >= 400) throw new AirbnbApiError(op, "http", `HTTP ${res.status} ${message}`);
    if (json.errors?.length && !json.data) throw new AirbnbApiError(op, "graphql", message);
    return json.data as T;
  }

  async close() {
    await this.page.close();
  }
}
