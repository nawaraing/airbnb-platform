import { describe, expect, it } from "vitest";
import { addDays, diffDays, monthRange, previousMonth, todayIn, weekdayOf } from "./dates";

describe("dates", () => {
  it("월말·연말을 넘어 날짜를 더한다", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("두 날짜의 일수 차이를 구한다", () => {
    expect(diffDays("2026-10-11", "2026-10-06")).toBe(5);
    expect(diffDays("2026-10-06", "2026-10-11")).toBe(-5);
  });

  it("월 범위는 첫날 포함, 다음 달 첫날 제외", () => {
    expect(monthRange("2026-12")).toEqual({ start: "2026-12-01", next: "2027-01-01" });
  });

  it("이전 달을 구한다", () => {
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(previousMonth("2026-10")).toBe("2026-09");
  });

  it("요일을 구한다", () => {
    expect(weekdayOf("2026-10-05")).toBe(1); // 월
  });

  it("시간대 기준 오늘 날짜를 구한다", () => {
    // UTC 2026-10-04 15:30 = 서울 2026-10-05 00:30
    const now = new Date("2026-10-04T15:30:00Z");
    expect(todayIn("Asia/Seoul", now)).toBe("2026-10-05");
    expect(todayIn("UTC", now)).toBe("2026-10-04");
  });

  it("잘못된 형식은 거부한다", () => {
    expect(() => addDays("2026/10/05", 1)).toThrow();
    expect(() => monthRange("2026-1")).toThrow();
  });
});
