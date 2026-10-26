"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

const SOCIAL_LINKS = [
  {
    href: "https://t.me/crossyarn",
    label: "Telegram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
    ),
  },
  {
    href: "https://instagram.com/crossyarn",
    label: "Instagram",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    href: "https://facebook.com/crossyarn",
    label: "Facebook",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="print:hidden border-t border-yarn-sand/50 bg-white/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* About */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="font-display text-lg font-semibold text-yarn-charcoal">Crossyarn</h3>
            <p className="text-sm leading-relaxed text-yarn-warm-gray">
              {t("footer.about")}
            </p>
          </div>

          {/* Links */}
          <nav className="space-y-3 text-center sm:text-left" aria-label={t("footer.linksLabel")}>
            <Link
              href="/explore"
              className="block text-sm text-yarn-warm-gray hover:text-yarn-terracotta transition-colors"
            >
              {t("footer.explore")}
            </Link>
            <Link
              href="/terms"
              className="block text-sm text-yarn-warm-gray hover:text-yarn-terracotta transition-colors"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/privacy"
              className="block text-sm text-yarn-warm-gray hover:text-yarn-terracotta transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </nav>

          {/* Social */}
          <div className="space-y-3 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-yarn-charcoal">{t("footer.follow")}</h3>
            <div className="flex items-center justify-center gap-3 sm:justify-start">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-yarn-warm-gray hover:text-yarn-terracotta hover:bg-yarn-oatmeal/50 transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-yarn-sand/40 pt-4 text-center text-xs text-yarn-warm-gray/70">
          <p>© {year} Crossyarn. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
