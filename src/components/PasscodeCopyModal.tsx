"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { copyWithTimeout } from "@/lib/crypto";
import { pickRandomSlot } from "@/lib/challenge";
import {
  getPasscodeSlotFields,
  verifyPasscode,
} from "@/lib/authSecrets";
import type { ProfileRow } from "@/types";

interface PasscodeCopyModalProps {
  open: boolean;
  onClose: () => void;
  profile: ProfileRow;
  passwordToCopy: string;
  itemLabel: string;
}

export function PasscodeCopyModal({
  open,
  onClose,
  profile,
  passwordToCopy,
  itemLabel,
}: PasscodeCopyModalProps) {
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slotHint] = useState(() => pickRandomSlot());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fields = getPasscodeSlotFields(profile, slotHint);
      const { valid } = await verifyPasscode(
        passcode,
        fields.salt,
        fields.ciphertext,
        fields.iv
      );
      if (!valid) {
        setError(
          "Passcode không đúng. Hệ thống yêu cầu một trong hai passcode — thử passcode còn lại."
        );
        return;
      }
      await copyWithTimeout(passwordToCopy, 30000);
      setPasscode("");
      onClose();
    } catch {
      setError("Không sao chép được.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Xác nhận passcode để sao chép">
      <p className="mb-3 text-sm text-vault-muted">
        Sao chép mật khẩu cho <span className="text-white">{itemLabel}</span>.
        Nhập <strong className="text-white">một trong hai passcode</strong> của
        bạn (mỗi lần copy hệ thống kiểm tra ngẫu nhiên một lớp).
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm text-vault-muted">Passcode</label>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="input-field"
            autoComplete="off"
            autoFocus
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Đang xử lý..." : "Xác nhận & sao chép"}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </Modal>
  );
}
