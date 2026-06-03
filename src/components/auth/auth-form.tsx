"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";

type Mode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "")
    };

    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? t("auth.genericError"));
      setPending(false);
      return;
    }

    router.push("/patterns");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-8 shadow-warm">
      <div className="space-y-2">
        <h1 className="font-display text-2xl font-bold text-yarn-charcoal">
          {mode === "sign-in" ? t("auth.signInTitle") : t("auth.signUpTitle")}
        </h1>
        <p className="text-sm text-yarn-warm-gray">
          {mode === "sign-in" ? t("auth.signInDesc") : t("auth.signUpDesc")}
        </p>
      </div>

      <div className="space-y-4">
        {mode === "sign-up" ? (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("auth.name")}</label>
            <Input name="name" placeholder={t("auth.namePlaceholder")} />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-yarn-charcoal">{t("auth.email")}</label>
          <Input type="email" name="email" placeholder="your@email.com" required />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-yarn-charcoal">{t("auth.password")}</label>
          <Input type="password" name="password" placeholder={t("auth.passwordPlaceholder")} minLength={8} required />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("auth.pending") : mode === "sign-in" ? t("auth.submitSignIn") : t("auth.submitSignUp")}
      </Button>
    </form>
  );
}
