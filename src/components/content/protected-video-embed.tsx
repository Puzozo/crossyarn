import Link from "next/link";
import { Language, translate } from "@/lib/i18n/translations";
import { signEmbedUrl } from "@/lib/content/bunny";

// Server component: the signed Bunny URL is built here (never on the client), so a
// guest's HTML carries neither the GUID nor the token — only a placeholder.
type ProtectedVideoEmbedProps = {
  videoId: string;
  title?: string;
  lang: Language;
  signedIn: boolean;
  canView: boolean;
};

function Placeholder({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div
      role="note"
      className="my-6 rounded-lg border-2 border-dashed border-yarn-sand bg-yarn-cream/40 p-6 text-center"
    >
      <div className="mb-2 text-3xl" aria-hidden="true">
        🔒
      </div>
      <p className="text-sm text-yarn-warm-gray">{message}</p>
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  );
}

export function ProtectedVideoEmbed({ videoId, title, lang, signedIn, canView }: ProtectedVideoEmbedProps) {
  if (!signedIn) {
    return (
      <Placeholder
        message={translate(lang, "masterClass.protectedVideo.signIn")}
        cta={
          <Link
            href="/sign-in"
            className="inline-block rounded-lg bg-yarn-terracotta px-4 py-2 text-sm font-medium text-white hover:bg-yarn-terracotta-hover transition-colors"
          >
            {translate(lang, "masterClass.protectedVideo.signInCta")}
          </Link>
        }
      />
    );
  }

  if (!canView) {
    return <Placeholder message={translate(lang, "masterClass.protectedVideo.locked")} />;
  }

  const src = signEmbedUrl(videoId);
  if (!src) {
    return <Placeholder message={translate(lang, "masterClass.protectedVideo.unavailable")} />;
  }

  return (
    <figure className="my-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-yarn-sand/50 bg-black">
        <iframe
          src={src}
          title={title ?? translate(lang, "masterClass.protectedVideo.title")}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {title ? <figcaption className="mt-2 text-sm text-yarn-warm-gray">{title}</figcaption> : null}
    </figure>
  );
}
