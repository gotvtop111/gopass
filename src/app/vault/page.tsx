"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppHeader } from "@/components/AppHeader";
import { VaultImportCollapsible } from "@/components/VaultImportCollapsible";
import { VaultList } from "@/components/VaultList";
import { useVaultStore } from "@/store/useVaultStore";
import { useAutoLock } from "@/hooks/useAutoLock";
import { useFullLogout } from "@/hooks/useFullLogout";

export default function VaultPage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const fullLogout = useFullLogout();
  const [userId, setUserId] = useState<string | null>(null);

  useAutoLock(isUnlocked);

  useEffect(() => {
    if (!isUnlocked) return;
    const onHide = () => {
      void fullLogout();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) onHide();
    });
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
    };
  }, [isUnlocked, fullLogout]);

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
