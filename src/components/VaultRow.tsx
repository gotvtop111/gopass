"use client";

import type { PasswordItem } from "@/types";
import { itemDisplayHost } from "@/lib/vaultUtils";

interface VaultRowProps {
  item: PasswordItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onRequestCopy: (item: PasswordItem) => void;
  showHost?: boolean;
}

function faviconUrl(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
  } catch {
    return null;
  }
}

export function VaultRow({
  item,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onRequestCopy,
  showHost = true,
}: VaultRowProps) {
  const icon = item.url ? faviconUrl(item.url) : null;
  const host = itemDisplayHost(item);

  return (
    <div
      className={`flex flex-col gap-2 border-b border-vault-border/40 py-2 pl-1 pr-2 transition hover:bg-vault-bg/80 sm:flex-row sm:items-center ${
        selected ? "bg-vault-accent/10" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <label className="flex shrink-0 cursor-pointer items-center px-1">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(item.id)}
            className="rounded border-vault-border accent-vault-accent"
            aria-label={`Chọn ${item.name}`}
          />
        </label>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-vault-bg">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="h-5 w-5 rounded" />
          ) : (
            <span className="text-sm">🔐</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="truncate font-medium text-white">{item.name}</span>
            {item.username && (
              <span className="truncate text-sm text-vault-muted">
                @{item.username}
              </span>
            )}
          </div>
          {showHost && (
            <p className="truncate text-xs text-vault-muted/90">{host}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 pl-9 sm:gap-2 sm:pl-0">
        <button
          type="button"
          onClick={() => onRequestCopy(item)}
          className="shrink-0 rounded-lg border border-transparent px-2 py-1 text-xs text-vault-muted hover:border-vault-border hover:text-white"
          title="Cần passcode để sao chép"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="shrink-0 rounded-lg border border-transparent px-2 py-1 text-xs text-vault-muted hover:border-vault-border hover:text-white"
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="shrink-0 rounded-lg border border-transparent px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
