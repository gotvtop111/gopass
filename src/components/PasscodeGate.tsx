"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  pickRandomSlot,
  setPasscodeChallengeSlot,
  clearPasscodeChallengeSlot,
} from "@/lib/challenge";
import {
  createPasscodeSlot,
  getPasscodeSlotFields,
  profileHasDualPassword,
  verifyPasscode,
} from "@/lib/authSecrets";
import { fetchProfile } from "@/lib/profileAuth";
import { loadVaultItems } from "@/lib/vaultService";
import { useVaultStore } from "@/store/useVaultStore";
import { useFullLogout } from "@/hooks/useFullLogout";

const MAX_ATTEMPTS = 5;

interface PasscodeGateProps {
  userId: string;
}

export function PasscodeGate({ userId }: PasscodeGateProps) {
  const router = useRouter();
  const fullLogout = useFullLogout();
  const setEncryptionKey = useVaultStore((s) => s.setEncryptionKey);
  const setItems = useVaultStore((s) => s.setItems);
  const setProfile = useVaultStore((s) => s.setProfile);

  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [pcSlot, setPcSlot] = useState<1 | 2 | null>(null);

  useEffect(() => {
    fetchProfile(userId)
      .then((p) => {
        if (!p) {
          setIsNewUser(true);
          return;
        }
        setIsNewUser(!profileHasDualPassword(p));
        if (profileHasDualPassword(p)) {
          const slot = pickRandomSlot();
          setPcSlot(slot);
          setPasscodeChallengeSlot(slot);
        }
      })
      .catch(() => setError("Không tải được hồ sơ"));
  }, [userId]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = await fetchProfile(userId);
      if (!profile) {
        setError("Không tìm thấy hồ sơ.");
        return;
      }

      const slot =
        pcSlot ??
        (profile.passcode_salt_2 ? pickRandomSlot() : (1 as const));
      const fields = getPasscodeSlotFields(profile, slot);

      const { valid, key } = await verifyPasscode(
        passcode,
        fields.salt,
        fields.ciphertext,
        fields.iv
      );

      if (!valid || !key) {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          await fullLogout();
          return;
        }
        setError(
          `Passcode sai (lớp ${slot}). Còn ${MAX_ATTEMPTS - next} lần. Thử passcode còn lại.`
        );
        return;
      }

      setProfile(profile);
      setEncryptionKey(key);
      const items = await loadVaultItems(userId, key);
      setItems(items);
      clearPasscodeChallengeSlot();
      router.replace("/vault");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được két");
    } finally {
      setLoading(false);
    }
  };

  if (isNewUser === null) {
    return <p className="text-center text-vault-muted">Đang tải...</p>;
  }

  if (isNewUser) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-sm text-vault-muted">
          Tài khoản chưa có cấu hình két mới. Vui lòng đăng ký tài khoản mới (username +
          2 mật khẩu + 2 passcode) hoặc liên hệ quản trị.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={() => fullLogout()}>
          Về đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-2 text-center text-xl font-semibold text-white">
        Mở khóa két
      </h2>
      <p className="mb-6 text-center text-sm text-vault-muted">
        Nhập một trong hai passcode. Lần này hệ thống kiểm tra{" "}
        {pcSlot ? (
          <span className="text-amber-400/90">lớp {pcSlot}</span>
        ) : (
          "ngẫu nhiên"
        )}
        .
      </p>

      <form onSubmit={handleUnlock} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm text-vault-muted">Passcode</label>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="input-field"
            autoComplete="off"
          />
        </div>
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Đang mở..." : "Mở khóa"}
        </button>
        <button
          type="button"
          className="btn-ghost w-full text-sm"
          onClick={() => {
            const slot = pickRandomSlot();
            setPcSlot(slot);
            setPasscodeChallengeSlot(slot);
            setPasscode("");
            setError("");
          }}
        >
          Đổi thử thách lớp passcode
        </button>
      </form>
    </div>
  );
}
