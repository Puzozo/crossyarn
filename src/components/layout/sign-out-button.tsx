"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function SignOutButton() {
  const router = useRouter();
  const { t } = useTranslation();

  async function handleClick() {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.refresh();
    router.push("/sign-in");
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick}>
      {t("nav.signOut")}
    </Button>
  );
}
