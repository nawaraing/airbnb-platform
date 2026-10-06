"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null, username: "" };
const FIELD = "h-11 rounded-md bg-card px-3.5 text-[15px] md:text-[15px]";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const invalid = state.error !== null;

  // 자동 포커스는 마우스·트랙패드 환경에서만 (모바일에서 키보드가 바로 뜨지 않게).
  // 하이드레이션 전에 사용자가 이미 다른 칸을 눌렀다면 빼앗지 않는다
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (document.activeElement && document.activeElement !== document.body) return;
    usernameRef.current?.focus();
  }, []);

  // 실패하면 비밀번호 칸으로 돌아가 바로 다시 입력할 수 있게
  useEffect(() => {
    if (state.error) passwordRef.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="username">아이디</Label>
        <Input
          ref={usernameRef}
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.username}
          aria-invalid={invalid}
          aria-describedby={invalid ? "login-error" : undefined}
          className={FIELD}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={invalid}
            aria-describedby={invalid ? "login-error" : undefined}
            className={`${FIELD} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
          </button>
        </div>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-md text-[15px] font-semibold disabled:opacity-70">
        {pending && <Loader2 className="size-4.5 motion-safe:animate-spin" aria-hidden />}
        {pending ? "확인 중…" : "로그인"}
      </Button>
    </form>
  );
}
