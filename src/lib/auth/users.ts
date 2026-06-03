import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function createUser(email: string, password: string, name?: string) {
  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name
    }
  });
}

export async function verifyUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}