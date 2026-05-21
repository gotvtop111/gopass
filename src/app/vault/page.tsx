"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppHeader } from "@/components/AppHeader";
import { VaultImportCollapsible } from "@/components/VaultImportCollapsible";
import { VaultList } from "@/components/VaultList";
import { useVaultStore } from "@/store/useVaultStore";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useVaultLock } from "@/hooks/useVaultLock";
import { loadVaultItems } from "@/lib/vaultService";

export default function VaultPage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const encryptionKey = useVaultStore((s) => s.encryptionKey);
  const setItems = useVaultStore((s) => s.setItems);
  const vaultLock = useVaultLock();
  const [userId, setUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  useAutoLock(isUnlocked);

  useEffect(() => {
    if (!isUnlocked) return;
    const onHide = () => {
      vaultLock();
    };
    const onVis = () => {
      if (document.hidden) onHide();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
    };
  }, [isUnlocked, vaultLock]);

  useEffect(() => {
    if (!isUnlocked) {
      router.replace("/unlock");
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/");
        return;
      }
      setUserId(session.user.id);
    });
  }, [router, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked || !userId || !encryptionKey) return;
    setLoadError("");
    loadVaultItems(userId, encryptionKey)
      .then(setItems)
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Không tải được danh sách mật khẩu"
        );
      });
  }, [isUnlocked, userId, encryptionKey, setItems]);

  if (!isUnlocked || !userId) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-vault-muted">Đang tải vault...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-col px-3 py-4 sm:px-4 sm:py-6">
      <AppHeader />

      {loadError && (
        <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {loadError}
        </p>
      )}

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-5 lg:mt-6 lg:flex-row lg:items-start lg:gap-8">
        <section
          className="w-full shrink-0 lg:w-[min(100%,20rem)]"
          aria-labelledby="vault-io-title"
        >
          <h2 id="vault-io-title" className="sr-only">
            Nhập và xuất dữ liệu
          </h2>
          <VaultImportCollapsible userId={userId} />
        </section>

        <div className="min-h-0 min-w-0 flex-1">
          <VaultList userId={userId} />
        </div>
      </div>
    </main>
  );
}
