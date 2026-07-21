import { eq, or } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { users } from "@drizzle/schema";

export type RegistrationInput = {
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

export async function findUsersByEmailOrPhone(email: string, phone: string) {
  const db = getDb();

  return db
    .select()
    .from(users)
    .where(or(eq(users.email, normalizeEmail(email)), eq(users.phone, normalizePhone(phone))));
}

export async function createProfileForAuthUser(authUserId: string, input: RegistrationInput) {
  const db = getDb();

  const [createdUser] = await db
    .insert(users)
    .values({
      authUserId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: normalizeEmail(input.email),
      phone: normalizePhone(input.phone),
      birthDate: input.birthDate,
    })
    .returning();

  return createdUser;
}

export async function findActiveUserByAuthUserId(authUserId: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.authUserId, authUserId)).limit(1);

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, normalizeEmail(email))).limit(1);
  return user ?? null;
}
