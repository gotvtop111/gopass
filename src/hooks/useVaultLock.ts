"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/store/useVaultStore";
import { clearPasscodeChallengeSlot } from "@/lib/challenge";

/** Khóa két — giữ đăng nhập Supabase, chỉ cần passcode lần sau */
export function useVaultLock() {
  const router = useRouter();
  const setEncryptionKey = useVaultStore((s) => s.setEncryptionKey);
  const setItems = useVaultStore((s) => s.setItems);

  return useCallback(() => {
    setEncryptionKey(null);
    setItems([]);
    clearPasscodeChallengeSlot();
    router.replace("/unlock");
  }, [router, setEncryptionKey, setItems]);
}
