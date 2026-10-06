import type { Metadata } from "next";
import { BrandMark } from "@/components/app-shell/brand-mark";
import { safeNextPath } from "@/lib/auth/redirect";
import { APP_NAME } from "@/lib/config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인" };

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* 넓은 화면 왼쪽 브랜드 패널 */}
      <div className="relative hidden flex-col overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span translate="no" className="text-[15px] font-semibold tracking-tight">
            {APP_NAME}
          </span>
        </div>
        <p className="relative mt-[18vh] max-w-sm text-[34px] leading-tight font-semibold tracking-tight text-balance">
          숙소 운영 현황을 한눈에
        </p>
        {/* 브랜드 마크의 해를 크게 키운 장식: 바닥선에 걸친 해와 동심원 */}
        <svg
          viewBox="0 0 480 200"
          preserveAspectRatio="xMidYMax meet"
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 w-full text-sidebar-primary"
        >
          <circle cx="240" cy="200" r="72" fill="currentColor" fillOpacity="0.9" />
          <g fill="none" stroke="currentColor" strokeOpacity="0.28" vectorEffect="non-scaling-stroke">
            <circle cx="240" cy="200" r="112" vectorEffect="non-scaling-stroke" />
            <circle cx="240" cy="200" r="152" vectorEffect="non-scaling-stroke" />
            <circle cx="240" cy="200" r="192" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
      </div>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="size-10" />
            <span translate="no" className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </div>

          <section aria-labelledby="login-title">
            <h1 id="login-title" className="text-2xl font-semibold tracking-tight">
              로그인
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">관리자 계정으로 로그인하세요.</p>
            <LoginForm next={safeNextPath(Array.isArray(next) ? next[0] : next)} />
          </section>
        </div>
      </main>
    </div>
  );
}
