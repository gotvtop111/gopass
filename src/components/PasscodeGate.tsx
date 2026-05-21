"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  pickRandomSlot,
  setPasscodeChallengeSlot,
  clearPasscodeChallengeSlot,
} from "@/lib/challenge";
import { profileHasDualPassword } from "@/lib/authSecrets";
import { fetchProfile } from "@/lib/profileAuth";
import { unlockVaultAndLoadItems } from "@/lib/vaultService";
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

      const { key, items } = await unlockVaultAndLoadItems(
        userId,
        profile,
        passcode,
        slot
      );

      setProfile(profile);
      setEncryptionKey(key);
      setItems(items);
      clearPasscodeChallengeSlot();
      router.replace("/vault");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "PASSCODE_INVALID") {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          await fullLogout();
          return;
        }
        setError(
          `Passcode không đúng. Còn ${MAX_ATTEMPTS - next} lần — thử passcode còn lại (bỏ qua lớp ${pcSlot ?? "?"} hiển thị).`
        );
        return;
      }
      if (msg === "VAULT_DECRYPT_FAILED") {
        setError(
          "Passcode đúng nhưng không giải mã được dữ liệu vault. Thử passcode còn lại hoặc dùng đúng passcode lúc tạo mục đầu tiên."
        );
        return;
      }
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
        Nhập <strong className="text-white">một trong hai passcode</strong> của
        bạn. Gợi ý lớp {pcSlot ?? "—"} chỉ để thử thách khi sao chép — mở két chấp
        nhận passcode 1 hoặc 2.
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
