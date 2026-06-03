import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yarn-cream disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary:
    "bg-yarn-terracotta text-white hover:bg-yarn-terracotta-hover focus:ring-yarn-terracotta shadow-warm-sm hover:shadow-warm rounded-full",
  secondary:
    "bg-yarn-oatmeal text-yarn-charcoal border border-yarn-sand hover:bg-yarn-sand focus:ring-yarn-sand rounded-full",
  ghost:
    "bg-transparent text-yarn-warm-gray hover:text-yarn-charcoal hover:bg-yarn-oatmeal focus:ring-yarn-sand rounded-xl",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500 rounded-full"
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs min-h-8",
  md: "px-5 py-2.5 text-sm min-h-11",
  lg: "px-7 py-3 text-base min-h-12"
};

export function Button({ className = "", variant = "primary", size = "md", ...props }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
