"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PasscodeGate } from "@/components/PasscodeGate";
import { useVaultStore } from "@/store/useVaultStore";

export default function UnlockPage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isUnlocked) {
      router.replace("/vault");
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

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-vault-muted">Đang tải...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <PasscodeGate userId={userId} />
    </main>
  );
}
