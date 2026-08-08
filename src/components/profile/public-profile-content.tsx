"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

type PublicPattern = {
  id: string;
  title: string;
  width: number;
  height: number;
  updatedAtMs: number;
};

type Props = {
  profile: {
    name: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    website: string | null;
  };
  patterns: PublicPattern[];
};

function websiteLabel(url: string) {
  try {
    const u = new URL(url);
    return u.host + (u.pathname !== "/" ? u.pathname : "");
  } catch {
    return url;
  }
}

export function PublicProfileContent({ profile, patterns }: Props) {
  const { t } = useTranslation();
  const displayName = profile.name?.trim() || profile.username;

  return (
    <section className="space-y-8">
      <nav className="text-sm text-yarn-warm-gray">
        <Link href="/" className="hover:text-yarn-charcoal transition-colors">
          ← {t("publicProfile.backToSite")}
        </Link>
      </nav>

      {/* Profile header */}
      <header className="rounded-3xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
        <div className="flex items-start gap-4 sm:gap-5">
          <div
            aria-hidden
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-yarn-terracotta/15 text-2xl font-bold text-yarn-terracotta"
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-yarn-charcoal break-words [overflow-wrap:anywhere]">
              {displayName}
            </h1>
            <p className="text-sm text-yarn-warm-gray">@{profile.username}</p>
          </div>
        </div>

        {profile.bio ? (
          <p className="mt-5 max-w-2xl text-sm text-yarn-charcoal leading-relaxed whitespace-pre-line">
            {profile.bio}
          </p>
        ) : null}

        {(profile.location || profile.website) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-yarn-warm-gray">
            {profile.location ? (
              <span className="inline-flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M8 1.5c-2.5 0-4.5 2-4.5 4.5C3.5 9.5 8 14.5 8 14.5s4.5-5 4.5-8.5c0-2.5-2-4.5-4.5-4.5z" />
                  <circle cx="8" cy="6" r="1.5" />
                </svg>
                {profile.location}
              </span>
            ) : null}
            {profile.website ? (
              <a
                href={profile.website}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M6.5 9.5l3-3M7 4l.8-.8a2.5 2.5 0 013.5 3.5l-.8.8M9 12l-.8.8a2.5 2.5 0 01-3.5-3.5l.8-.8" strokeLinecap="round" />
                </svg>
                {websiteLabel(profile.website)}
              </a>
            ) : null}
          </div>
        )}
      </header>

      {/* Public patterns */}
      <div>
        <h2 className="font-display text-xl font-bold text-yarn-charcoal">
          {t("publicProfile.patternsTitle")}
        </h2>
        {patterns.length === 0 ? (
          <div className="mt-4 rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-10 text-center text-sm text-yarn-warm-gray">
            {t("publicProfile.noPatterns")}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {patterns.map((pattern) => (
              <Link
                key={pattern.id}
                href={`/p/${pattern.id}`}
                className="group rounded-2xl bg-white/70 border border-yarn-sand/50 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="relative aspect-square border-b border-yarn-sand/40 bg-white">
                  <Image
                    src={`/api/patterns/${pattern.id}/thumbnail?v=${pattern.updatedAtMs}`}
                    alt={pattern.title}
                    fill
                    unoptimized
                    loading="lazy"
                    className="object-contain p-3"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors break-words [overflow-wrap:anywhere] line-clamp-2">
                    {pattern.title}
                  </h3>
                  <p className="mt-1 text-sm text-yarn-warm-gray">
                    {pattern.width} × {pattern.height}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
