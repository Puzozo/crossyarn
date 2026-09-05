import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { LanguageProvider } from "@/lib/i18n/context";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Crossyarn",
  description: "Моделювання схем для в'язання",
  openGraph: {
    siteName: "Crossyarn",
    type: "website",
    locale: "uk_UA"
  }
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
