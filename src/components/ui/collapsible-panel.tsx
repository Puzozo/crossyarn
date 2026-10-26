"use client";

import { useId, useState } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsiblePanel({ title, defaultOpen = true, forceOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = open || forceOpen;
  const id = useId();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={id}
        className="flex w-full items-center justify-between py-1 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden
          className={`text-yarn-warm-gray transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5l3 3 3-3" />
        </svg>
      </button>
      <div id={id} hidden={!isOpen}>
        {children}
      </div>
    </div>
  );
}