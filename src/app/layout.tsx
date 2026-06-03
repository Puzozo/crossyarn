import "./globals.css";
import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { LanguageProvider } from "@/lib/i18n/context";

export const metadata = {
  title: "Crossyarn",
  description: "Моделювання схем для в'язання"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="font-body relative">
        <LanguageProvider>
          <div className="relative z-10">
            <div className="print:hidden">
              <Header />
            </div>
            <main className="mx-auto min-h-[calc(100vh-73px)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
