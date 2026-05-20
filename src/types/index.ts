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
  salt: string;
  encrypted_verification: string;
  verification_iv: string;
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
