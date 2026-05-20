"use client";

import { useMemo, useState } from "react";
import type { PasswordItem } from "@/types";
import { VaultCard } from "@/components/VaultCard";
import { VaultItemForm } from "@/components/VaultItemForm";
import { ImportExportPanel } from "@/components/ImportExportPanel";
import { useVaultStore } from "@/store/useVaultStore";
import {
  deleteVaultItem,
  insertVaultItem,
  updateVaultItem,
} from "@/lib/vaultService";

interface VaultListProps {
  userId: string;
}

export function VaultList({ userId }: VaultListProps) {
  const items = useVaultStore((s) => s.items);
  const encryptionKey = useVaultStore((s) => s.encryptionKey);
  const addItem = useVaultStore((s) => s.addItem);
  const updateItemStore = useVaultStore((s) => s.updateItem);
  const removeItem = useVaultStore((s) => s.removeItem);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PasswordItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.url.toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q)
    );
  }, [items, search]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa mục này?")) return;
    setBusy(true);
    setError("");
    try {
      await deleteVaultItem(id);
      removeItem(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <ImportExportPanel userId={userId} disabled={busy} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Tìm theo tên, URL, username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn-primary shrink-0"
          disabled={busy}
        >
          + Thêm mới
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-vault-muted">
          {items.length === 0
            ? "Chưa có mục nào. Nhấn Thêm mới để bắt đầu."
            : "Không có kết quả phù hợp."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <VaultCard
              key={item.id}
              item={item}
              onEdit={(i) => {
                setEditing(i);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
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
