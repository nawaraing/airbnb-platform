"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, type LoginState } from "@/lib/auth/actions";

const initialState: LoginState = { error: null, username: "" };

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const invalid = state.error !== null;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="next" value={next} />

      <div className="space-y-2">
        <Label htmlFor="username">아이디</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
          defaultValue={state.username}
          aria-invalid={invalid}
          className="h-11 rounded-xl px-3.5 text-[15px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={invalid}
            aria-describedby={invalid ? "login-error" : undefined}
            className="h-11 rounded-xl px-3.5 pr-11 text-[15px]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {showPassword ? <EyeOff className="size-[18px]" aria-hidden /> : <Eye className="size-[18px]" aria-hidden />}
          </button>
        </div>
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-200 ring-inset"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-11 w-full rounded-xl text-[15px] font-semibold shadow-sm shadow-primary/25">
        {pending && <Loader2 className="size-[18px] animate-spin" aria-hidden />}
        {pending ? "확인 중" : "로그인"}
      </Button>
    </form>
  );
}
