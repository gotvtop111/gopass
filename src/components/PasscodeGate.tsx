"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createVerificationBlob, verifyPasscode } from "@/lib/crypto";
import {
  createProfile,
  fetchProfile,
  loadVaultItems,
} from "@/lib/vaultService";
import { useVaultStore } from "@/store/useVaultStore";

const MAX_ATTEMPTS = 5;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

interface PasscodeGateProps {
  userId: string;
}

export function PasscodeGate({ userId }: PasscodeGateProps) {
  const router = useRouter();
  const setEncryptionKey = useVaultStore((s) => s.setEncryptionKey);
  const setItems = useVaultStore((s) => s.setItems);

  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    fetchProfile(userId)
      .then((p) => setIsNewUser(!p))
      .catch(() => setError("Không tải được hồ sơ"));
  }, [userId]);

  const forceLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = await fetchProfile(userId);
      if (!profile) {
        setError("Không tìm thấy hồ sơ. Vui lòng đăng ký lại passcode.");
        return;
      }

      const { valid, key } = await verifyPasscode(
        passcode,
        profile.salt,
        profile.encrypted_verification,
        profile.verification_iv
      );

      if (!valid || !key) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          await forceLogout();
          return;
        }
        setError(`Passcode sai. Còn ${MAX_ATTEMPTS - next} lần thử.`);
        return;
      }

      setEncryptionKey(key);
      const items = await loadVaultItems(userId, key);
      setItems(items);
      router.replace("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được két");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passcode.length < 6) {
      setError("Passcode tối thiểu 6 ký tự.");
      return;
    }
    if (passcode !== confirm) {
      setError("Passcode xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const { key, encrypted } = await createVerificationBlob(passcode, salt);

      await createProfile(
        userId,
        toBase64(salt),
        encrypted.ciphertext,
        encrypted.iv
      );

      setEncryptionKey(key);
      setItems([]);
      router.replace("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được passcode");
    } finally {
      setLoading(false);
    }
  };

  if (isNewUser === null) {
    return (
      <p className="text-center text-vault-muted">Đang tải...</p>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-2 text-center text-xl font-semibold text-white">
        {isNewUser ? "Tạo passcode két" : "Mở khóa két"}
      </h2>
      <p className="mb-6 text-center text-sm text-vault-muted">
        {isNewUser
          ? "Passcode này mã hóa toàn bộ mật khẩu. Chúng tôi không lưu passcode trên server."
          : "Nhập passcode để giải mã dữ liệu vault."}
      </p>

      <form
        onSubmit={isNewUser ? handleSetup : handleUnlock}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm text-vault-muted">Passcode</label>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="input-field"
            placeholder="••••••"
            autoComplete="off"
          />
        </div>
        {isNewUser && (
          <div>
            <label className="mb-1 block text-sm text-vault-muted">
              Xác nhận passcode
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input-field"
              placeholder="••••••"
              autoComplete="off"
            />
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? "Đang xử lý..."
            : isNewUser
              ? "Tạo két"
              : "Mở khóa"}
        </button>
      </form>
    </div>
  );
}
