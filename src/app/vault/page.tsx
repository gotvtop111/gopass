"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { AppHeader } from "@/components/AppHeader";
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
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <AppHeader />
      <VaultList userId={userId} />
    </main>
  );
}
