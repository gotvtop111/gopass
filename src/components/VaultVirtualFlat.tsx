"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PasswordItem } from "@/types";
import { VaultRow } from "@/components/VaultRow";

const ROW_ESTIMATE = 76;

interface VaultVirtualFlatProps {
  items: PasswordItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (item: PasswordItem) => void;
  onDelete: (id: string) => void;
  onRequestCopy: (item: PasswordItem) => void;
}

export function VaultVirtualFlat({
  items,
  selectedIds,
  onToggleSelect,
  onEdit,
  onDelete,
  onRequestCopy,
}: VaultVirtualFlatProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 12,
  });

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-vault-muted">
        Không có mục nào khớp bộ lọc.
      </p>
    );
  }

  return (
    <div
      ref={parentRef}
      className="max-h-[min(55dvh,480px)] overflow-auto rounded-xl border border-vault-border bg-vault-surface/40 sm:max-h-[min(70vh,720px)]"
      role="list"
      aria-label="Danh sách tài khoản"
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.id}
              className="absolute left-0 top-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="listitem"
            >
              <VaultRow
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={onToggleSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onRequestCopy={onRequestCopy}
                showHost
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
