"use client";

import { useRef, useState } from "react";
import { useVaultStore } from "@/store/useVaultStore";
import { insertVaultItem } from "@/lib/vaultService";
import {
  parseImportFile,
  exportToCsv,
  exportToExcel,
  downloadBlob,
  timestampForFilename,
  type ImportFormat,
  type VaultImportRow,
} from "@/lib/importExport";
import { Modal } from "@/components/Modal";

interface ImportExportPanelProps {
  userId: string;
  disabled?: boolean;
}

const FORMAT_LABELS: Record<ImportFormat, string> = {
  google: "Google Chrome / Password Manager",
  generic: "CSV / Excel chung",
  unknown: "Không nhận diện (map cột tự động)",
};

export function ImportExportPanel({
  userId,
  disabled,
}: ImportExportPanelProps) {
  const items = useVaultStore((s) => s.items);
  const encryptionKey = useVaultStore((s) => s.encryptionKey);
  const addItem = useVaultStore((s) => s.addItem);

  const fileRef = useRef<HTMLInputElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingRows, setPendingRows] = useState<VaultImportRow[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<ImportFormat>("unknown");
  const [sourceFile, setSourceFile] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleExportCsv = async (googleFormat: boolean) => {
    if (!items.length) {
      setError("Vault trống, không có gì để xuất.");
      return;
    }
    setError("");
    const blob = await exportToCsv(items, googleFormat);
    const suffix = googleFormat ? "google" : "vault";
    downloadBlob(blob, `passwords_${suffix}_${timestampForFilename()}.csv`);
    setMessage(
      googleFormat
        ? "Đã xuất CSV định dạng Google (có thể import lại Chrome)."
        : "Đã xuất CSV."
    );
  };

  const handleExportExcel = async () => {
    if (!items.length) {
      setError("Vault trống, không có gì để xuất.");
      return;
    }
    setError("");
    const blob = await exportToExcel(items);
    downloadBlob(blob, `passwords_${timestampForFilename()}.xlsx`);
    setMessage("Đã xuất file Excel (.xlsx).");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !encryptionKey) return;

    setError("");
    setMessage("");

    try {
      const { rows, format, fileName } = await parseImportFile(file);
      if (rows.length === 0) {
        setError("Không tìm thấy dòng hợp lệ trong file.");
        return;
      }
      setPendingRows(rows);
      setDetectedFormat(format);
      setSourceFile(fileName);
      setPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đọc được file");
    }
  };

  const handleConfirmImport = async () => {
    if (!encryptionKey || pendingRows.length === 0) return;

    setBusy(true);
    setError("");
    let imported = 0;
    let failed = 0;

    try {
      for (const row of pendingRows) {
        try {
          const created = await insertVaultItem(userId, row, encryptionKey);
          addItem(created);
          imported++;
        } catch {
          failed++;
        }
      }
      setPreviewOpen(false);
      setPendingRows([]);
      setMessage(
        `Import xong: ${imported} mục thành công` +
          (failed ? `, ${failed} mục lỗi.` : ".")
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-vault-border bg-vault-surface/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Import / Export</h2>
        <p className="text-xs text-vault-muted">
          CSV Google Chrome · CSV/Excel chung
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={disabled || !items.length}
          onClick={() => handleExportCsv(false)}
        >
          Xuất CSV
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={disabled || !items.length}
          onClick={() => handleExportCsv(true)}
          title="Định dạng name,url,username,password,note — tương thích Google"
        >
          Xuất CSV (Google)
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={disabled || !items.length}
          onClick={handleExportExcel}
        >
          Xuất Excel
        </button>
        <button
          type="button"
          className="btn-primary text-xs"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          Nhập CSV / Excel
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {message && (
        <p className="mt-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <details className="mt-3 text-xs text-vault-muted">
        <summary className="cursor-pointer hover:text-white">
          Hướng dẫn import từ Google
        </summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>
            Chrome:{" "}
            <code className="text-vault-accent">
              chrome://settings/passwords
            </code>{" "}
            → ⋮ → Xuất mật khẩu → lưu file .csv
          </li>
          <li>
            Hoặc Google Takeout: chọn Passwords → tải passwords.csv
          </li>
          <li>Mở vault → Nhập CSV / Excel → xác nhận preview</li>
          <li>Cột chuẩn Google: name, url, username, password, note</li>
        </ol>
      </details>

      <Modal
        open={previewOpen}
        onClose={() => !busy && setPreviewOpen(false)}
        title="Xác nhận import"
      >
        <p className="mb-2 text-sm text-vault-muted">
          File: <span className="text-white">{sourceFile}</span>
        </p>
        <p className="mb-2 text-sm text-vault-muted">
          Định dạng: {FORMAT_LABELS[detectedFormat]}
        </p>
        <p className="mb-4 text-sm font-medium text-white">
          {pendingRows.length} mục sẽ được thêm (mã hóa trước khi lưu Supabase).
        </p>

        <PreviewTable rows={pendingRows.slice(0, 8)} total={pendingRows.length} />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={busy}
            onClick={handleConfirmImport}
          >
            {busy ? "Đang import..." : "Import vào vault"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => setPreviewOpen(false)}
          >
            Hủy
          </button>
        </div>
      </Modal>
    </div>
  );
}

function PreviewTable({
  rows,
  total,
}: {
  rows: VaultImportRow[];
  total: number;
}) {
  return (
    <div className="max-h-48 overflow-auto rounded-lg border border-vault-border">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-vault-bg">
          <tr className="text-vault-muted">
            <th className="px-2 py-1.5">Tên</th>
            <th className="px-2 py-1.5">URL</th>
            <th className="px-2 py-1.5">User</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-vault-border/50">
              <td className="max-w-[100px] truncate px-2 py-1.5 text-white">
                {r.name}
              </td>
              <td className="max-w-[120px] truncate px-2 py-1.5">
                {r.url || "—"}
              </td>
              <td className="max-w-[100px] truncate px-2 py-1.5">
                {r.username || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {total > rows.length && (
        <p className="border-t border-vault-border px-2 py-1.5 text-xs text-vault-muted">
          … và {total - rows.length} mục khác
        </p>
      )}
    </div>
  );
}
