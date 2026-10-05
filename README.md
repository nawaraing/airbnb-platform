# airbnb-platform

에어비앤비 호스트 운영 자동화 플랫폼 (서비스명 미정). 설계는 [docs/](docs/README.md)에 있습니다.

## 구성

```
apps/web        Next.js 16 (App Router) 웹 앱
packages/core   순수 도메인 로직 (KPI 집계, 날짜 계산) + 단위 테스트
docs/           설계 문서
```

## 실행

```bash
npm install
cp apps/web/.env.example apps/web/.env   # 값 채우기 (아래 '로그인')
npm run dev          # http://localhost:3000 → 로그인 → /dashboard
```

## 로그인

`apps/web/.env`에 지정한 고정 계정 하나로만 로그인할 수 있습니다. 로그인하지 않으면 모든 페이지가 `/login`으로 이동하며, 로그인 후에는 원래 가려던 페이지로 돌아갑니다.

| 변수 | 설명 |
|------|------|
| `AUTH_USERNAME` | 아이디 |
| `AUTH_PASSWORD` | 비밀번호 |
| `AUTH_SECRET` | 세션 쿠키 서명 키 (32자 이상). 바꾸면 모든 로그인 세션이 끊깁니다. |

- 세 값 중 하나라도 없으면 아무도 로그인할 수 없습니다.
- 세션은 7일 동안 유지됩니다. 아이디를 바꾸면 기존 세션은 무효가 됩니다.
- 같은 IP에서 5회 실패하면 15분 동안 로그인을 막습니다(서버 메모리 기준).
- 프로덕션(`npm run build && npm start`)에서는 쿠키에 Secure가 붙으므로 HTTPS가 필요합니다(`localhost`는 예외).
- 구조: `apps/web/proxy.ts`(1차 리다이렉트), `apps/web/lib/auth/`(세션·검증), 데이터 접근 시 `requireViewer()`로 재확인합니다.

| 명령 | 내용 |
|------|------|
| `npm run dev` | 웹 앱 개발 서버 |
| `npm run build` | 웹 앱 프로덕션 빌드 |
| `npm test` | 전체 워크스페이스 테스트 (vitest) |
| `npm run typecheck` | 전체 타입 검사 |
| `npm run lint` | ESLint |

## 현재 상태

- **대시보드(`/dashboard`)만 구현**했습니다. 나머지 메뉴는 '준비 중'으로 비활성 표시됩니다.
- 백엔드(Supabase, 워커, 에어비앤비 커넥터)는 아직 없습니다. 대시보드는 오늘 날짜 기준 **샘플 데이터**로 동작하며 화면에 '데모 데이터'로 표시됩니다.
  - 샘플 데이터: `apps/web/lib/mock/`
  - 실제 데이터로 바꿀 곳: `apps/web/lib/dashboard/get-dashboard.ts` (반환 형태 `DashboardData`는 유지)
  - '지금 동기화'는 진행 로그를 흉내 내는 시뮬레이션입니다 (`apps/web/lib/mock/sync-simulation.ts`).
