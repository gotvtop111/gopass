"use client";

import { useEffect, useRef, useCallback } from "react";
import { useFullLogout } from "@/hooks/useFullLogout";
import { useVaultLock } from "@/hooks/useVaultLock";

const IDLE_MS = 5 * 60 * 1000;

/** Ẩn tab → khóa két; idle 5 phút → đăng xuất hoàn toàn */
export function useAutoLock(enabled: boolean) {
  const fullLogout = useFullLogout();
  const vaultLock = useVaultLock();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lock = useCallback(() => {
    void fullLogout();
  }, [fullLogout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(lock, IDLE_MS);
  }, [enabled, lock]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );

    const onVisibility = () => {
      if (document.hidden) vaultLock();
    };
    const onPageHide = () => vaultLock();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, lock, resetTimer, vaultLock]);
}
