/** 각 페이지의 <main>에 다는 id. 키보드 사용자가 사이드바를 건너뛰고 본문으로 간다 */
export const MAIN_CONTENT_ID = "main-content";

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-sm focus-visible:font-semibold focus-visible:text-primary-foreground focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-brass focus-visible:outline-none"
    >
      본문으로 건너뛰기
    </a>
  );
}
