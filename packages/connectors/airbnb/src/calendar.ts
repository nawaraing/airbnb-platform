// 숙소 캘린더: 날짜별 요금·가용 조회, 요금 변경, 비슷한 숙소 가격 (NOTES.md 연산별 현황)
import { addDays } from "@repo/core";
import type { BrowserContext } from "playwright-core";
import { z } from "zod";
import { AirbnbApiError, GraphqlSession } from "./graphql";
import { toGlobalId } from "./ids";

export interface CalendarDay {
  date: string;
  available: boolean;
  /** 호스트가 정한 1박 요금 (프로모션 적용 전, nativePrice). 요금 엔진은 이 값을 읽고 쓴다 */
  nightlyPrice: number | null;
  /** 프로모션 적용 후 게스트에게 보이는 1박 요금 (price) */
  displayedPrice: number | null;
  currency: string | null;
  smartPricing: boolean;
  reserved: boolean;
}

/** 날짜 범위(양끝 포함)에 같은 1박 요금 */
export interface PriceRange {
  from: string;
  to: string;
  price: number;
}

export interface PriceWriteResult {
  date: string;
  requested: number;
  /** 변경 후 다시 읽은 값 */
  actual: number | null;
  ok: boolean;
}

export interface MarketPrice {
  date: string;
  /** 예약된 비슷한 숙소 가격대 */
  bookedLow: number | null;
  bookedHigh: number | null;
  /** 예약 가능한 비슷한 숙소 가격대 */
  availableLow: number | null;
  availableHigh: number | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CALENDAR_WINDOW_DAYS = 90;
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const CalendarResponse = z.object({
  presentation: z.object({
    hostCalendar: z.object({
      sections: z.object({
        calendarGridViewSection: z.object({
          days: z.array(
            z.object({
              day: z.string(),
              available: z.boolean(),
              reservationData: z.unknown().optional(),
              priceData: z
                .object({
                  currency: z.string().nullish(),
                  price: z.number().nullish(),
                  nativePrice: z.number().nullish(),
                  listingSmartPricingEnabled: z.boolean().nullish(),
                })
                .nullish(),
            }),
          ),
        }),
      }),
    }),
  }),
});

const PriceMutationResponse = z.object({
  mutateEditPanelPricingSettings: z.object({
    success: z.boolean(),
    userFacingErrorMessage: z.string().nullish(),
  }),
});

const Money = z.object({ intValue: z.number().nullish() }).nullish();
const EditPanelResponse = z.object({
  presentation: z.object({
    hostCalendarEditPanelV2: z.object({
      pricingGuidance: z
        .object({
          nightlyPriceSimilarListingsEntryPoint: z
            .object({ range: z.object({ lowPrice: Money, highPrice: Money }).nullish() })
            .nullish(),
        })
        .nullish(),
      compset: z
        .object({
          formattedLowPriceAvailable: z.string().nullish(),
          formattedHighPriceAvailable: z.string().nullish(),
        })
        .nullish(),
    }),
  }),
});

function parse<T>(schema: z.ZodType<T>, op: string, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw new AirbnbApiError(op, "schema", `응답 형식이 예상과 다릅니다: ${result.error.issues[0]?.path.join(".")}`);
  return result.data;
}

const digits = (text: string | null | undefined) => {
  const n = text ? Number(text.replace(/[^\d]/g, "")) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};

export class AirbnbCalendar {
  private constructor(
    readonly session: GraphqlSession,
    readonly listingId: string,
    private readonly timeZone: string,
  ) {}

  /** 숙소 캘린더 화면을 열어 둔 채로 API를 쓴다 */
  static async open(context: BrowserContext, listingId: string, timeZone = "Asia/Seoul"): Promise<AirbnbCalendar> {
    if (!/^\d+$/.test(listingId)) throw new Error(`숙소 ID는 숫자여야 합니다: ${listingId}`);
    const session = await GraphqlSession.open(context, `/multicalendar/${listingId}`);
    return new AirbnbCalendar(session, listingId, timeZone);
  }

