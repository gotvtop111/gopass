"use client";

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import type { PasswordItem } from "@/types";
import { VaultItemForm } from "@/components/VaultItemForm";
import { VaultToolbar } from "@/components/VaultToolbar";
import { VaultVirtualFlat } from "@/components/VaultVirtualFlat";
import { VaultGroupedView } from "@/components/VaultGroupedView";
import { PasscodeCopyModal } from "@/components/PasscodeCopyModal";
import { useVaultStore } from "@/store/useVaultStore";
import {
  deleteVaultItem,
  insertVaultItem,
  updateVaultItem,
} from "@/lib/vaultService";
import {
  filterByQuery,
  filterBySiteSubstring,
  sortItems,
  type VaultSortKey,
  type VaultViewMode,
} from "@/lib/vaultUtils";

interface VaultListProps {
  userId: string;
}

export function VaultList({ userId }: VaultListProps) {
  const items = useVaultStore((s) => s.items);
  const profile = useVaultStore((s) => s.profile);
  const encryptionKey = useVaultStore((s) => s.encryptionKey);
  const addItem = useVaultStore((s) => s.addItem);
  const updateItemStore = useVaultStore((s) => s.updateItem);
  const removeItem = useVaultStore((s) => s.removeItem);

  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [siteFilter, setSiteFilter] = useState("");
  const [viewMode, setViewMode] = useState<VaultViewMode>("grouped");
  const [sortKey, setSortKey] = useState<VaultSortKey>("updated");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyTarget, setCopyTarget] = useState<PasswordItem | null>(null);

  const filtered = useMemo(() => {
    let list = filterByQuery(items, deferredSearch);
    list = filterBySiteSubstring(list, siteFilter);
    return sortItems(list, sortKey);
  }, [items, deferredSearch, siteFilter, sortKey]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filtered.map((i) => i.id)));
  }, [filtered]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSave = async (
    data: Omit<PasswordItem, "id" | "createdAt" | "updatedAt">
  ) => {
    if (!encryptionKey) return;
    setBusy(true);
    setError("");
    try {
      if (editing) {
        const updated: PasswordItem = { ...editing, ...data };
        await updateVaultItem(updated, encryptionKey);
        updateItemStore(updated);
      } else {
        const created = await insertVaultItem(userId, data, encryptionKey);
        addItem(created);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setBusy(false);
      setEditing(null);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm("Xóa mục này?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteVaultItem(id);
      removeItem(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !confirm(
        `Xóa ${ids.length} mục đã chọn? Thao tác không hoàn tác được.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        await deleteVaultItem(id);
        removeItem(id);
        ok++;
      } catch {
        fail++;
      }
    }
    setSelectedIds(new Set());
    setBusy(false);
    if (fail > 0) {
      setError(`Đã xóa ${ok} mục, ${fail} mục lỗi.`);
    }
  };

  return (
    <div className="min-w-0 flex-1 space-y-6">
      <VaultToolbar
        search={searchInput}
        onSearchChange={setSearchInput}
        siteFilter={siteFilter}
        onSiteFilterChange={setSiteFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortKey={sortKey}
        onSortChange={setSortKey}
        totalCount={items.length}
        filteredCount={filtered.length}
        selectedCount={selectedIds.size}
        onSelectAllFiltered={selectAllFiltered}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onAdd={() => {
          setEditing(null);
          setModalOpen(true);
        }}
        disabled={busy}
      />

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="card min-h-[200px]" aria-label="Nội dung vault">
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-vault-muted">
            {items.length === 0
              ? "Chưa có mục nào. Dùng «Thêm tài khoản» hoặc Import ở cột bên trái."
              : "Không có mục nào khớp tìm kiếm / lọc website."}
          </p>
        ) : viewMode === "flat" ? (
          <VaultVirtualFlat
            items={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={(i) => {
              setEditing(i);
              setModalOpen(true);
            }}
            onDelete={handleDeleteOne}
            onRequestCopy={setCopyTarget}
          />
        ) : (
          <VaultGroupedView
            items={filtered}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onEdit={(i) => {
              setEditing(i);
              setModalOpen(true);
            }}
            onDelete={handleDeleteOne}
            onRequestCopy={setCopyTarget}
          />
        )}
      </section>

      {profile && copyTarget && (
        <PasscodeCopyModal
          open
          onClose={() => setCopyTarget(null)}
          profile={profile}
          passwordToCopy={copyTarget.password}
          itemLabel={copyTarget.name}
        />
      )}

      <VaultItemForm
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
}
