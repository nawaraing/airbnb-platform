import {
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  /** 모바일 하단 탭용 짧은 이름 */
  shortLabel: string;
  icon: LucideIcon;
  /** 아직 만들지 않은 화면은 비활성으로 표시한다 */
  ready: boolean;
  /** 모바일 하단 탭에 노출 */
  mobile: boolean;
}

// docs/02-features.md §1 정보 구조
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", shortLabel: "홈", icon: LayoutDashboard, ready: true, mobile: true },
  { href: "/calendar", label: "예약·수익", shortLabel: "예약", icon: CalendarDays, ready: false, mobile: true },
  { href: "/pricing", label: "요금 자동화", shortLabel: "요금", icon: Tags, ready: false, mobile: true },
  { href: "/inbox", label: "메시지", shortLabel: "메시지", icon: MessageSquare, ready: false, mobile: true },
  { href: "/cleaning", label: "청소", shortLabel: "청소", icon: Sparkles, ready: false, mobile: true },
  { href: "/settings", label: "설정", shortLabel: "설정", icon: Settings, ready: false, mobile: false },
];
