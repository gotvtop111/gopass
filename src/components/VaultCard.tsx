"use client";

import type { PasswordItem } from "@/types";
import { copyWithTimeout } from "@/lib/crypto";

interface VaultCardProps {
  item: PasswordItem;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
}

function faviconUrl(url: string): string | null {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`)
      .hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
  } catch {
    return null;
  }
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname;
  } catch {
    return url;
  }
}

export function VaultCard({ item, onEdit, onDelete }: VaultCardProps) {
  const icon = item.url ? faviconUrl(item.url) : null;

  const handleCopy = async () => {
    await copyWithTimeout(item.password, 30000);
  };

  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vault-bg">
          {icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon} alt="" className="h-6 w-6 rounded" />
          ) : (
            <span className="text-lg">🔐</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-white">{item.name}</h3>
          {item.url && (
            <p className="truncate text-xs text-vault-muted">{shortUrl(item.url)}</p>
          )}
          {item.username && (
            <p className="mt-1 truncate text-sm text-vault-muted">
              {item.username}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="btn-ghost flex-1 text-xs"
          title="Sao chép mật khẩu (xóa clipboard sau 30s)"
        >
          Sao chép
        </button>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="btn-ghost text-xs"
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="btn-ghost text-xs text-red-400 hover:text-red-300"
        >
          Xóa
        </button>
      </div>
    </article>
  );
}
