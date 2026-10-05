import { describe, expect, it } from "vitest";
import { createLoginLimiter } from "./rate-limit";

describe("createLoginLimiter", () => {
  const WINDOW = 15 * 60_000;

  it("허용 횟수만큼 실패하면 잠그고, 기간이 지나면 풀린다", () => {
    const limiter = createLoginLimiter({ maxFailures: 3, windowMs: WINDOW });
    const t0 = 1_000_000;
    for (let i = 0; i < 2; i++) limiter.fail("ip", t0);
    expect(limiter.check("ip", t0).locked).toBe(false);

    limiter.fail("ip", t0);
    expect(limiter.check("ip", t0 + 1000)).toEqual({ locked: true, retryAfterMs: WINDOW - 1000 });
    expect(limiter.check("ip", t0 + WINDOW).locked).toBe(false);
  });

  it("키마다 따로 세고, 성공하면 초기화한다", () => {
    const limiter = createLoginLimiter({ maxFailures: 1, windowMs: WINDOW });
    limiter.fail("a");
    expect(limiter.check("a").locked).toBe(true);
    expect(limiter.check("b").locked).toBe(false);
    limiter.reset("a");
    expect(limiter.check("a").locked).toBe(false);
  });
});