  async close() {
    await this.session.close();
  }

  async getCalendar(from: string, to: string): Promise<CalendarDay[]> {
    if (!ISO_DATE.test(from) || !ISO_DATE.test(to) || from > to) throw new Error(`잘못된 범위: ${from} ~ ${to}`);
    const days: CalendarDay[] = [];
    for (let start = from; start <= to; ) {
      const endCandidate = addDays(start, CALENDAR_WINDOW_DAYS - 1);
      const end = endCandidate < to ? endCandidate : to;
      const data = await this.session.query("getDLSHostCalendar", {
        listingId: toGlobalId("StayListing", this.listingId),
        startDate: start,
        endDate: end,
        hostCalendarViewType: "MONTH_VIEW",
        lensTypes: ["NOTE", "PRICE", "PROMOTION"],
        timeZone: this.timeZone,
        localizationContext: { timeZone: this.timeZone, firstDayOfWeek: 0 },
        hostCalendarSectionTypes: ["METADATA", "NAVIGATION", "MAIN_VIEW"],
        includeCustomSettings: true,
      });
      const parsed = parse(CalendarResponse, "getDLSHostCalendar", data);
      for (const d of parsed.presentation.hostCalendar.sections.calendarGridViewSection.days) {
        // 화면 그리드 여백 날짜는 제외
        if (d.day < start || d.day > end) continue;
        days.push({
          date: d.day,
          available: d.available,
          nightlyPrice: d.priceData?.nativePrice ?? null,
          displayedPrice: d.priceData?.price ?? null,
          currency: d.priceData?.currency ?? null,
          smartPricing: d.priceData?.listingSmartPricingEnabled ?? false,
          reserved: d.reservationData != null,
        });
      }
      start = addDays(end, 1);
    }
    return days;
  }

  /**
   * 1박 요금을 바꾸고, 다시 읽어 실제 반영 값을 돌려준다 (read-after-write).
   * 같은 요금의 범위는 요청 한 번으로 묶는다. 요금 변경 해시가 만료됐으면 화면 조작으로 한 번 바꾸며 새 해시를 배운다.
   */
  async setPrices(ranges: PriceRange[]): Promise<PriceWriteResult[]> {
    if (ranges.length === 0) return [];
    for (const r of ranges) {
      if (!ISO_DATE.test(r.from) || !ISO_DATE.test(r.to) || r.from > r.to) throw new Error(`잘못된 범위: ${r.from} ~ ${r.to}`);
      if (!Number.isInteger(r.price) || r.price <= 0) throw new Error(`잘못된 요금: ${r.price}`);
    }

    const byPrice = new Map<number, PriceRange[]>();
    for (const r of ranges) byPrice.set(r.price, [...(byPrice.get(r.price) ?? []), r]);

    for (const [price, group] of byPrice) {
      try {
        await this.mutatePrice(group, price);
      } catch (e) {
        if (!(e instanceof AirbnbApiError && e.kind === "unknown_hash")) throw e;
        await this.relearnPriceMutation(group[0]!.from, price);
        await this.mutatePrice(group, price);
      }
    }

    const from = ranges.reduce((min, r) => (r.from < min ? r.from : min), ranges[0]!.from);
    const to = ranges.reduce((max, r) => (r.to > max ? r.to : max), ranges[0]!.to);
    const actualByDate = new Map((await this.getCalendar(from, to)).map((d) => [d.date, d.nightlyPrice]));

    const results: PriceWriteResult[] = [];
    for (const r of ranges) {
      for (let date = r.from; date <= r.to; date = addDays(date, 1)) {
        const actual = actualByDate.get(date) ?? null;
        results.push({ date, requested: r.price, actual, ok: actual === r.price });
      }
    }
    return results;
  }

