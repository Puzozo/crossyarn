import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "crossyarn_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
};

// Tokens issued before sessionVersion existed have no `sv`; treat them as 0 so
// the rollout doesn't sign everyone out.
type SessionClaims = SessionPayload & { sv?: number };

export async function createSession(payload: SessionPayload) {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true }
  });
  const claims: SessionClaims = { ...payload, sv: user?.sessionVersion ?? 0 };
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    const verified = await jwtVerify<SessionClaims>(token, getSecret());
    // Reject sessions of users blocked after the token was issued (token lives 7d),
    // and sessions issued before the last password reset.
    const user = await db.user.findUnique({
      where: { id: verified.payload.userId },
      select: { isDisabled: true, sessionVersion: true }
    });
    if (!user || user.isDisabled) return null;
    if ((verified.payload.sv ?? 0) !== user.sessionVersion) return null;
    return { userId: verified.payload.userId, email: verified.payload.email };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}