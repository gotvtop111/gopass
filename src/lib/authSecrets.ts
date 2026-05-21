import {
  deriveKey,
  encrypt,
  decrypt,
  generateSalt,
  createVerificationBlob,
  verifyPasscode,
} from "@/lib/crypto";
import type { EncryptedPayload } from "@/types";
import type { AuthSlot } from "@/lib/challenge";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Mật khẩu nội bộ Supabase — người dùng không biết, chỉ mở bằng 1 trong 2 mật khẩu truy cập */
export function generateInternalAuthPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const values = new Uint32Array(32);
  crypto.getRandomValues(values);
  let out = "";
  for (let i = 0; i < 32; i++) {
    out += chars[values[i] % chars.length];
  }
  return out;
}

export async function encryptAuthSecret(
  internalPassword: string,
  userPassword: string,
  salt?: Uint8Array
): Promise<{
  salt: string;
  ciphertext: string;
  iv: string;
}> {
  const s = salt ?? generateSalt();
  const key = await deriveKey(userPassword, s);
  const encrypted = await encrypt({ secret: internalPassword }, key);
  return {
    salt: toBase64(s),
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
  };
}

export async function decryptAuthSecret(
  userPassword: string,
  saltBase64: string,
  ciphertext: string,
  iv: string
): Promise<string | null> {
  try {
    const salt = fromBase64(saltBase64);
    const key = await deriveKey(userPassword, salt);
    const data = await decrypt<{ secret: string }>(ciphertext, iv, key);
    return data.secret ?? null;
  } catch {
    return null;
  }
}

export async function createPasscodeSlot(
  passcode: string,
  salt?: Uint8Array
): Promise<{
  salt: string;
  ciphertext: string;
  iv: string;
  key: CryptoKey;
}> {
  const s = salt ?? generateSalt();
  const { key, encrypted } = await createVerificationBlob(passcode, s);
  return {
    salt: toBase64(s),
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    key,
  };
}

export function loginEmailForUser(
  username: string,
  email?: string
): string {
  const trimmed = email?.trim();
  if (trimmed) return trimmed.toLowerCase();
  const safe = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  // example.net: TLD dự phòng RFC 2606 — Supabase thường từ chối @vault.local
  return `${safe || "user"}@example.net`;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function passwordsMustDiffer(a: string, b: string): boolean {
  return a.length > 0 && b.length > 0 && a !== b;
}

export { verifyPasscode };

export type PasscodeSlotFields = {
  salt: string;
  ciphertext: string;
  iv: string;
};

export function getPasscodeSlotFields(
  profile: {
    salt: string;
    encrypted_verification: string;
    verification_iv: string;
    passcode_salt_2?: string | null;
    passcode_verification_2?: string | null;
    passcode_iv_2?: string | null;
  },
  slot: AuthSlot
): PasscodeSlotFields {
  if (slot === 2 && profile.passcode_salt_2) {
    return {
      salt: profile.passcode_salt_2,
      ciphertext: profile.passcode_verification_2!,
      iv: profile.passcode_iv_2!,
    };
  }
  return {
    salt: profile.salt,
    ciphertext: profile.encrypted_verification,
    iv: profile.verification_iv,
  };
}

export function getPasswordSlotFields(
  profile: {
    password_salt_1?: string | null;
    password_secret_1?: string | null;
    password_iv_1?: string | null;
    password_salt_2?: string | null;
    password_secret_2?: string | null;
    password_iv_2?: string | null;
  },
  slot: AuthSlot
): { salt: string; ciphertext: string; iv: string } | null {
  if (slot === 1 && profile.password_salt_1) {
    return {
      salt: profile.password_salt_1,
      ciphertext: profile.password_secret_1!,
      iv: profile.password_iv_1!,
    };
  }
  if (slot === 2 && profile.password_salt_2) {
    return {
      salt: profile.password_salt_2,
      ciphertext: profile.password_secret_2!,
      iv: profile.password_iv_2!,
    };
  }
  return null;
}

export function profileHasDualPassword(profile: {
  password_salt_1?: string | null;
}): boolean {
  return Boolean(profile.password_salt_1);
}
