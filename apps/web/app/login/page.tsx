import type { Metadata } from "next";
import { BrandMark } from "@/components/app-shell/brand-mark";
import { safeNextPath } from "@/lib/auth/redirect";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandMark className="size-12 rounded-2xl text-lg shadow-lg shadow-primary/25" />
          <p className="mt-4 text-2xl font-bold tracking-tight">{APP_NAME}</p>
          <p className="mt-1 text-sm text-muted-foreground">숙소 운영 현황을 한눈에</p>
        </div>

        <section aria-labelledby="login-title" className="rounded-2xl border bg-card p-6 shadow-xs sm:p-8">
          <h1 id="login-title" className="text-lg font-semibold">
            로그인
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">관리자 계정으로 로그인하세요.</p>
          <LoginForm next={safeNextPath(Array.isArray(next) ? next[0] : next)} />
        </section>
      </div>
    </main>
  );
}
