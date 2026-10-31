import { Language, translate } from "@/lib/i18n/translations";

type LockedContentCtaProps = { lang: Language };

export function LockedContentCta({ lang }: LockedContentCtaProps) {
  return (
    <div
      role="note"
      className="my-6 rounded-lg border-2 border-dashed border-yarn-sand bg-yarn-cream/40 p-6 text-center"
    >
      <div className="mb-2 text-3xl" aria-hidden="true">🔒</div>
      <p className="font-semibold text-yarn-charcoal">{translate(lang, "masterClass.locked.title")}</p>
      <p className="mt-1 text-sm text-yarn-warm-gray">{translate(lang, "masterClass.locked.description")}</p>
    </div>
  );
}
