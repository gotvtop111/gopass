import { supabase } from "@/lib/supabaseClient";
import { encrypt } from "@/lib/crypto";
import type { PasswordItem, VaultRow } from "@/types";
import type { VaultImportRow } from "@/lib/importExport";

const DEFAULT_ENCRYPT_PARALLEL = 20;
const DEFAULT_INSERT_CHUNK = 80;

type InsertPayload = {
  user_id: string;
  encrypted_data: { ciphertext: string };
  iv: string;
};

type Prepared = { payload: InsertPayload; plain: VaultImportRow };

async function encryptInParallelBatches(
  rows: VaultImportRow[],
  userId: string,
  key: CryptoKey,
  batchSize: number,
  onEncryptProgress?: (done: number, total: number) => void
): Promise<{ prepared: Prepared[]; failedEncrypt: number }> {
  let failedEncrypt = 0;
  const prepared: Prepared[] = [];
  const total = rows.length;

  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const batch = await Promise.all(
      slice.map(async (row) => {
        try {
          const { ciphertext, iv } = await encrypt(
            {
              name: row.name,
              url: row.url,
              username: row.username,
              password: row.password,
              notes: row.notes,
            },
            key
          );
          return {
            payload: {
              user_id: userId,
              encrypted_data: { ciphertext },
              iv,
            },
            plain: row,
          } satisfies Prepared;
        } catch {
          return null;
        }
      })
    );
    for (const r of batch) {
      if (r) prepared.push(r);
      else failedEncrypt++;
    }
    onEncryptProgress?.(Math.min(i + slice.length, total), total);
  }

  return { prepared, failedEncrypt };
}

function rowsToPasswordItems(
  vaultRows: VaultRow[],
  plains: VaultImportRow[]
): PasswordItem[] {
  const out: PasswordItem[] = [];
  const n = Math.min(vaultRows.length, plains.length);
  for (let i = 0; i < n; i++) {
    const row = vaultRows[i];
    const plain = plains[i];
    out.push({
      id: row.id,
      ...plain,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
  return out;
}

/**
 * Import nhiều mục: mã hóa song song theo lô, insert Supabase theo chunk (nhanh hơn nhiều so với từng dòng).
 */
export async function insertVaultItemsBulk(
  userId: string,
  rows: VaultImportRow[],
  key: CryptoKey,
  options?: {
    encryptParallel?: number;
    insertChunk?: number;
    onProgress?: (phase: "encrypt" | "upload", done: number, total: number) => void;
  }
): Promise<{
  created: PasswordItem[];
  failedEncrypt: number;
  failedInsert: number;
}> {
  const encryptParallel = options?.encryptParallel ?? DEFAULT_ENCRYPT_PARALLEL;
  const insertChunk = options?.insertChunk ?? DEFAULT_INSERT_CHUNK;
  const onProgress = options?.onProgress;

  const { prepared, failedEncrypt } = await encryptInParallelBatches(
    rows,
    userId,
    key,
    encryptParallel,
    (done, total) => onProgress?.("encrypt", done, total)
  );

  const created: PasswordItem[] = [];
  let failedInsert = 0;

  for (let i = 0; i < prepared.length; i += insertChunk) {
    const chunk = prepared.slice(i, i + insertChunk);
    const payloads = chunk.map((c) => c.payload);
    const plains = chunk.map((c) => c.plain);

    const { data, error } = await supabase
      .from("vault")
      .insert(payloads)
      .select();

    if (!error && data && data.length === chunk.length) {
      created.push(...rowsToPasswordItems(data as VaultRow[], plains));
      onProgress?.("upload", created.length, prepared.length);
      continue;
    }

    for (let j = 0; j < chunk.length; j++) {
      const { data: one, error: e2 } = await supabase
        .from("vault")
        .insert(chunk[j].payload)
        .select()
        .single();
      if (e2 || !one) {
        failedInsert++;
        continue;
      }
      const row = one as VaultRow;
      created.push({
        id: row.id,
        ...plains[j],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
      onProgress?.("upload", created.length, prepared.length);
    }
  }

  return { created, failedEncrypt, failedInsert };
}
