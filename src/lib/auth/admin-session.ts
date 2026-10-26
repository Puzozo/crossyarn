import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE_NAME = "crossyarn-admin";

function getSecret() {
  const secret = process.env.ADMIN_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret + "_admin");
}

export type AdminSessionPayload = {
  userId: string;
  email: string;
};

// `sv` mirrors User.sessionVersion (see session.ts); absent on older tokens = 0.
type AdminSessionClaims = AdminSessionPayload & { sv?: number };

export async function createAdminSession(payload: AdminSessionPayload) {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true }
  });
  const claims: AdminSessionClaims = { ...payload, sv: user?.sessionVersion ?? 0 };
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const verified = await jwtVerify<AdminSessionClaims>(token, getSecret());
    // Re-validate against the DB so a demoted/blocked admin loses access immediately
    // instead of keeping it until the 8h token expires.
    const user = await db.user.findUnique({
      where: { id: verified.payload.userId },
      select: { isAdmin: true, isDisabled: true, sessionVersion: true }
    });
    if (!user || !user.isAdmin || user.isDisabled) return null;
    if ((verified.payload.sv ?? 0) !== user.sessionVersion) return null;
    return { userId: verified.payload.userId, email: verified.payload.email };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
