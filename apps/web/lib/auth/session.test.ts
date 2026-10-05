import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionPayload, readSession, signSession, verifySession } from "./session";

const SECRET = "test-secret-0123456789-abcdefghijklmnop";
const NOW = 1_800_000_000;

describe("verifySession", () => {
  it("서명한 토큰을 그대로 검증한다", async () => {
    const payload = createSessionPayload("admin", NOW);
    const token = await signSession(payload, SECRET);
    expect(await verifySession(token, SECRET, NOW + 60)).toEqual(payload);
  });

  it("만료된 토큰은 거부한다", async () => {
    const payload = createSessionPayload("admin", NOW);
    const token = await signSession(payload, SECRET);
    expect(await verifySession(token, SECRET, payload.exp)).toBeNull();
  });

  it("다른 키로 서명한 토큰은 거부한다", async () => {
    const token = await signSession(createSessionPayload("admin", NOW), "another-secret-0123456789-abcdefghijkl");
    expect(await verifySession(token, SECRET, NOW)).toBeNull();
  });

  it("내용을 바꾼 토큰은 거부한다", async () => {
    const token = await signSession(createSessionPayload("guest", NOW), SECRET);
    const [, signature] = token.split(".");
    const forgedBody = Buffer.from(JSON.stringify({ sub: "admin", iat: NOW, exp: NOW + 999_999 })).toString("base64url");
    expect(await verifySession(`${forgedBody}.${signature}`, SECRET, NOW)).toBeNull();
  });

  it("형식이 잘못된 값은 거부한다", async () => {
    for (const token of [undefined, "", "abc", "a.b.c", "!!!.???", "e30.e30"]) {
      expect(await verifySession(token, SECRET, NOW)).toBeNull();
    }
  });
});

describe("readSession", () => {
  const original = { ...process.env };

  beforeEach(() => {
    process.env.AUTH_USERNAME = "admin";
    process.env.AUTH_PASSWORD = "pw";
    process.env.AUTH_SECRET = SECRET;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("현재 .env 아이디의 세션만 인정한다", async () => {
    const token = await signSession(createSessionPayload("admin"), SECRET);
    expect((await readSession(token))?.sub).toBe("admin");

    process.env.AUTH_USERNAME = "someone-else";
    expect(await readSession(token)).toBeNull();
  });

  it("서명 키가 없거나 짧으면 아무 세션도 인정하지 않는다", async () => {
    const token = await signSession(createSessionPayload("admin"), SECRET);
    process.env.AUTH_SECRET = "short";
    expect(await readSession(token)).toBeNull();
    delete process.env.AUTH_SECRET;
    expect(await readSession(token)).toBeNull();
  });
});
