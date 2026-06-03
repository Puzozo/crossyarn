import { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-yarn-sand bg-white px-4 py-3 text-sm text-yarn-charcoal placeholder:text-yarn-warm-gray outline-none transition-all duration-200 focus:border-yarn-terracotta focus:bg-yarn-oatmeal/30 focus:ring-2 focus:ring-yarn-terracotta-light ${className}`}
    />
  );
}
