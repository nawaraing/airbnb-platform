import { describe, expect, it } from "vitest";
import { AFTER_LOGIN_PATH, safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it("내부 경로는 쿼리와 함께 유지한다", () => {
    expect(safeNextPath("/dashboard?unit=unit-dmc&basis=stay")).toBe("/dashboard?unit=unit-dmc&basis=stay");
    expect(safeNextPath("/calendar")).toBe("/calendar");
  });

  it("외부로 나가는 값은 기본 경로로 바꾼다", () => {
    for (const value of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "javascript:alert(1)",
      "dashboard",
    ]) {
      expect(safeNextPath(value)).toBe(AFTER_LOGIN_PATH);
    }
  });

  it("로그인 페이지로 되돌아가지 않는다", () => {
    expect(safeNextPath("/login")).toBe(AFTER_LOGIN_PATH);
    expect(safeNextPath("/login?next=/dashboard")).toBe(AFTER_LOGIN_PATH);
  });

  it("문자열이 아니면 기본 경로", () => {
    expect(safeNextPath(undefined)).toBe(AFTER_LOGIN_PATH);
    expect(safeNextPath(null)).toBe(AFTER_LOGIN_PATH);
  });
});
