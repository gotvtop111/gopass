export interface PasswordItem {
  id: string;
  name: string;
  url: string;
  username: string;
  password: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
}

export interface ProfileRow {
  id: string;
  username?: string | null;
  login_email?: string | null;
  salt: string;
  encrypted_verification: string;
  verification_iv: string;
  passcode_salt_2?: string | null;
  passcode_verification_2?: string | null;
  passcode_iv_2?: string | null;
  password_salt_1?: string | null;
  password_secret_1?: string | null;
  password_iv_1?: string | null;
  password_salt_2?: string | null;
  password_secret_2?: string | null;
  password_iv_2?: string | null;
  created_at?: string;
}

export interface VaultRow {
  id: string;
  user_id: string;
  encrypted_data: { ciphertext: string };
  iv: string;
  created_at?: string;
  updated_at?: string;
}
