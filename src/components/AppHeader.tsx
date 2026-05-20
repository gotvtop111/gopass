"use client";

import { useTheme } from "@/hooks/useTheme";
import { useFullLogout } from "@/hooks/useFullLogout";

export function AppHeader() {
  const fullLogout = useFullLogout();
  const { dark, toggle } = useTheme();

  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-vault-border pb-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Site Password
        </h1>
        <p className="text-xs text-vault-muted sm:text-sm">
          Zero-knowledge vault
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
        <button
          type="button"
          onClick={toggle}
          className="btn-ghost"
          aria-label="Chuyển theme"
        >
          {dark ? "☀️" : "🌙"}
        </button>
        <button
          type="button"
          onClick={() => fullLogout()}
          className="btn-ghost"
          title="Đăng xuất — lần sau nhập lại username và mật khẩu"
        >
          Khóa &amp; thoát
        </button>
      </div>
    </header>
  );
}
