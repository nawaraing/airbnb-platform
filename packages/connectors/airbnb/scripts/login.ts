// 전용 Chrome 창을 띄우고, 사람이 에어비앤비에 로그인할 때까지 기다린 뒤 세션을 저장한다.
// 실행: npm run airbnb:login
import { connect, ensureChrome } from "../src/browser";
import { AIRBNB_ORIGIN, STORAGE_STATE_PATH } from "../src/paths";
import { airbnbCookieNames, currentUser, saveAirbnbStorageState } from "../src/session";

const TIMEOUT_MS = 15 * 60_000;
const POLL_MS = 3_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (msg: string) => console.log(`${new Date().toLocaleTimeString("ko-KR", { hour12: false })} ${msg}`);

const { launched } = await ensureChrome(`${AIRBNB_ORIGIN}/login`);
const { context } = await connect();
log(launched ? "전용 Chrome 창을 열었습니다." : "이미 열려 있는 전용 Chrome에 연결했습니다.");

let user = await currentUser(context);
if (!user) {
  log("🔑 열린 Chrome 창에서 에어비앤비에 로그인하세요 (Google 로그인 가능). 최대 15분 기다립니다.");
  let lastNames = "";
  const deadline = Date.now() + TIMEOUT_MS;
  while (!user && Date.now() < deadline) {
    await sleep(POLL_MS);
    user = await currentUser(context);
    // 판별 기준을 확정하기 위해 쿠키 '이름'만 기록한다 (값은 출력하지 않음)
    const names = (await airbnbCookieNames(context)).join(", ");
    if (names !== lastNames) {
      log(`에어비앤비 쿠키: ${names || "(없음)"}`);
      lastNames = names;
    }
  }
}

if (!user) {
  log("⏰ 시간 안에 로그인을 확인하지 못했습니다. 다시 실행하세요.");
  process.exit(1);
}

log(`✅ 로그인 확인 — 사용자 ID ${user.id}${user.name ? ` (${user.name})` : ""}`);
const count = await saveAirbnbStorageState(context);
log(`세션 저장 — 에어비앤비 쿠키 ${count}개 → ${STORAGE_STATE_PATH}`);
log("Chrome 창은 그대로 두세요. 다음 단계(probe)에서 이 창을 다시 씁니다.");
process.exit(0);
