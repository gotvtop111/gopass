export type AuthSlot = 1 | 2;

const PW_SLOT_KEY = "vault_auth_pw_slot";
const PC_SLOT_KEY = "vault_auth_pc_slot";

export function pickRandomSlot(): AuthSlot {
  return Math.random() < 0.5 ? 1 : 2;
}

export function setPasswordChallengeSlot(slot: AuthSlot): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(PW_SLOT_KEY, String(slot));
  }
}

export function getPasswordChallengeSlot(): AuthSlot | null {
  if (typeof sessionStorage === "undefined") return null;
  const v = sessionStorage.getItem(PW_SLOT_KEY);
  return v === "1" ? 1 : v === "2" ? 2 : null;
}

export function clearPasswordChallengeSlot(): void {
  sessionStorage?.removeItem(PW_SLOT_KEY);
}

export function setPasscodeChallengeSlot(slot: AuthSlot): void {
  sessionStorage?.setItem(PC_SLOT_KEY, String(slot));
}

export function getPasscodeChallengeSlot(): AuthSlot | null {
  const v = sessionStorage?.getItem(PC_SLOT_KEY);
  return v === "1" ? 1 : v === "2" ? 2 : null;
}

export function clearPasscodeChallengeSlot(): void {
  sessionStorage?.removeItem(PC_SLOT_KEY);
}

export function clearAllChallengeSlots(): void {
  clearPasswordChallengeSlot();
  clearPasscodeChallengeSlot();
}
