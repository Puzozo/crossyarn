"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function ConditionalLayout({
  header,
  children
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="relative z-10">
      <div className="print:hidden">{header}</div>
      <main className="mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">
        {children}
      </main>
    </div>
  );
}
