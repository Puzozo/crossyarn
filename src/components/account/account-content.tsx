"use client";

import { useTranslation } from "@/lib/i18n/context";
import { SymbolLibraryManager } from "@/components/account/symbol-library-manager";
import { PatternSymbol } from "@/lib/patterns/model";

type Props = {
  email: string;
  userId: string;
  symbols: PatternSymbol[];
};

export function AccountContent({ email, userId, symbols }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Account info */}
      <section className="max-w-2xl rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
        <h1 className="font-display text-2xl font-bold text-yarn-charcoal">{t("account.title")}</h1>
        <dl className="mt-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <dt className="text-sm text-yarn-warm-gray min-w-32">{t("account.email")}</dt>
            <dd className="font-medium text-yarn-charcoal">{email}</dd>
          </div>
          <div className="border-t border-yarn-sand/40" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <dt className="text-sm text-yarn-warm-gray min-w-32">{t("account.userId")}</dt>
            <dd className="font-mono text-sm text-yarn-charcoal">{userId}</dd>
          </div>
        </dl>
      </section>

      {/* Symbol library */}
      <SymbolLibraryManager initialSymbols={symbols} />
    </div>
  );
}
