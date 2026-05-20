"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useVaultStore } from "@/store/useVaultStore";
import { clearAllChallengeSlots } from "@/lib/challenge";

/** Đăng xuất hoàn toàn — lần sau phải nhập username + mật khẩu truy cập */
export function useFullLogout() {
  const router = useRouter();
  const clearVault = useVaultStore((s) => s.clearVault);

  return useCallback(async () => {
    clearVault();
    clearAllChallengeSlots();
    await supabase.auth.signOut();
    router.replace("/");
  }, [clearVault, router]);
}
