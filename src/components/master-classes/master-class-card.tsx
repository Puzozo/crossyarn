import Link from "next/link";
import { MediaImage } from "@/components/content/media-image";
import { LevelBadge } from "@/components/master-classes/level-badge";
import { Language, translate } from "@/lib/i18n/translations";

type Props = {
  slug: string;
  title: string;
  coverAssetId: string | null;
  coverAlt: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMinutes: number | null;
  itemLang: "uk" | "en";
  lang: Language; // UI language for the duration label
};

export function MasterClassCard({ slug, title, coverAssetId, coverAlt, difficulty, durationMinutes, itemLang, lang }: Props) {
  return (
    <Link href={`/master-classes/${slug}`} className="group block rounded-2xl bg-white/70 border border-yarn-sand/50 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className="relative aspect-[4/3] border-b border-yarn-sand/40 bg-yarn-oatmeal/40">
        {coverAssetId ? (
          <MediaImage assetId={coverAssetId} alt={coverAlt} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute left-2 top-2 z-10"><LevelBadge difficulty={difficulty} lang={lang} /></div>
      </div>
      <div className="p-4 space-y-1">
        <h2 className="font-display text-base font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors line-clamp-2">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-yarn-warm-gray">
          {durationMinutes != null ? <span>⏱ {translate(lang, "masterClass.duration", { minutes: durationMinutes })}</span> : null}
          <span className="uppercase">{itemLang}</span>
        </div>
      </div>
    </Link>
  );
}
