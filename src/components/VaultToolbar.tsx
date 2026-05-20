"use client";

import type { VaultSortKey, VaultViewMode } from "@/lib/vaultUtils";

interface VaultToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  siteFilter: string;
  onSiteFilterChange: (v: string) => void;
  viewMode: VaultViewMode;
  onViewModeChange: (v: VaultViewMode) => void;
  sortKey: VaultSortKey;
  onSortChange: (v: VaultSortKey) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  onSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onAdd: () => void;
  disabled?: boolean;
}

export function VaultToolbar({
  search,
  onSearchChange,
  siteFilter,
  onSiteFilterChange,
  viewMode,
  onViewModeChange,
  sortKey,
  onSortChange,
  totalCount,
  filteredCount,
  selectedCount,
  onSelectAllFiltered,
  onClearSelection,
  onBulkDelete,
  onAdd,
  disabled,
}: VaultToolbarProps) {
  return (
    <section
      className="card space-y-4"
      aria-labelledby="vault-toolbar-title"
    >
      <div className="flex flex-col gap-1 border-b border-vault-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="vault-toolbar-title"
            className="text-base font-semibold text-white"
          >
            Tìm kiếm, lọc &amp; thao tác
          </h2>
          <p className="text-xs text-vault-muted">
            {filteredCount === totalCount
              ? `${totalCount} mục trong vault`
              : `Hiển thị ${filteredCount} / ${totalCount} mục`}
            {selectedCount > 0 ? ` · Đã chọn ${selectedCount}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary shrink-0 text-sm"
          onClick={onAdd}
          disabled={disabled}
        >
          + Thêm tài khoản
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-vault-muted">
            Tìm kiếm (tên, URL, username, ghi chú)
          </label>
          <input
            type="search"
            className="input-field"
            placeholder="Gõ để lọc nhanh — hỗ trợ dữ liệu lớn"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-vault-muted">
            Lọc theo website (domain)
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="vd: google.com"
            value={siteFilter}
            onChange={(e) => onSiteFilterChange(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-vault-muted">
            Sắp xếp
          </label>
          <select
            className="input-field"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as VaultSortKey)}
          >
            <option value="updated">Mới cập nhật</option>
            <option value="name">Tên (A–Z)</option>
            <option value="host">Website (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-vault-border pt-3">
        <span className="mr-1 text-xs text-vault-muted">Hiển thị:</span>
        <button
          type="button"
          className={
            viewMode === "flat"
              ? "btn-primary text-xs"
              : "btn-ghost text-xs"
          }
          onClick={() => onViewModeChange("flat")}
        >
          Danh sách phẳng
        </button>
        <button
          type="button"
          className={
            viewMode === "grouped"
              ? "btn-primary text-xs"
              : "btn-ghost text-xs"
          }
          onClick={() => onViewModeChange("grouped")}
        >
          Theo website
        </button>
        <span className="mx-2 hidden h-4 w-px bg-vault-border sm:inline" />
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={disabled || filteredCount === 0}
          onClick={onSelectAllFiltered}
        >
          Chọn tất cả (đang lọc)
        </button>
        <button
          type="button"
          className="btn-ghost text-xs"
          disabled={selectedCount === 0}
          onClick={onClearSelection}
        >
          Bỏ chọn
        </button>
        <button
          type="button"
          className="btn-ghost border-red-500/40 text-xs text-red-400 hover:border-red-500/60"
          disabled={disabled || selectedCount === 0}
          onClick={onBulkDelete}
        >
          Xóa đã chọn ({selectedCount})
        </button>
      </div>
    </section>
  );
}
