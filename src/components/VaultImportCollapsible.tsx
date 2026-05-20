"use client";

import { useLayoutEffect, useState } from "react";
import { ImportExportPanel } from "@/components/ImportExportPanel";

interface VaultImportCollapsibleProps {
  userId: string;
}

/** Trên mobile: gấp gọn Import/Export để không chiếm màn hình; desktop luôn mở. */
export function VaultImportCollapsible({ userId }: VaultImportCollapsibleProps) {
  const [desktop, setDesktop] = useState(false);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <details
      open={desktop}
      className="rounded-2xl border border-vault-border bg-vault-surface/40 lg:border-0 lg:bg-transparent"
    >
      <summary className="cursor-pointer list-none rounded-2xl px-4 py-3 text-sm font-semibold text-white marker:hidden hover:bg-vault-bg/50 [&::-webkit-details-marker]:hidden lg:hidden">
        Import / Export — chạm để mở / đóng
      </summary>
      <div className="border-t border-vault-border px-2 pb-3 pt-1 lg:border-0 lg:p-0">
        <ImportExportPanel
          userId={userId}
          className="border-0 bg-transparent lg:sticky lg:top-4 lg:max-h-[min(calc(100dvh-5rem),900px)] lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-vault-border lg:bg-vault-surface/60 lg:p-4"
        />
      </div>
    </details>
  );
}
