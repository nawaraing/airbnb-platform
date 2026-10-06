# 에어비앤비 호스트 웹 분석 노트 (M0)

커넥터 연산별로 호스트 웹이 실제로 주고받는 요청을 기록한다. 마지막 확인: 2026-10-06 (www.airbnb.co.kr, 한국어/KRW).
원본 응답 기록은 `.airbnb-session/captures/` (git 제외)에 있다. 다시 기록하려면 `npm run airbnb:probe [-- 화면키 | /경로]`.

## 실행 환경

- **로그인**: 자동화 플래그 없는 일반 Chrome을 전용 프로필로 띄우고, 사람이 로그인한 뒤 CDP로 연결한다(`src/browser.ts`). Google 소셜 로그인 정상 통과.
- **Apple Silicon + 인텔용 Node(x64)**: 자식으로 띄운 Chrome까지 Rosetta로 실행돼 매우 느리다. `arch -arm64`로 네이티브 실행을 강제한다.
- **봇 탐지**: `datadome` 쿠키가 있다 → DataDome 사용. 서버(데이터센터 IP·헤드리스)에서 실행할 때의 탐지 위험은 M0 후속으로 측정한다.

## 로그인 판별

- 로그인 전에도 `_user_attributes` 쿠키가 있다(id 없음).
- 로그인하면 `_user_attributes`에 사용자 id가 들어가고 `_aat`, `_aaj`, `_airbed_session_id`, `_pt`, `li`, `hli`가 새로 생긴다.
- 판별 기준: `_user_attributes`(URL 인코딩 JSON)의 `id` 존재 (`src/session.ts`).

## 요청 방식

- GraphQL persisted query
  - 조회: `GET /api/v3/<OperationName>/<sha256>?operationName=…&locale=ko&currency=KRW&variables=<JSON>&extensions=<JSON>`
  - 변경: `POST /api/v3/<OperationName>/<sha256>?operationName=…&locale=ko&currency=KRW`, 본문 `{operationName, variables, extensions}`
  - `extensions = {"persistedQuery":{"version":1,"sha256Hash":…}}`
- **호출 방법(구현됨, `src/graphql.ts`)**: 숙소 캘린더 화면을 열어 두고, 화면이 보낸 첫 API 요청의 헤더를 복사해 같은 페이지 안에서 `fetch`로 호출한다. 쿠키는 브라우저가 붙인다.
  - 복사하는 헤더: `x-airbnb-api-key`, `x-csrf-token`, `x-csrf-without-token`, `x-airbnb-graphql-platform(-client)`, `x-airbnb-supports-airlock-v2`, `x-client-version`, `accept`. 값은 메모리에만 두고 기록하지 않는다.
- **해시는 웹 배포 때마다 바뀔 수 있다.**
  - 기본값은 `src/operations.ts`에 두고, 화면이 다른 해시로 요청하면 그 값을 배워 `.airbnb-session/operations.json`에 캐시한다. 우리가 보낸 요청에서는 배우지 않는다(만료 해시 오염 방지).
  - 해시를 모르면 HTTP 400 `{"error_type":"persisted_query_not_found","error_message":"PersistedQueryNotFound"}` (GraphQL `errors` 형식이 아님).
  - 요금 변경 해시는 웹 스크립트에 그대로 들어 있지 않다(작업 이름만 있음). 만료되면 화면에서 날짜 하나를 직접 바꾸며 새 해시를 배운 뒤 나머지를 API로 처리한다(`AirbnbCalendar.relearnPriceMutation`).
- ID는 Relay global ID(base64 `"타입:숫자"`). 같은 숙소도 연산마다 타입이 다르다.
  - `StaySupplyListing:<숫자>` — 숙소 목록, 인사이트
  - `StayListing:<숫자>` — 캘린더, 가격 팁
  - `User:<숫자>`, `MessagingInbox:<숫자>`
- 금액: 캘린더는 원 단위 정수(`priceData.price`). 수입 화면은 `amountMicros`(문자열, 금액 × 1,000,000)와 `currency`.

## 연산별 현황

