import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { SESSION_COOKIE_NAME } from "@/lib/constants/session";
import { getDb } from "@/lib/db/client";
import { users } from "@drizzle/schema";

export async function createSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  return user ?? null;
}
