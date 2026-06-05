import "./globals.css";
import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { LanguageProvider } from "@/lib/i18n/context";
import { ConditionalLayout } from "@/components/layout/conditional-layout";

export const metadata = {
  title: "Crossyarn",
  description: "Моделювання схем для в'язання"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className="font-body relative">
        <LanguageProvider>
          <ConditionalLayout header={<Header />}>
            {children}
          </ConditionalLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
