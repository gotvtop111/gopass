"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useVaultStore } from "@/store/useVaultStore";
import { useTheme } from "@/hooks/useTheme";

export function AppHeader() {
  const router = useRouter();
  const clearVault = useVaultStore((s) => s.clearVault);
  const { dark, toggle } = useTheme();

  const handleLock = () => {
    clearVault();
    router.replace("/unlock");
  };

  const handleLogout = async () => {
    clearVault();
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-vault-border pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Site Password
        </h1>
        <p className="text-sm text-vault-muted">Zero-knowledge vault</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="btn-ghost"
          aria-label="Chuyển theme"
        >
          {dark ? "☀️" : "🌙"}
        </button>
        <button type="button" onClick={handleLock} className="btn-ghost">
          Khóa
        </button>
        <button type="button" onClick={handleLogout} className="btn-ghost">
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
