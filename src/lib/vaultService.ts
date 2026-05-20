import { supabase } from "@/lib/supabaseClient";
import { decrypt, encrypt } from "@/lib/crypto";
import type { PasswordItem, VaultRow } from "@/types";

export { fetchProfile } from "@/lib/profileAuth";

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
