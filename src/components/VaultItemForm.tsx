"use client";

import { useEffect, useState } from "react";
import type { PasswordItem } from "@/types";
import { Modal } from "@/components/Modal";
import { PasswordGenerator } from "@/components/PasswordGenerator";

const emptyItem = {
  name: "",
  url: "",
  username: "",
  password: "",
  notes: "",
};

interface VaultItemFormProps {
  open: boolean;
  onClose: () => void;
  initial?: PasswordItem | null;
  onSave: (
    data: Omit<PasswordItem, "id" | "createdAt" | "updatedAt">
  ) => void | Promise<void>;
  saving?: boolean;
}

export function VaultItemForm({
  open,
  onClose,
  initial,
  onSave,
  saving = false,
}: VaultItemFormProps) {
  const [form, setForm] = useState(emptyItem);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              url: initial.url,
              username: initial.username,
              password: initial.password,
              notes: initial.notes,
            }
          : emptyItem
      );
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || submitting || saving) return;
    setSubmitting(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      /* lỗi hiển thị ở VaultList */
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || saving;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Sửa mục" : "Thêm mật khẩu"}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Tên" required>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </Field>
        <Field label="URL">
          <input
            className="input-field"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com"
          />
        </Field>
        <Field label="Tên đăng nhập">
          <input
            className="input-field"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
        </Field>
        <Field label="Mật khẩu">
          <input
            className="input-field font-mono"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <Field label="Ghi chú">
          <textarea
            className="input-field min-h-[72px] resize-y"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <PasswordGenerator
          onUse={(password) => setForm({ ...form, password })}
        />
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Đang lưu..." : initial ? "Cập nhật" : "Thêm"}
        </button>
      </form>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-vault-muted">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}
