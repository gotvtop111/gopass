import { supabase } from "@/lib/supabaseClient";
import type { ProfileRow } from "@/types";
import type { AuthSlot } from "@/lib/challenge";
import {
  decryptAuthSecret,
  getPasswordSlotFields,
  normalizeUsername,
} from "@/lib/authSecrets";

export async function resolveUsername(
  username: string
): Promise<{ login_email: string; user_id: string } | null> {
  const { data, error } = await supabase.rpc("resolve_username", {
    p_username: normalizeUsername(username),
  });
  if (error || !data?.length) return null;
  const row = data[0] as { login_email: string; user_id: string };
  return row;
}

export async function fetchPasswordSlotForLogin(
  username: string,
  slot: AuthSlot
): Promise<{
  login_email: string;
  salt: string;
  ciphertext: string;
  iv: string;
} | null> {
  const { data, error } = await supabase.rpc("get_password_slot", {
    p_username: normalizeUsername(username),
    p_slot: slot,
  });
  if (error || !data?.length) return null;
  return data[0] as {
    login_email: string;
    salt: string;
    ciphertext: string;
    iv: string;
  };
}

export async function verifyAccessPassword(
  profile: ProfileRow,
  slot: AuthSlot,
  enteredPassword: string
): Promise<string | null> {
  const fields = getPasswordSlotFields(profile, slot);
  if (!fields) return null;
  return decryptAuthSecret(
    enteredPassword,
    fields.salt,
    fields.ciphertext,
    fields.iv
  );
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export interface CreateProfilePayload {
  id: string;
  username: string;
  login_email: string;
  passcode1: { salt: string; ciphertext: string; iv: string };
  passcode2: { salt: string; ciphertext: string; iv: string };
  password1: { salt: string; ciphertext: string; iv: string };
  password2: { salt: string; ciphertext: string; iv: string };
  vaultMaster1: { ciphertext: string; iv: string };
  vaultMaster2: { ciphertext: string; iv: string };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_username_available", {
    p_username: normalizeUsername(username),
  });
  if (error) return true;
  return Boolean(data);
}

/** Ghi profile qua RPC — hoạt động cả khi chưa có session (xác nhận email bật) */
export async function createFullProfile(
  payload: CreateProfilePayload
): Promise<void> {
  const { error } = await supabase.rpc("register_profile", {
    p_user_id: payload.id,
    p_username: payload.username,
    p_login_email: payload.login_email,
    p_salt: payload.passcode1.salt,
    p_encrypted_verification: payload.passcode1.ciphertext,
    p_verification_iv: payload.passcode1.iv,
    p_passcode_salt_2: payload.passcode2.salt,
    p_passcode_verification_2: payload.passcode2.ciphertext,
    p_passcode_iv_2: payload.passcode2.iv,
    p_password_salt_1: payload.password1.salt,
    p_password_secret_1: payload.password1.ciphertext,
    p_password_iv_1: payload.password1.iv,
    p_password_salt_2: payload.password2.salt,
    p_password_secret_2: payload.password2.ciphertext,
    p_password_iv_2: payload.password2.iv,
    p_vault_master_1: payload.vaultMaster1.ciphertext,
    p_vault_master_iv_1: payload.vaultMaster1.iv,
    p_vault_master_2: payload.vaultMaster2.ciphertext,
    p_vault_master_iv_2: payload.vaultMaster2.iv,
  });

  if (error) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: payload.id,
      username: payload.username,
      login_email: payload.login_email,
      salt: payload.passcode1.salt,
      encrypted_verification: payload.passcode1.ciphertext,
      verification_iv: payload.passcode1.iv,
      passcode_salt_2: payload.passcode2.salt,
      passcode_verification_2: payload.passcode2.ciphertext,
      passcode_iv_2: payload.passcode2.iv,
      password_salt_1: payload.password1.salt,
      password_secret_1: payload.password1.ciphertext,
      password_iv_1: payload.password1.iv,
      password_salt_2: payload.password2.salt,
      password_secret_2: payload.password2.ciphertext,
      password_iv_2: payload.password2.iv,
      vault_master_1: payload.vaultMaster1.ciphertext,
      vault_master_iv_1: payload.vaultMaster1.iv,
      vault_master_2: payload.vaultMaster2.ciphertext,
      vault_master_iv_2: payload.vaultMaster2.iv,
    });
    if (insertError) throw error;
  }
}
