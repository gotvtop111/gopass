"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LoginForm } from "@/components/LoginForm";
import { useVaultStore } from "@/store/useVaultStore";

export default function HomePage() {
  const router = useRouter();
  const isUnlocked = useVaultStore((s) => s.isUnlocked);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setReady(true);
        return;
      }
      if (isUnlocked) {
        router.replace("/vault");
      } else {
        router.replace("/unlock");
      }
    });
  }, [router, isUnlocked]);

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-vault-muted">Đang kiểm tra phiên...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:py-12">
      <HeroBanner />
      <LoginForm onSuccess={() => router.replace("/unlock")} />
    </main>
  );
}

function HeroBanner() {
  return (
    <div className="mb-8 text-center sm:mb-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-vault-accent/20 text-3xl sm:h-16 sm:w-16">
        🔐
      </div>
      <h1 className="text-2xl font-bold text-white sm:text-3xl">Site Password</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-vault-muted">
        Username + 2 mật khẩu truy cập + 2 passcode két. Mỗi lần đăng nhập / mở két
        / copy kiểm tra ngẫu nhiên một lớp.
      </p>
    </div>
  );
}
