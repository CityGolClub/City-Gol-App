import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { eq, sql } from "drizzle-orm";

import { createSupabaseAdminClient } from "@/lib/storage/supabase";
import { getDb } from "@/lib/db/client";
import { bookings, fields, systemSettings, teamMembers, teams, users } from "@drizzle/schema";

const ids = {
  admin: "11111111-1111-1111-1111-111111111111",
  userJuan: "22222222-2222-2222-2222-222222222222",
  userSofia: "33333333-3333-3333-3333-333333333333",
  fieldOne: "44444444-4444-4444-4444-444444444444",
  fieldTwo: "55555555-5555-5555-5555-555555555555",
  settings: "66666666-6666-6666-6666-666666666666",
  teamOne: "77777777-7777-7777-7777-777777777777",
  bookingPrev: "88888888-8888-8888-8888-888888888888",
  bookingCurrent: "99999999-9999-9999-9999-999999999999",
  bookingNext: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
} as const;

const seedAccounts = [
  {
    appId: ids.admin,
    firstName: "Alex",
    lastName: "Admin",
    email: "admin@citygol.app",
    phone: "+5491199999999",
    birthDate: "1990-08-15",
    role: "admin" as const,
    password: "CityGol123!",
    scoreTotal: 0,
    scoreMonthly: 0,
    scoreVigente: 0,
  },
  {
    appId: ids.userJuan,
    firstName: "Juan",
    lastName: "Perez",
    email: "juan@example.com",
    phone: "+5491123456789",
    birthDate: "1995-04-20",
    role: "user" as const,
    password: "CityGol123!",
    scoreTotal: 22,
    scoreMonthly: 6,
    scoreVigente: 14,
  },
  {
    appId: ids.userSofia,
    firstName: "Sofia",
    lastName: "Lopez",
    email: "sofia@example.com",
    phone: "+5491165432100",
    birthDate: "1998-09-10",
    role: "user" as const,
    password: "CityGol123!",
    scoreTotal: 5,
    scoreMonthly: 2,
    scoreVigente: 5,
  },
];

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

async function deleteExistingAuthUsers(emails: string[]) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw error;
  }

  const emailSet = new Set(emails.map((email) => email.toLowerCase()));
  const matches = data.users.filter((user) => user.email && emailSet.has(user.email.toLowerCase()));

  for (const match of matches) {
    await admin.auth.admin.deleteUser(match.id);
  }
}

async function createAuthUsers() {
  const admin = createSupabaseAdminClient();
  await deleteExistingAuthUsers(seedAccounts.map((account) => account.email));

  const authIdsByEmail = new Map<string, string>();

  for (const account of seedAccounts) {
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw error ?? new Error(`Could not create auth user for ${account.email}`);
    }

    authIdsByEmail.set(account.email, data.user.id);
  }

  return authIdsByEmail;
}

async function main() {
  const db = getDb();
  const authIdsByEmail = await createAuthUsers();
  const currentStart = new Date();
  currentStart.setHours(20, 0, 0, 0);

  const currentEnd = addHours(currentStart, 1);
  const prevStart = addHours(currentStart, -1);
  const prevEnd = currentStart;
  const nextStart = currentEnd;
  const nextEnd = addHours(nextStart, 1);

  await db.execute(sql`
    TRUNCATE TABLE
      admin_audit_logs,
      email_notifications,
      redemptions,
      score_adjustments,
      checkins,
      bookings,
      team_join_requests,
      team_members,
      teams,
      system_settings,
      fields,
      users
    RESTART IDENTITY CASCADE
  `);

  await db.insert(users).values(
    seedAccounts.map((account) => ({
      id: account.appId,
      authUserId: authIdsByEmail.get(account.email),
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      phone: account.phone,
      birthDate: account.birthDate,
      role: account.role,
      scoreTotal: account.scoreTotal,
      scoreMonthly: account.scoreMonthly,
      scoreVigente: account.scoreVigente,
    })),
  );

  await db.insert(teams).values({
    id: ids.teamOne,
    name: "Los Pibes",
    ownerUserId: ids.userJuan,
  });

  await db.insert(teamMembers).values({
    teamId: ids.teamOne,
    userId: ids.userJuan,
  });

  await db.insert(fields).values([
    {
      id: ids.fieldOne,
      name: "Cancha 1",
      slug: "cancha-1",
      fieldType: "futbol5",
      defaultCheckinLimit: 10,
      imageUrl: "https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 1,
    },
    {
      id: ids.fieldTwo,
      name: "Cancha 2",
      slug: "cancha-2",
      fieldType: "futbol8",
      defaultCheckinLimit: 16,
      imageUrl: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
      displayOrder: 2,
    },
  ]);

  await db.insert(systemSettings).values({
    id: ids.settings,
    bookingDurationMinutes: 60,
    graceMinutes: 30,
    updatedByUserId: ids.admin,
  });

  await db.insert(bookings).values([
    {
      id: ids.bookingPrev,
      fieldId: ids.fieldOne,
      startsAt: prevStart,
      endsAt: prevEnd,
      validFrom: addMinutes(prevStart, -30),
      validUntil: addMinutes(prevEnd, 30),
      qrToken: "prev123",
      checkinLimitSnapshot: 10,
    },
    {
      id: ids.bookingCurrent,
      fieldId: ids.fieldOne,
      teamId: ids.teamOne,
      startsAt: currentStart,
      endsAt: currentEnd,
      // Keep one stable demo QR available all day for frontend work.
      validFrom: startOfDay(currentStart),
      validUntil: endOfDay(currentStart),
      qrToken: "cur123",
      checkinLimitSnapshot: 10,
    },
    {
      id: ids.bookingNext,
      fieldId: ids.fieldOne,
      startsAt: nextStart,
      endsAt: nextEnd,
      validFrom: addMinutes(nextStart, -30),
      validUntil: addMinutes(nextEnd, 30),
      qrToken: "next123",
      checkinLimitSnapshot: 10,
    },
  ]);

  const [juan] = await db.select().from(users).where(eq(users.id, ids.userJuan)).limit(1);

  if (!juan) {
    throw new Error("Seed failed to load Juan user.");
  }

  console.log(
    JSON.stringify(
      {
        seeded: true,
        sampleUsers: seedAccounts.map((account) => ({
          email: account.email,
          password: account.password,
        })),
        qrTokens: ["prev123", "cur123", "next123"],
      },
      null,
      2,
    ),
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
