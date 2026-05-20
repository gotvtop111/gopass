import { create } from "zustand";
import type { PasswordItem } from "@/types";

interface VaultState {
  encryptionKey: CryptoKey | null;
  items: PasswordItem[];
  isUnlocked: boolean;
  setEncryptionKey: (key: CryptoKey | null) => void;
  setItems: (items: PasswordItem[]) => void;
  addItem: (item: PasswordItem) => void;
  updateItem: (item: PasswordItem) => void;
  removeItem: (id: string) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  encryptionKey: null,
  items: [],
  isUnlocked: false,
  setEncryptionKey: (key) =>
    set({ encryptionKey: key, isUnlocked: key !== null }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  updateItem: (item) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === item.id ? item : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clearVault: () =>
    set({ encryptionKey: null, items: [], isUnlocked: false }),
}));
