"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";

type NavLink = {
  href: string;
  label: string;
};

type Props = {
  links: NavLink[];
  authSection: React.ReactNode;
};

export function MobileNav({ links, authSection }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { t, lang, setLang } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative z-50 flex h-10 w-10 items-center justify-center rounded-xl text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
        aria-label={open ? t("mobileNav.closeMenu") : t("mobileNav.openMenu")}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* Portal: Backdrop + Drawer rendered outside header stacking context */}
      {mounted && createPortal(
        <>
          {/* Backdrop */}
          {open && (
            <div
              className="fixed inset-0 z-[9998] bg-yarn-charcoal/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
          )}

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 z-[9999] h-full w-72 bg-yarn-cream shadow-2xl transform transition-transform duration-300 ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full pt-6 pb-8 px-6">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="self-end mb-6 flex h-10 w-10 items-center justify-center rounded-xl text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
                aria-label={t("mobileNav.closeMenu")}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>

              {/* Language switcher */}
              <div className="flex items-center gap-0.5 mb-4 self-start rounded-lg border border-yarn-sand/60 p-0.5">
                <button
                  type="button"
                  onClick={() => setLang("uk")}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
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
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    lang === "en"
                      ? "bg-yarn-terracotta text-white"
                      : "text-yarn-warm-gray hover:text-yarn-charcoal"
                  }`}
                >
                  EN
                </button>
              </div>

              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-yarn-terracotta-light text-yarn-terracotta"
                        : "text-yarn-charcoal hover:bg-yarn-oatmeal"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto pt-6 border-t border-yarn-sand">
                {authSection}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
