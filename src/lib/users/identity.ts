import { and, eq, or } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { users } from "@drizzle/schema";

export type CheckinIdentityInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

export async function findUserByEmailOrPhone(email: string, phone: string) {
  const db = getDb();

  return db
    .select()
    .from(users)
    .where(or(eq(users.email, normalizeEmail(email)), eq(users.phone, normalizePhone(phone))));
}

export async function resolveCheckinUser(input: CheckinIdentityInput) {
  const db = getDb();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  const matches = await findUserByEmailOrPhone(email, phone);
  const emailMatch = matches.find((candidate) => candidate.email === email);
  const phoneMatch = matches.find((candidate) => candidate.phone === phone);

  if (emailMatch && phoneMatch && emailMatch.id === phoneMatch.id) {
    if (!emailMatch.isActive) {
      return { ok: false as const, reason: "inactive" as const };
    }

    return { ok: true as const, user: emailMatch, created: false };
  }

  if (emailMatch || phoneMatch) {
    return { ok: false as const, reason: "mismatch" as const };
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone,
      birthDate: input.birthDate,
    })
    .returning();

  return { ok: true as const, user: createdUser, created: true };
}

export async function findActiveUserByEmailAndPhone(email: string, phone: string) {
  const db = getDb();

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, normalizeEmail(email)), eq(users.phone, normalizePhone(phone)), eq(users.isActive, true)))
    .limit(1);

  return user ?? null;
}
