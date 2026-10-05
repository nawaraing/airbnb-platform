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
npm run dev          # http://localhost:3000 → /dashboard
```

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
