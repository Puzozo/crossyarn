import { PremiumContent } from "@/components/premium/premium-content";

export const metadata = {
  title: "Premium — Crossyarn"
};

// Universal Premium is active until 2026-11-15. When billing goes live,
// replace this with a WayForPay checkout CTA and remove the banner.
export default function PremiumPage() {
  return <PremiumContent />;
}
