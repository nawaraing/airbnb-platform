// 로그인된 전용 Chrome으로 호스트 화면들을 열고, 화면이 받는 JSON 응답을 기록한다.
// 커넥터 연산별 내부 요청을 찾기 위한 M0 분석 도구. 기록은 .airbnb-session/captures/ (git 제외)
// 실행: npm run airbnb:probe [-- 화면키...]
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Response } from "playwright-core";
import { connect, ensureChrome } from "../src/browser";
import { AIRBNB_ORIGIN, CAPTURES_DIR } from "../src/paths";
import { currentUser } from "../src/session";

const PAGES: Record<string, string> = {
  today: "/hosting",
  "reservations-upcoming": "/hosting/reservations/upcoming",
  "reservations-completed": "/hosting/reservations/completed",
  "reservations-all": "/hosting/reservations/all",
  listings: "/hosting/listings",
  calendar: "/multicalendar",
  inbox: "/hosting/messages",
  earnings: "/hosting/earnings",
  transactions: "/users/transaction_history",
};

// 분석에 필요 없는 로깅·추적 요청
const NOISE = /\/(tracking|logging|jitney|marketing_event_tracking|client_error|messaging\/syncs|pdp_listing_booking_details\/telemetry)|\/api\/v2\/(logs|track)/i;
const SETTLE_MS = 7_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requested = process.argv.slice(2);
// "/"로 시작하는 인자는 임의 경로로 취급한다 (예: /multicalendar/123)
for (const arg of requested) {
  if (arg.startsWith("/")) PAGES[arg.replace(/^\/+/, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60)] = arg;
}
const targets = requested.length
  ? requested.map((arg) => (arg.startsWith("/") ? arg.replace(/^\/+/, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 60) : arg))
  : Object.keys(PAGES);
const unknown = targets.filter((k) => !PAGES[k]);
if (unknown.length) {
  console.error(`알 수 없는 화면: ${unknown.join(", ")} (가능: ${Object.keys(PAGES).join(", ")})`);
  process.exit(1);
}

await ensureChrome(`${AIRBNB_ORIGIN}/hosting`);
const { context } = await connect();
if (!(await currentUser(context))) {
  console.error("로그인되어 있지 않습니다. 먼저 npm run airbnb:login 을 실행하세요.");
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
const runDir = path.join(CAPTURES_DIR, stamp);
const index: { page: string; file: string; method: string; status: number; url: string; operation: string; bytes: number }[] = [];

function operationName(url: URL): string {
  const v3 = /\/api\/v3\/([^/]+)/.exec(url.pathname);
  if (v3?.[1]) return v3[1];
  return url.pathname.replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 80) || "root";
}

for (const key of targets) {
  const dir = path.join(runDir, key);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const page = await context.newPage();
  let seq = 0;
  const pending: Promise<void>[] = [];

  const onResponse = (res: Response) => {
    const url = new URL(res.url());
    if (!url.hostname.endsWith("airbnb.co.kr") && !url.hostname.endsWith("airbnb.com")) return;
    if (NOISE.test(url.pathname)) return;
    if (!(res.headers()["content-type"] ?? "").includes("json")) return;
    pending.push(
      (async () => {
        let body: unknown;
        try {
          const text = await res.text();
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        } catch {
          return; // 리다이렉트 등 본문 없음
        }
        const req = res.request();
        const operation = operationName(url);
        const file = `${String(++seq).padStart(3, "0")}-${operation}.json`;
        const record = {
          method: req.method(),
          status: res.status(),
          url: res.url(),
          // 요청 헤더(쿠키 포함)는 저장하지 않는다
          postData: req.postData() ? safeJson(req.postData()!) : null,
          body,
        };
        const json = JSON.stringify(record, null, 2);
        writeFileSync(path.join(dir, file), json, { mode: 0o600 });
        index.push({ page: key, file: `${key}/${file}`, method: req.method(), status: res.status(), url: res.url(), operation, bytes: json.length });
      })(),
    );
  };

  page.on("response", onResponse);
  console.log(`▶ ${key} ${PAGES[key]}`);
  try {
    await page.goto(`${AIRBNB_ORIGIN}${PAGES[key]}`, { waitUntil: "load", timeout: 45_000 });
  } catch (e) {
    console.log(`  이동 실패: ${(e as Error).message.split("\n")[0]}`);
  }
  await sleep(SETTLE_MS);
  // 목록이 스크롤로 더 불러오는 화면을 위해 한 번 끝까지 내려 본다
  await page.mouse.wheel(0, 20_000).catch(() => {});
  await sleep(2_000);
  await Promise.allSettled(pending);
  await page.screenshot({ path: path.join(dir, "_screen.png"), fullPage: true }).catch(() => {});
  console.log(`  최종 URL: ${page.url().replace(AIRBNB_ORIGIN, "")} · JSON 응답 ${seq}개`);
  page.off("response", onResponse);
  await page.close();
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

writeFileSync(path.join(runDir, "_index.json"), JSON.stringify(index, null, 2), { mode: 0o600 });
console.log(`\n기록 위치: ${runDir}`);
process.exit(0);
