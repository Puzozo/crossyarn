"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

type Props = {
  isAuthenticated: boolean;
};

export function HomeContent({ isAuthenticated }: Props) {
  const { t } = useTranslation();

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      ),
      title: t("home.feature1Title"),
      desc: t("home.feature1Desc")
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      ),
      title: t("home.feature2Title"),
      desc: t("home.feature2Desc")
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
      title: t("home.feature3Title"),
      desc: t("home.feature3Desc")
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      title: t("home.feature4Title"),
      desc: t("home.feature4Desc")
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l2 2 4-4" />
        </svg>
      ),
      title: t("home.feature5Title"),
      desc: t("home.feature5Desc")
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: t("home.feature6Title"),
      desc: t("home.feature6Desc")
    }
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yarn-oatmeal via-yarn-cream to-yarn-terracotta-light p-8 sm:p-12 lg:p-16">
        {/* Decorative yarn pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="yarn-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 0c4 8 4 16 0 24s-4 16 0 24 4 16 0 24" fill="none" stroke="#3D2E22" strokeWidth="1" />
                <path d="M0 30c8 4 16 4 24 0s16-4 24 0" fill="none" stroke="#3D2E22" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#yarn-pattern)" />
          </svg>
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.3fr,0.7fr] items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-yarn-terracotta-light px-4 py-1.5 text-sm font-semibold text-yarn-terracotta">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="7" cy="7" r="3" />
              </svg>
              {t("home.badge")}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-yarn-charcoal">
              {t("home.titleLine1")}
              <br />
              <span className="text-yarn-terracotta">{t("home.titleLine2")}</span>
            </h1>
            <p className="max-w-xl text-lg text-yarn-warm-gray leading-relaxed">
              {t("home.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={isAuthenticated ? "/patterns" : "/sign-up"}>
                <Button size="lg">
                  {isAuthenticated ? t("home.ctaPatterns") : t("home.ctaStart")}
                </Button>
              </Link>
              <Link href="/patterns">
                <Button variant="secondary" size="lg">
                  {t("home.ctaLearnMore")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-64 h-64">
              <svg viewBox="0 0 200 200" className="w-full h-full text-yarn-terracotta opacity-20" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="100" cy="100" r="80" />
                <circle cx="100" cy="100" r="60" />
                <circle cx="100" cy="100" r="40" />
                <circle cx="100" cy="100" r="20" />
                <path d="M20 100 Q60 60 100 100 T180 100" />
                <path d="M100 20 Q60 60 100 100 T100 180" />
                <path d="M40 40 Q70 70 100 100 T160 160" />
                <path d="M160 40 Q130 70 100 100 T40 160" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-10">
        <div className="text-center space-y-3">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
            {t("home.featuresTitle")}
          </h2>
          <p className="text-yarn-warm-gray text-lg max-w-2xl mx-auto">
            {t("home.featuresSubtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yarn-terracotta-light text-yarn-terracotta mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="font-display text-lg font-semibold text-yarn-charcoal">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-yarn-warm-gray">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
