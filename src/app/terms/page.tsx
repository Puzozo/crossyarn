import { LegalPage } from "@/components/legal/legal-page";
import { termsDoc } from "@/lib/legal/content";

export const metadata = {
  title: "Умови використання — Crossyarn",
  description: "Умови використання сервісу Crossyarn для створення схем в'язання."
};

export default function TermsPage() {
  return <LegalPage doc={termsDoc} />;
}
