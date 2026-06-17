import { LegalPage } from "@/components/legal/legal-page";
import { privacyDoc } from "@/lib/legal/content";

export const metadata = {
  title: "Політика конфіденційності — Crossyarn",
  description: "Як Crossyarn збирає, використовує та захищає ваші персональні дані."
};

export default function PrivacyPage() {
  return <LegalPage doc={privacyDoc} />;
}
