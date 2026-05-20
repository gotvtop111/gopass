import { create } from "zustand";
import type { PasswordItem, ProfileRow } from "@/types";

interface VaultState {
  encryptionKey: CryptoKey | null;
  items: PasswordItem[];
  profile: ProfileRow | null;
  isUnlocked: boolean;
  setEncryptionKey: (key: CryptoKey | null) => void;
  setProfile: (profile: ProfileRow | null) => void;
  setItems: (items: PasswordItem[]) => void;
  addItem: (item: PasswordItem) => void;
  addItems: (items: PasswordItem[]) => void;
  updateItem: (item: PasswordItem) => void;
  removeItem: (id: string) => void;
  clearVault: () => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  encryptionKey: null,
  items: [],
  profile: null,
  isUnlocked: false,
  setEncryptionKey: (key) =>
    set({ encryptionKey: key, isUnlocked: key !== null }),
  setProfile: (profile) => set({ profile }),
  setItems: (items) => set({ items }),
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
  addItems: (newItems) =>
    set((s) => ({ items: [...newItems, ...s.items] })),
  updateItem: (item) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === item.id ? item : i)),
    })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  clearVault: () =>
    set({
      encryptionKey: null,
      items: [],
      profile: null,
      isUnlocked: false,
    }),
}));
