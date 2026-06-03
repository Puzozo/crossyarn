"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { MobileNav } from "@/components/layout/mobile-nav";

type Props = {
  isAuthenticated: boolean;
};

export function HeaderClient({ isAuthenticated }: Props) {
  const { t, lang, setLang } = useTranslation();

  const navLinks = [
    { href: "/patterns", label: t("nav.patterns") },
    { href: "/account", label: t("nav.account") }
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-yarn-sand/60 bg-yarn-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-yarn-terracotta transition-transform group-hover:rotate-12">
            <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
            <path d="M8 14c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 14c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="font-display text-xl font-bold text-yarn-charcoal">
            Crossyarn
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded-xl text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Language switcher */}
          <div className="flex items-center gap-0.5 ml-2 rounded-lg border border-yarn-sand/60 p-0.5">
            <button
              type="button"
              onClick={() => setLang("uk")}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                lang === "uk"
                  ? "bg-yarn-terracotta text-white"
                  : "text-yarn-warm-gray hover:text-yarn-charcoal"
              }`}
            >
              UA
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                lang === "en"
                  ? "bg-yarn-terracotta text-white"
                  : "text-yarn-warm-gray hover:text-yarn-charcoal"
              }`}
            >
              EN
            </button>
          </div>

          <div className="ml-3 pl-3 border-l border-yarn-sand flex items-center gap-2">
            {isAuthenticated ? (
              <SignOutButton />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2 rounded-full text-sm font-semibold bg-yarn-terracotta text-white hover:bg-yarn-terracotta-hover transition-colors shadow-warm-sm"
                >
                  {t("nav.signUp")}
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile navigation */}
        <MobileNav
          links={navLinks}
          authSection={
            isAuthenticated ? (
              <SignOutButton />
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/sign-in"
                  className="px-4 py-3 rounded-xl text-center text-sm font-medium text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
                >
                  {t("nav.signIn")}
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-3 rounded-full text-center text-sm font-semibold bg-yarn-terracotta text-white hover:bg-yarn-terracotta-hover transition-colors"
                >
                  {t("nav.signUp")}
                </Link>
              </div>
            )
          }
        />
      </div>
    </header>
  );
}
