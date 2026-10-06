"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { MAIN_CONTENT_ID } from "@/components/app-shell/skip-link";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id={MAIN_CONTENT_ID} className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">대시보드를 불러오지 못했어요</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요. 문제가 계속되면 알려주세요.</p>
      <Button className="mt-6 h-10 rounded-md px-5" onClick={() => retry()}>
        다시 시도
      </Button>
    </main>
  );
}
