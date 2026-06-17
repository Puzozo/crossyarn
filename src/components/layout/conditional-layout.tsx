"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";

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
    <div className="relative z-10 flex min-h-screen flex-col">
      <div className="print:hidden">{header}</div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">
        {children}
      </main>
      <Footer />
    </div>
  );
}
