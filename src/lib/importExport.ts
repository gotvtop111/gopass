import type { PasswordItem } from "@/types";
import type { WorkSheet } from "xlsx";

export type VaultImportRow = Omit<
  PasswordItem,
  "id" | "createdAt" | "updatedAt"
>;

export type ImportFormat = "google" | "generic" | "unknown";

const HEADER_ALIASES: Record<string, keyof VaultImportRow> = {
  name: "name",
  title: "name",
  site: "name",
  "tên": "name",
  url: "url",
  website: "url",
  uri: "url",
  link: "url",
  hostname: "url",
  username: "username",
  user: "username",
  login: "username",
  email: "username",
  "tài khoản": "username",
  password: "password",
  pass: "password",
  "mật khẩu": "password",
  note: "notes",
  notes: "notes",
  comment: "notes",
  "ghi chú": "notes",
};

export const GOOGLE_CSV_HEADERS = [
  "name",
  "url",
  "username",
  "password",
  "note",
] as const;

export const EXPORT_HEADERS = [
  "name",
  "url",
  "username",
  "password",
  "notes",
] as const;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/^\ufeff/, "");
}

function detectFormat(headers: string[]): ImportFormat {
  const set = new Set(headers.map(normalizeHeader));
  const googleCols = ["name", "url", "username", "password"];
  if (googleCols.every((c) => set.has(c))) {
    return "google";
  }
  if (set.has("name") || set.has("title") || set.has("url")) {
    return "generic";
  }
  return "unknown";
}

function rowToItem(
  raw: Record<string, unknown>,
  headers: string[]
): VaultImportRow | null {
  const mapped: Partial<VaultImportRow> = {
    name: "",
    url: "",
    username: "",
    password: "",
    notes: "",
  };

  for (const header of headers) {
    const key = HEADER_ALIASES[normalizeHeader(header)];
    if (!key) continue;
    const val = raw[header];
    if (val != null && String(val).trim() !== "") {
      mapped[key] = String(val).trim();
    }
  }

  if (!mapped.name && mapped.url) {
    try {
      mapped.name = new URL(
        mapped.url.startsWith("http") ? mapped.url : `https://${mapped.url}`
      ).hostname;
    } catch {
      mapped.name = mapped.url;
    }
  }

  if (!mapped.name && !mapped.username && !mapped.password) {
    return null;
  }

  return {
    name: mapped.name || "Imported",
    url: mapped.url || "",
    username: mapped.username || "",
    password: mapped.password || "",
    notes: mapped.notes || "",
  };
}

export async function parseImportFile(
  file: File
): Promise<{ rows: VaultImportRow[]; format: ImportFormat; fileName: string }> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  const workbook = XLSX.read(data, {
    type: "array",
    raw: false,
    codepage: 65001,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], format: "unknown", fileName: file.name };
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonRows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
  }) as Record<string, unknown>[];

  if (jsonRows.length === 0) {
    return { rows: [], format: "unknown", fileName: file.name };
  }

  const headers = Object.keys(jsonRows[0]);
  const format = detectFormat(headers);

  const rows: VaultImportRow[] = [];
  for (const raw of jsonRows) {
    const item = rowToItem(raw, headers);
    if (item) rows.push(item);
  }

  return { rows, format, fileName: file.name };
}

export function itemsToExportRows(
  items: PasswordItem[]
): Record<string, string>[] {
  return items.map((i) => ({
    name: i.name,
    url: i.url,
    username: i.username,
    password: i.password,
    notes: i.notes,
  }));
}

export function itemsToGoogleRows(
  items: PasswordItem[]
): Record<string, string>[] {
  return items.map((i) => ({
    name: i.name,
    url: i.url,
    username: i.username,
    password: i.password,
    note: i.notes,
  }));
}

export async function exportToCsv(
  items: PasswordItem[],
  googleFormat = false
): Promise<Blob> {
  const XLSX = await import("xlsx");
  const data = googleFormat ? itemsToGoogleRows(items) : itemsToExportRows(items);
  const sheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
}

export async function exportToExcel(items: PasswordItem[]): Promise<Blob> {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.json_to_sheet(itemsToExportRows(items));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Passwords");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function timestampForFilename(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}
