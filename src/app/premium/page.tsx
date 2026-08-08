import Link from "next/link";

export const metadata = {
  title: "Premium — Crossyarn"
};

// Placeholder until WayForPay subscription is implemented (see the billing plan).
// The image-import feature gates on Premium; this page is where the upsell CTA lands.
export default function PremiumPage() {
  return (
    <section className="mx-auto max-w-lg space-y-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yarn-terracotta-light text-yarn-terracotta">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8z" strokeLinejoin="round" />
        </svg>
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-yarn-charcoal">Crossyarn Premium</h1>
        <p className="text-yarn-warm-gray">
          AI-імпорт схем із зображень, без реклами та безліміт схем. Підписка скоро.
        </p>
      </div>
      <ul className="mx-auto inline-block space-y-2 text-left text-sm text-yarn-charcoal">
        <li>• AI-розпізнавання схем із зображень</li>
        <li>• Без реклами</li>
        <li>• Безліміт схем і кастомних позначок</li>
      </ul>
      <div>
        <Link
          href="/patterns"
          className="inline-block rounded-full bg-yarn-oatmeal border border-yarn-sand px-5 py-2.5 text-sm font-semibold text-yarn-charcoal hover:bg-yarn-sand transition-colors"
        >
          ← До моїх схем
        </Link>
      </div>
    </section>
  );
}
