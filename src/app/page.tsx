"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LoginForm } from "@/components/LoginForm";
import { useVaultStore } from "@/store/useVaultStore";

export default function HomePage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (isUnlocked) {
          router.replace("/vault");
        } else {
          router.replace("/unlock");
        }
      } else {
        setChecking(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !isUnlocked) {
        router.replace("/unlock");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isUnlocked]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-vault-muted">Đang kiểm tra phiên...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <HeroBanner />
      <LoginForm onSuccess={() => router.replace("/unlock")} />
    </main>
  );
}

function HeroBanner() {
  return (
    <div className="mb-10 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-vault-accent/20 text-3xl">
        🔐
      </div>
      <h1 className="text-3xl font-bold text-white">Site Password</h1>
      <p className="mt-2 max-w-sm text-sm text-vault-muted">
        Quản lý mật khẩu zero-knowledge. Server chỉ lưu dữ liệu đã mã hóa.
      </p>
    </div>
  );
}
