"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/useVaultStore";

const IDLE_MS = 5 * 60 * 1000;

export function useAutoLock(enabled: boolean) {
  const router = useRouter();
  const clearVault = useVaultStore((s) => s.clearVault);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    clearVault();
    router.replace("/");
  }, [clearVault, router]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, IDLE_MS);
  }, [enabled, lock]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    const onVisibility = () => {
      if (document.hidden) lock();
    };
    document.addEventListener("visibilitychange", onVisibility);
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, lock, resetTimer]);
}
