"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 ring-inset">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-bold">대시보드를 불러오지 못했어요</h1>
      <p className="mt-1 text-sm text-muted-foreground">잠시 후 다시 시도해 주세요. 문제가 계속되면 알려주세요.</p>
      <Button className="mt-6 h-10 rounded-xl px-5" onClick={() => retry()}>
        다시 시도
      </Button>
    </main>
  );
}
