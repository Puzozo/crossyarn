"use client";
import { useState } from "react";
import { Language, translate } from "@/lib/i18n/translations";

type YouTubeFacadeProps = {
  videoId: string;
  title?: string;
  lang: Language;
};

export function YouTubeFacade({ videoId, title, lang }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="my-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title || "YouTube video"}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={translate(lang, "masterClass.video.play")}
            className="absolute inset-0 h-full w-full cursor-pointer bg-cover bg-center"
            style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
          >
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        className="mt-1 inline-block text-sm text-yarn-terracotta underline"
      >
        {translate(lang, "masterClass.video.watchOnYoutube")}
      </a>
    </div>
  );
}