| 커넥터 연산 | 화면 | GraphQL 작업 | 상태 |
|-------------|------|--------------|------|
| `listListings` | `/hosting/listings` | `UnifiedListOfListingsQuery` | ✅ id, `nameOrPlaceholderName`, `statuses.listingDisplayStatus`(예: `NEW`), `location.smartLocation` |
| `listReservations` | `/hosting` (투데이) | `HostReservationsTabQuery` | ⚠ 구조만 확인. 테스트 숙소가 미공개라 예약 0건 |
| `getCalendar` | `/multicalendar/<숫자 id>` | `getDLSHostCalendar` | ✅ 직접 호출 검증. `variables`: `listingId`(StayListing gid), `startDate`, `endDate`, `timeZone` 등. 응답 `…calendarGridViewSection.days[]`: `day`, `available`, `priceData.nativePrice`, `priceData.price`, `reservationData`, `priceData.listingSmartPricingEnabled` |
| `getListingSettings` | 〃 | `UnifiedCalendarSettingsQuery`, `CustomSettingsQuery`, `LastMinuteOfferSettingsQuery` | 미분석 |
| `getMarketPrices` | 〃 (날짜 선택 → 요금 편집) | `EditPanelQuery` | ✅ 직접 호출 검증. `pricingGuidance.nightlyPriceSimilarListingsEntryPoint.range`(예약된 비슷한 숙소 low/high, `intValue`), `compset.formattedLow/HighPriceAvailable`(예약 가능한 비슷한 숙소). 미공개 숙소에서도 나온다. `getNightlyPriceTips`는 `NO_TIPS` |
| 기본 요금 | `/hosting/listings/editor/<id>/details/pricing` | `PerMonthPriceQuery` 등 | 미분석 |
| `listThreads` | `/hosting/messages` | `ViaductInboxData` | ⚠ 구조만 확인. 스레드 0개 |
| `listPayoutLines` | `/earnings` | `FetchHostTransactionStats`, `HostBookingStats` | ⚠ 0원. 대금 수령 방법 미설정이라 통화가 USD로 나옴. 거래 목록 작업은 거래가 생겨야 확인 가능 |
| `setPrices` | 〃 (날짜 선택 → 1박당 요금 → 저장) | `EditPanelPricingSettingsMutation` | ✅ 직접 호출 + 해시 만료 복구 검증. `variables.input`: `listingId`(숫자 문자열), `selectedDateRanges[{startDate,endDate}]`(양끝 포함, 여러 범위 가능), `nightlyPriceAmount`(원), `turnOnSmartPricing:false`, `isCalendarV2:true`. 응답 `mutateEditPanelPricingSettings.success`, `userFacingErrorMessage` |
| `sendMessage` | — | 미확인 | ❌ 스레드가 있어야 확인 가능 |

## 요금 값의 의미

- `nativePrice`: 호스트가 정한 1박 요금(프로모션 적용 전). **요금 엔진이 읽고 쓰는 값.** 요금 변경 mutation의 `nightlyPriceAmount`가 이 값을 바꾼다.
- `price`: 프로모션(예: 신규 숙소 할인)이 적용된 뒤 게스트에게 보이는 1박 요금. 테스트 숙소는 10월 초 날짜가 `nativePrice 60,155 / price 46,921`(약 22% 할인).
- 캘린더 칸의 `₩4.7만` 같은 표시는 `price` 기준이다.

## 검증 스크립트 (카나리)

`npm run airbnb:price-check -- <숙소ID> [--stale-hash]`

6주 뒤 연속 2박을 조회 → 같은 요금으로 범위 변경 → 재조회 확인 → 원래 요금으로 원복 → 재조회 확인 → 비슷한 숙소 가격 조회. 실패하면 종료 코드 1. `--stale-hash`는 요금 변경 해시를 일부러 틀리게 해 화면 조작 복구 경로까지 검증한다. 2026-10-06 두 경로 모두 통과.

## 화면 구조 (화면 조작 경로용)

- 날짜 칸: `button` 이름 `"[오늘, ]수요일 18 11월 예약 불가 1박 요금 ₩6만"`. 기본 화면은 전월~다음 달 3개월, 그 밖은 스크롤.
- 날짜를 누르면 `region "선택된 날짜를 수정하는 사이드바"`가 열린다: `예약 가능으로 설정`(가용성 변경, 다채널 차단에 쓸 후보), `1박당 요금 ₩…` → 입력칸 `#PriceInput-nightlyPrice` + `저장`(값이 바뀌기 전엔 비활성).

## 주소 변경 (설계 문서의 화면 경로와 다름)

- `/hosting/reservations/*` → `/hosting`으로 리다이렉트. 예약은 투데이 화면이 보여준다.
- `/multicalendar`(전체 숙소) → `/prohost-opt-in`(전문 호스팅 도구 동의 화면). 숙소별 `/multicalendar/<숫자 id>`는 바로 열린다. `/hosting/calendar`도 숙소별 캘린더로 이동한다.
- `/hosting/earnings` → 404. `/users/transaction_history` → `/earnings`.
