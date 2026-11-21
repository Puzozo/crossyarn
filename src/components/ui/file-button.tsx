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
};

export function FileButton({ accept, required, id, chooseLabel, noFileLabel, onFileChange, className = "" }: Props) {
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
        className="sr-only"
      />
      <label
        htmlFor={inputId}
        className="cursor-pointer rounded-xl border border-yarn-sand bg-white px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
      >
        {chooseLabel}
      </label>
      <span className="text-sm text-yarn-warm-gray truncate max-w-[12rem]">
        {fileName ?? noFileLabel}
      </span>
    </div>
  );
}
