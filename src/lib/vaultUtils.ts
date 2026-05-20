import type { PasswordItem } from "@/types";

export type VaultSortKey = "updated" | "name" | "host";
export type VaultViewMode = "flat" | "grouped";

/** Chuẩn hóa hostname từ URL hoặc chuỗi rỗng */
export function itemHostname(item: PasswordItem): string {
  const raw = (item.url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function itemDisplayHost(item: PasswordItem): string {
  const h = itemHostname(item);
  return h || "(Không có URL)";
}

export function filterByQuery(
  items: PasswordItem[],
  query: string
): PasswordItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.url.toLowerCase().includes(q) ||
      i.username.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q))
  );
}

export function filterBySiteSubstring(
  items: PasswordItem[],
  siteSubstring: string
): PasswordItem[] {
  const s = siteSubstring.trim().toLowerCase();
  if (!s) return items;
  return items.filter((i) => itemHostname(i).includes(s));
}

export function sortItems(
  items: PasswordItem[],
  sort: VaultSortKey
): PasswordItem[] {
  const copy = [...items];
  copy.sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
      case "host": {
        const ha = itemDisplayHost(a);
        const hb = itemDisplayHost(b);
        const c = ha.localeCompare(hb, "vi", { sensitivity: "base" });
        if (c !== 0) return c;
        return a.username.localeCompare(b.username, "vi", {
          sensitivity: "base",
        });
      }
      case "updated":
      default: {
        const ta = a.updatedAt || a.createdAt || "";
        const tb = b.updatedAt || b.createdAt || "";
        if (ta !== tb) return tb.localeCompare(ta);
        return a.name.localeCompare(b.name, "vi", { sensitivity: "base" });
      }
    }
  });
  return copy;
}

export interface SiteGroup {
  host: string;
  displayHost: string;
  items: PasswordItem[];
}

/** Nhóm theo hostname; trong mỗi nhóm sắp theo username */
export function groupByHost(items: PasswordItem[]): SiteGroup[] {
  const map = new Map<string, PasswordItem[]>();
  for (const item of items) {
    const key = itemHostname(item) || "__no_url__";
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  const groups: SiteGroup[] = [];
  for (const [host, groupItems] of map) {
    const displayHost =
      host === "__no_url__" ? "(Không có URL)" : host.toLowerCase();
    const sorted = [...groupItems].sort((a, b) =>
      a.username.localeCompare(b.username, "vi", { sensitivity: "base" })
    );
    groups.push({ host, displayHost, items: sorted });
  }
  groups.sort((a, b) =>
    a.displayHost.localeCompare(b.displayHost, "vi", { sensitivity: "base" })
  );
  return groups;
}
