"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppHeader } from "@/components/AppHeader";
import { ImportExportPanel } from "@/components/ImportExportPanel";
import { VaultList } from "@/components/VaultList";
import { useVaultStore } from "@/store/useVaultStore";
import { useAutoLock } from "@/hooks/useAutoLock";

export default function VaultPage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const [userId, setUserId] = useState<string | null>(null);

  useAutoLock(isUnlocked);

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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-vault-muted">Đang tải vault...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <AppHeader />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <section
          className="shrink-0 lg:w-[min(100%,20rem)]"
          aria-labelledby="vault-io-title"
        >
          <h2 id="vault-io-title" className="sr-only">
            Nhập và xuất dữ liệu
          </h2>
          <ImportExportPanel
            userId={userId}
          className="mb-6 lg:mb-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
          />
        </section>

        <VaultList userId={userId} />
      </div>
    </main>
  );
}
