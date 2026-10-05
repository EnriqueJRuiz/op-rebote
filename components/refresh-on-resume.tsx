"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const MIN_REFRESH_INTERVAL_MS = 30_000;

export function RefreshOnResume() {
  const router = useRouter();

  useEffect(() => {
    let lastRefreshAt = 0;

    const refreshIfActive = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefreshAt < MIN_REFRESH_INTERVAL_MS) return;

      lastRefreshAt = now;
      router.refresh();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refreshIfActive();
    };

    document.addEventListener("visibilitychange", refreshIfActive);
    window.addEventListener("focus", refreshIfActive);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", refreshIfActive);
      window.removeEventListener("focus", refreshIfActive);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  return null;
}
