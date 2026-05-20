import type { EncryptedPayload } from "@/types";

const VERIFICATION_PLAINTEXT = "ok";
const AES_GCM_IV_LENGTH = 12;

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

/** Tạo ArrayBuffer tách biệt — tương thích TS strict + Node 22 trên CI. */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}

function toCryptoU8(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(toArrayBuffer(bytes));
}

export function generateSalt(): Uint8Array {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
}

async function importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(rawKey),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** PBKDF2-SHA256 (Web Crypto) — tương thích static export / Cloudflare Pages */
const PBKDF2_ITERATIONS = 600_000;

export async function deriveKey(
  passcode: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passcode),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return importAesKey(new Uint8Array(bits));
}

export async function encrypt<T>(
  plainObj: T,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = new Uint8Array(AES_GCM_IV_LENGTH);
  crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(JSON.stringify(plainObj));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toCryptoU8(iv) },
    key,
    encoded
  );
  return {
    ciphertext: toBase64(new Uint8Array(cipherBuffer)),
    iv: toBase64(iv),
  };
}

export async function decrypt<T>(
  ciphertextBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<T> {
  const ciphertext = toCryptoU8(fromBase64(ciphertextBase64));
  const iv = toCryptoU8(fromBase64(ivBase64));
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  const text = new TextDecoder().decode(plainBuffer);
  return JSON.parse(text) as T;
}

export async function createVerificationBlob(
  passcode: string,
  salt: Uint8Array
): Promise<{ key: CryptoKey; encrypted: EncryptedPayload }> {
  const key = await deriveKey(passcode, salt);
  const encrypted = await encrypt(VERIFICATION_PLAINTEXT, key);
  return { key, encrypted };
}

export async function verifyPasscode(
  passcode: string,
  saltBase64: string,
  ciphertext: string,
  iv: string
): Promise<{ valid: boolean; key: CryptoKey | null }> {
  try {
    const salt = fromBase64(saltBase64);
    const key = await deriveKey(passcode, salt);
    const result = await decrypt<string>(ciphertext, iv, key);
    if (result === VERIFICATION_PLAINTEXT) {
      return { valid: true, key };
    }
    return { valid: false, key: null };
  } catch {
    return { valid: false, key: null };
  }
}

export function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useNumbers: boolean,
  useSymbols: boolean
): string {
  let charset = "";
  if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
  if (useNumbers) charset += "0123456789";
  if (useSymbols) charset += "!@#$%^&*()-_=+[]{}|;:,.<>?";
  if (!charset) charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

export async function copyWithTimeout(
  text: string,
  clearAfterMs = 30000
): Promise<void> {
  await navigator.clipboard.writeText(text);
  if (clearAfterMs > 0) {
    window.setTimeout(() => {
      navigator.clipboard.writeText("").catch(() => {});
    }, clearAfterMs);
  }
}
