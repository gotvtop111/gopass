"use client";

import { useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-x-0 bottom-0 top-auto z-50 mx-auto mb-[max(0.75rem,env(safe-area-inset-bottom,0px))] mt-[max(0.75rem,env(safe-area-inset-top,0px))] flex max-h-[min(92dvh,calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1.5rem))] w-[min(100vw-1rem,28rem)] flex-col overflow-hidden rounded-2xl border border-vault-border bg-vault-surface p-0 text-vault-muted shadow-2xl backdrop:bg-black/60 sm:inset-0 sm:bottom-auto sm:top-0 sm:my-auto sm:max-h-[min(90dvh,92vh)]"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-vault-border px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="pr-2 text-base font-semibold text-white sm:text-lg">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-lg p-1.5 text-vault-muted hover:bg-white/10 hover:text-white"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
        {children}
      </div>
    </dialog>
  );
}
