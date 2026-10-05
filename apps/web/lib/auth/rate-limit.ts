/**
 * 로그인 실패 횟수 제한. 서버 프로세스 메모리에 저장하므로 서버 인스턴스마다 따로 센다.
 * 잠긴 동안에는 맞는 비밀번호도 거부해야 무차별 대입이 이어지지 않는다.
 */
export function createLoginLimiter({ maxFailures, windowMs }: { maxFailures: number; windowMs: number }) {
  const failures = new Map<string, { count: number; resetAt: number }>();

  function current(key: string, now: number) {
    const entry = failures.get(key);
    if (entry && entry.resetAt <= now) {
      failures.delete(key);
      return undefined;
    }
    return entry;
  }

  return {
    check(key: string, now = Date.now()): { locked: boolean; retryAfterMs: number } {
      const entry = current(key, now);
      if (entry && entry.count >= maxFailures) return { locked: true, retryAfterMs: entry.resetAt - now };
      return { locked: false, retryAfterMs: 0 };
    },
    fail(key: string, now = Date.now()) {
      const entry = current(key, now);
      if (entry) entry.count += 1;
      else failures.set(key, { count: 1, resetAt: now + windowMs });
      // 오래된 항목이 쌓이지 않게 가끔 정리
      if (failures.size > 1000) {
        for (const [k, v] of failures) if (v.resetAt <= now) failures.delete(k);
      }
    },
    reset(key: string) {
      failures.delete(key);
    },
  };
}
