"use client";

import { ChangeEvent, useId, useState } from "react";

type Props = {
  accept?: string;
  required?: boolean;
  id?: string;
  chooseLabel: string;
  noFileLabel: string;
  onFileChange: (file: File | undefined) => void;
  className?: string;
  /** "dark" for the admin panel's dark surfaces. */
  tone?: "light" | "dark";
};

export function FileButton({ accept, required, id, chooseLabel, noFileLabel, onFileChange, className = "", tone = "light" }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [fileName, setFileName] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : null);
    onFileChange(file);
  }

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <input
        id={inputId}
        type="file"
        accept={accept}
        required={required}
        onChange={handleChange}
        className="peer sr-only"
      />
      <label
        htmlFor={inputId}
        className={
          tone === "dark"
            ? "cursor-pointer rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500"
            : "cursor-pointer rounded-xl border border-yarn-field-border bg-white px-4 py-2 text-sm font-medium text-yarn-charcoal hover:bg-yarn-terracotta-light/30 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-yarn-terracotta-strong peer-focus-visible:ring-offset-2"
        }
      >
        {chooseLabel}
      </label>
      <span className={`text-sm truncate max-w-[12rem] ${tone === "dark" ? "text-gray-400" : "text-yarn-warm-gray"}`}>
        {fileName ?? noFileLabel}
      </span>
    </div>
  );
}
