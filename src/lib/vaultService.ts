import { supabase } from "@/lib/supabaseClient";
import { decrypt, encrypt } from "@/lib/crypto";
import {
  profileHasVaultMaster,
  resolveVaultEncryptionKey,
} from "@/lib/authSecrets";
import type { AuthSlot } from "@/lib/challenge";
import type { PasswordItem, ProfileRow, VaultRow } from "@/types";

export { fetchProfile } from "@/lib/profileAuth";

/** Mở két + tải mục — tự thử passcode lớp 1/2 (tài khoản cũ có thể dùng khóa khác nhau) */
export async function unlockVaultAndLoadItems(
  userId: string,
  profile: ProfileRow,
  passcode: string,
  preferredSlot?: AuthSlot
): Promise<{ key: CryptoKey; items: PasswordItem[]; slot: AuthSlot }> {
  const slots: AuthSlot[] = preferredSlot
    ? [preferredSlot, preferredSlot === 1 ? 2 : 1]
    : [1, 2];

  let best: { key: CryptoKey; items: PasswordItem[]; slot: AuthSlot } | null =
    null;

  for (const trySlot of slots) {
    const { key, slot } = await resolveVaultEncryptionKey(
      profile,
      passcode,
      trySlot
    );
    if (!key || slot === null) continue;
    const items = await loadVaultItems(userId, key);
    if (profileHasVaultMaster(profile)) {
      return { key, items, slot };
    }
    if (!best || items.length > best.items.length) {
      best = { key, items, slot };
    }
  }

  if (!best) {
    throw new Error("PASSCODE_INVALID");
  }

  const { count } = await supabase
    .from("vault")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0 && best.items.length === 0) {
    throw new Error("VAULT_DECRYPT_FAILED");
  }

  return best;
}

export async function loadVaultItems(
  userId: string,
  key: CryptoKey
): Promise<PasswordItem[]> {
  const { data, error } = await supabase
    .from("vault")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as VaultRow[];
  const items: PasswordItem[] = [];

  for (const row of rows) {
    try {
      const decrypted = await decrypt<Omit<PasswordItem, "id">>(
        row.encrypted_data.ciphertext,
        row.iv,
        key
      );
      items.push({
        id: row.id,
        ...decrypted,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    } catch {
      // skip corrupted entries
    }
  }
  return items;
}

export async function insertVaultItem(
  userId: string,
  item: Omit<PasswordItem, "id" | "createdAt" | "updatedAt">,
  key: CryptoKey
): Promise<PasswordItem> {
  const { ciphertext, iv } = await encrypt(
    {
      name: item.name,
      url: item.url,
      username: item.username,
      password: item.password,
      notes: item.notes,
    },
    key
  );

  const { data, error } = await supabase
    .from("vault")
    .insert({
      user_id: userId,
      encrypted_data: { ciphertext },
      iv,
    })
    .select()
    .single();
  if (error) throw error;

  const row = data as VaultRow;
  return {
    id: row.id,
    ...item,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateVaultItem(
  item: PasswordItem,
  key: CryptoKey
): Promise<void> {
  const { ciphertext, iv } = await encrypt(
    {
      name: item.name,
      url: item.url,
      username: item.username,
      password: item.password,
      notes: item.notes,
    },
    key
  );

  const { error } = await supabase
    .from("vault")
    .update({
      encrypted_data: { ciphertext },
      iv,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);
  if (error) throw error;
}

export async function deleteVaultItem(id: string): Promise<void> {
  const { error } = await supabase.from("vault").delete().eq("id", id);
  if (error) throw error;
}
