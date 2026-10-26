"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog(props: Props) {
  const { open, title, message, confirmLabel, cancelLabel, danger, busy, onConfirm, onCancel } = props;
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  // Portal to <body>: callers sit inside cards with transform/overflow-hidden,
  // which would otherwise clip and re-anchor the fixed overlay.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-yarn-charcoal/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-warm space-y-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg font-bold text-yarn-charcoal">
          {title}
        </h2>
        {message ? (
          <p className="text-sm text-yarn-warm-gray">{message}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yarn-cream disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer bg-yarn-oatmeal text-yarn-charcoal border border-yarn-sand hover:bg-yarn-sand focus:ring-yarn-sand rounded-full px-5 py-2.5 text-sm min-h-11"
          >
            {cancelLabel}
          </button>
          <Button variant={danger ? "danger" : "primary"} size="md" disabled={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
