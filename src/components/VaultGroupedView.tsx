"use client";

import { useMemo, useState } from "react";
import type { PasswordItem } from "@/types";
import { groupByHost } from "@/lib/vaultUtils";
import { VaultRow } from "@/components/VaultRow";

const SITE_PAGE = 40;

interface VaultGroupedViewProps {
  items: PasswordItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onRequestCopy: (item: PasswordItem) => void;
}

function faviconForHost(host: string): string | null {
  if (!host || host === "__no_url__") return null;
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
}

export function VaultGroupedView({
  items,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onRequestCopy,
}: VaultGroupedViewProps) {
  const groups = useMemo(() => groupByHost(items), [items]);
  const [visibleSites, setVisibleSites] = useState(SITE_PAGE);

  const shownGroups = groups.slice(0, visibleSites);
  const hasMore = visibleSites < groups.length;

  if (groups.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-vault-muted">
        Không có mục nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Theo website">
      {shownGroups.map((g) => {
        const icon = faviconForHost(g.host === "__no_url__" ? "" : g.host);
        const multi = g.items.length > 1;

        return (
          <details
            key={g.host}
            className="group rounded-xl border border-vault-border bg-vault-surface/40"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
              <span className="text-vault-muted transition group-open:rotate-90" aria-hidden>
                ▸
              </span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-vault-bg">
                {icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={icon} alt="" className="h-6 w-6 rounded" />
                ) : (
                  <span>🌐</span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{g.displayHost}</span>
                  <span className="rounded-full bg-vault-bg px-2 py-0.5 text-xs text-vault-muted">
                    {g.items.length} tài khoản
                  </span>
                  {multi && (
                    <span className="text-xs text-amber-400/90">Nhiều tài khoản</span>
                  )}
                </div>
              </div>
            </summary>
            <div className="border-t border-vault-border/60 px-1 pb-2 pt-0">
              <div className="max-h-[min(45dvh,380px)] overflow-y-auto sm:max-h-[min(50vh,420px)]">
                {g.items.map((item) => (
                  <VaultRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.has(item.id)}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onRequestCopy={onRequestCopy}
                    showHost={false}
                  />
                ))}
              </div>
            </div>
          </details>
        );
      })}
      {hasMore && (
        <button
          type="button"
          className="btn-ghost w-full text-sm"
          onClick={() => setVisibleSites((n) => n + SITE_PAGE)}
        >
          Xem thêm website ({groups.length - visibleSites} còn lại)
        </button>
      )}
    </div>
  );
}
