"use client";
import { useRef, useState } from "react";
import { MediaImage } from "@/components/content/media-image";
import { GalleryLightbox, type LightboxItem } from "@/components/content/gallery-lightbox";
import { Language } from "@/lib/i18n/translations";

type Props = { items: LightboxItem[]; lang: Language; className?: string; thumbClassName?: string };

export function GalleryGrid({ items, lang, className, thumbClassName }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function close() {
    const i = openIndex;
    setOpenIndex(null);
    if (i != null) triggerRefs.current[i]?.focus();
  }

  return (
    <>
      <div className={className ?? "grid grid-cols-2 gap-3 sm:grid-cols-3"}>
        {items.map((item, i) => (
          <button
            key={i}
            ref={(el) => { triggerRefs.current[i] = el; }}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={item.alt}
            className={thumbClassName ?? "relative aspect-square overflow-hidden rounded-lg border border-yarn-sand/40 bg-white cursor-pointer"}
          >
            <MediaImage assetId={item.assetId} alt={item.alt} sizes="33vw" className="absolute inset-0 h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {openIndex != null ? (
        <GalleryLightbox items={items} index={openIndex} onClose={close} onNavigate={setOpenIndex} lang={lang} />
      ) : null}
    </>
  );
}
