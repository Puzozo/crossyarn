import Link from "next/link";
import { Language, translate } from "@/lib/i18n/translations";

type Props = {
  slug: string;
  title: string;
  videoId: string | null;
  durationMinutes: number | null;
  itemLang: "uk" | "en";
  lang: Language; // UI language for the duration label
};

export function VideoLessonCard({ slug, title, videoId, durationMinutes, itemLang, lang }: Props) {
  return (
    <Link href={`/video-lessons/${slug}`} className="group block rounded-2xl bg-white/70 border border-yarn-sand/50 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
      <div className="relative aspect-[4/3] border-b border-yarn-sand/40 bg-yarn-oatmeal/40">
        {videoId ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </>
        ) : null}
        <div className="absolute left-2 top-2 z-10">
          <span className="inline-block rounded-full bg-yarn-terracotta-strong text-white text-xs font-medium px-2 py-0.5">
            {translate(lang, "videoLessons.card.free")}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-1">
        <h2 className="font-display text-base font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta-text transition-colors line-clamp-2">{title}</h2>
        <div className="flex items-center gap-2 text-xs text-yarn-warm-gray">
          {durationMinutes != null ? <span>⏱ {translate(lang, "masterClass.duration", { minutes: durationMinutes })}</span> : null}
          <span className="uppercase">{itemLang}</span>
        </div>
      </div>
    </Link>
  );
}