  private async mutatePrice(ranges: PriceRange[], price: number) {
    const data = await this.session.mutate("EditPanelPricingSettingsMutation", {
      input: {
        listingId: this.listingId,
        selectedDateRanges: ranges.map((r) => ({ startDate: r.from, endDate: r.to })),
        nightlyPriceAmount: price,
        turnOnSmartPricing: false,
        isCalendarV2: true,
      },
    });
    const parsed = parse(PriceMutationResponse, "EditPanelPricingSettingsMutation", data).mutateEditPanelPricingSettings;
    if (!parsed.success) {
      throw new AirbnbApiError("EditPanelPricingSettingsMutation", "rejected", parsed.userFacingErrorMessage ?? "요금 변경이 거부되었습니다");
    }
  }

  /** 화면에서 날짜 하나의 요금을 직접 바꾸며, 그때 나가는 요청에서 새 해시를 배운다 */
  private async relearnPriceMutation(date: string, price: number) {
    const page = this.session.page;
    const before = this.session.operations.hash("EditPanelPricingSettingsMutation");
    await page.goto(`${page.url().split("/multicalendar/")[0]}/multicalendar/${this.listingId}`, { waitUntil: "load" });
    await page.waitForTimeout(5000);

    const [y, m, d] = date.split("-").map(Number) as [number, number, number];
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    const cell = page.getByRole("button", { name: new RegExp(`^(오늘, )?${weekday} ${d} ${m}월`) });
    for (let i = 0; i < 24 && (await cell.count()) === 0; i++) {
      await page.mouse.wheel(0, 1200);
      await page.waitForTimeout(600);
    }
    if ((await cell.count()) === 0) throw new Error(`캘린더에서 ${date} 칸을 찾지 못했습니다`);
    await cell.first().scrollIntoViewIfNeeded();
    await cell.first().click();

    const sidebar = page.getByRole("region", { name: "선택된 날짜를 수정하는 사이드바" });
    await sidebar.getByRole("button", { name: /1박당 요금/ }).click();
    const input = sidebar.locator("#PriceInput-nightlyPrice");
    await input.waitFor({ timeout: 10_000 });
    await input.fill(String(price));
    const mutation = page.waitForRequest((req) => req.url().includes("/EditPanelPricingSettingsMutation/"), { timeout: 15_000 });
    await sidebar.getByRole("button", { name: "저장" }).click();
    await mutation;
    await page.waitForTimeout(1500);

    if (this.session.operations.hash("EditPanelPricingSettingsMutation") === before) {
      throw new AirbnbApiError("EditPanelPricingSettingsMutation", "unknown_hash", "화면 조작 후에도 새 해시를 얻지 못했습니다");
    }
  }

  /** 날짜별 '비슷한 숙소' 가격대 (요금 편집 화면의 정보) */
  async getMarketPrices(dates: string[]): Promise<MarketPrice[]> {
    const results: MarketPrice[] = [];
    for (const date of dates) {
      if (!ISO_DATE.test(date)) throw new Error(`잘못된 날짜: ${date}`);
      const range = [{ startDate: date, endDate: date }];
      const data = await this.session.query("EditPanelQuery", {
        listingId: this.listingId,
        globalListingId: toGlobalId("StayListing", this.listingId),
        selectedDateRanges: range,
        selectedDateRangesPricingGuidance: range,
        isYearlyCalendar: false,
        hostPricingCalculatorStartDate: date,
        hostPricingCalculatorEndDate: addDays(date, 1),
        hostPricingCalculatorMockIdentifier: null,
        editPanelMockIdentifier: null,
        isShowCalendarDayEventsEnabled: true,
        calendarV2: true,
        isNightlyPriceTipsModeOn: false,
        blockNotesEnabled: true,
      });
      const panel = parse(EditPanelResponse, "EditPanelQuery", data).presentation.hostCalendarEditPanelV2;
      const booked = panel.pricingGuidance?.nightlyPriceSimilarListingsEntryPoint?.range;
      results.push({
        date,
        bookedLow: booked?.lowPrice?.intValue ?? null,
        bookedHigh: booked?.highPrice?.intValue ?? null,
        availableLow: digits(panel.compset?.formattedLowPriceAvailable),
        availableHigh: digits(panel.compset?.formattedHighPriceAvailable),
      });
    }
    return results;
  }
}
