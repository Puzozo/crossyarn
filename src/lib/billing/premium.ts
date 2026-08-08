import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * Days of grace after `premiumUntil` during which access is still granted.
 * Aligns with the WayForPay regular-payment retry window (a failed renewal
 * shouldn't immediately lock the user out). Keep in sync with the billing plan.
 */
const GRACE_DAYS = 3;

export type PremiumFields = {
  plan: string;
  premiumUntil: Date | null;
};

/**
 * Single source of truth for "is this user Premium right now".
 * Pure function over User billing fields — testable without a DB.
 *
 * Semantics:
 * - plan must be "PREMIUM"
 * - premiumUntil === null  → open-ended grant (manual admin grant before WayForPay exists)
 * - premiumUntil in future (+ grace) → active subscription
 */
export function isPremium(user: PremiumFields): boolean {
  if (user.plan !== "PREMIUM") return false;
  if (user.premiumUntil === null) return true;
  const graceMs = GRACE_DAYS * 24 * 60 * 60 * 1000;
  return user.premiumUntil.getTime() + graceMs > Date.now();
}

/** Thrown by requirePremium when the session is valid but the user is not Premium. */
export class PremiumRequiredError extends Error {
  constructor() {
    super("PREMIUM_REQUIRED");
    this.name = "PremiumRequiredError";
  }
}

/**
 * Reads the current user's plan fresh from the DB (the session JWT does not carry
 * the plan). Throws "UNAUTHORIZED" via requireSession if not logged in, or
 * PremiumRequiredError if logged in but not Premium.
 */
export async function requirePremium() {
  const session = await requireSession();
  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { plan: true, premiumUntil: true }
  });
  if (!user || !isPremium(user)) {
    throw new PremiumRequiredError();
  }
  return session;
}

/** Convenience for server components / pages that need the boolean without throwing. */
export async function getIsPremium(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, premiumUntil: true }
  });
  return user ? isPremium(user) : false;
}
