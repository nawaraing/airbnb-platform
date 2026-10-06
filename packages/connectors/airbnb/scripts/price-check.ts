// 요금 쓰기 계약 테스트: 조회 → 변경 → 재조회 확인 → 원복 → 재조회 확인, 비슷한 숙소 가격 조회.
// 테스트 숙소에서만 실행한다. 실패하면 종료 코드 1 (카나리로 쓸 수 있게).
// 실행: npm run airbnb:price-check -- <숙소ID> [--stale-hash]
//   --stale-hash  요금 변경 해시를 일부러 틀리게 해 화면 조작으로 해시를 다시 배우는 경로를 검증
import { addDays, todayIn } from "@repo/core";
import { AirbnbCalendar, type PriceWriteResult } from "../src/calendar";
import { connect, ensureChrome } from "../src/browser";
import { AIRBNB_ORIGIN } from "../src/paths";
import { currentUser } from "../src/session";

const args = process.argv.slice(2);
const listingId = args.find((a) => /^\d+$/.test(a)) ?? process.env.AIRBNB_TEST_LISTING_ID;
const staleHash = args.includes("--stale-hash");
if (!listingId) {
  console.error("사용법: npm run airbnb:price-check -- <숙소ID> [--stale-hash]");
  process.exit(1);
}

const won = (n: number | null) => (n === null ? "—" : `₩${n.toLocaleString("ko-KR")}`);
const report = (label: string, results: PriceWriteResult[]) => {
  for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.date} 요청 ${won(r.requested)} → 실제 ${won(r.actual)}`);
  const ok = results.every((r) => r.ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  return ok;
};

await ensureChrome(`${AIRBNB_ORIGIN}/hosting`);
const { context } = await connect();
if (!(await currentUser(context))) {
  console.error("로그인되어 있지 않습니다. 먼저 npm run airbnb:login 을 실행하세요.");
  process.exit(1);
}

const calendar = await AirbnbCalendar.open(context, listingId);
let passed = true;
try {
  // 6주 뒤 연속 2박 (지난 날짜·당일 인하와 겹치지 않게)
  const d1 = addDays(todayIn("Asia/Seoul"), 43);
  const d2 = addDays(d1, 1);

  const before = await calendar.getCalendar(d1, d2);
  console.log("조회:");
  for (const d of before) console.log(`  ${d.date} 1박 ${won(d.nightlyPrice)} (게스트 표시 ${won(d.displayedPrice)}) 예약가능 ${d.available} 예약됨 ${d.reserved}`);
  if (before.length !== 2 || before.some((d) => d.nightlyPrice === null || d.reserved)) {
    throw new Error("테스트할 날짜의 요금을 읽지 못했거나 예약이 있습니다");
  }

  const target = Math.max(...before.map((d) => d.nightlyPrice!)) + 1_000;
  if (staleHash) {
    calendar.session.operations.override("EditPanelPricingSettingsMutation", "0".repeat(64));
    console.log("(요금 변경 해시를 일부러 틀리게 설정)");
  }
  console.log(`변경: ${d1}~${d2} → ${won(target)}`);
  passed = report("변경 반영", await calendar.setPrices([{ from: d1, to: d2, price: target }])) && passed;

  console.log("원복:");
  passed = report("원복 반영", await calendar.setPrices(before.map((d) => ({ from: d.date, to: d.date, price: d.nightlyPrice! })))) && passed;

  const [market] = await calendar.getMarketPrices([d1]);
  console.log(`비슷한 숙소 ${d1}: 예약된 숙소 ${won(market?.bookedLow ?? null)}~${won(market?.bookedHigh ?? null)}, 예약 가능 숙소 ${won(market?.availableLow ?? null)}~${won(market?.availableHigh ?? null)}`);
  if (!market || market.bookedHigh === null) {
    console.log("FAIL 비슷한 숙소 가격");
    passed = false;
  } else {
    console.log("PASS 비슷한 숙소 가격");
  }
} catch (e) {
  passed = false;
  console.error(`FAIL ${(e as Error).message}`);
} finally {
  await calendar.close();
}

process.exit(passed ? 0 : 1);
