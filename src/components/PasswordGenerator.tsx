"use client";

import { useState } from "react";
import { generatePassword } from "@/lib/crypto";

interface PasswordGeneratorProps {
  onUse: (password: string) => void;
}

export function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generated, setGenerated] = useState("");

  const handleGenerate = () => {
    const pwd = generatePassword(
      length,
      useUpper,
      useLower,
      useNumbers,
      useSymbols
    );
    setGenerated(pwd);
  };

  return (
    <div className="mt-4 rounded-xl border border-vault-border bg-vault-bg/50 p-4">
      <p className="mb-3 text-sm font-medium text-white">Tạo mật khẩu</p>
      <label className="mb-2 block text-xs text-vault-muted">
        Độ dài: {length}
        <input
          type="range"
          min={8}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="mt-1 w-full accent-vault-accent"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Checkbox label="Chữ hoa" checked={useUpper} onChange={setUseUpper} />
        <Checkbox label="Chữ thường" checked={useLower} onChange={setUseLower} />
        <Checkbox
          label="Số"
          checked={useNumbers}
          onChange={setUseNumbers}
        />
        <Checkbox
          label="Ký tự đặc biệt"
          checked={useSymbols}
          onChange={setUseSymbols}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          className="flex-1 rounded-lg bg-vault-accent/20 px-3 py-2 text-sm font-medium text-vault-accent hover:bg-vault-accent/30"
        >
          Sinh mật khẩu
        </button>
        {generated && (
          <button
            type="button"
            onClick={() => onUse(generated)}
            className="rounded-lg bg-vault-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Dùng
          </button>
        )}
      </div>
      {generated && (
        <p className="mt-2 break-all rounded-lg bg-black/30 p-2 font-mono text-xs text-emerald-400">
          {generated}
        </p>
      )}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-vault-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded accent-vault-accent"
      />
      {label}
    </label>
  );
}
