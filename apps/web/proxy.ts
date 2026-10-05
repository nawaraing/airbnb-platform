import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { AFTER_LOGIN_PATH, LOGIN_PATH } from "@/lib/auth/redirect";
import { readSession } from "@/lib/auth/session";

/**
 * 1차 확인: 로그인하지 않았으면 로그인 페이지로, 로그인했는데 로그인 페이지에 오면 대시보드로 보낸다.
 * 데이터 접근 시 세션 재확인은 lib/auth/dal.ts가 맡는다.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const onLoginPage = pathname === LOGIN_PATH;

  if (!session && !onLoginPage) {
    const url = new URL(LOGIN_PATH, request.url);
    if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && onLoginPage) {
    return NextResponse.redirect(new URL(AFTER_LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일·이미지 최적화·메타 파일만 제외하고 모든 경로를 검사한다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
