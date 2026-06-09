import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "@/lib/env";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export const db = new Proxy(
  {},
  {
    get(_, property) {
      return getDb()[property as keyof ReturnType<typeof drizzle>];
    },
  },
) as ReturnType<typeof drizzle>;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database client is not configured. Check DATABASE_URL.");
  }

  if (!dbInstance) {
    dbInstance = drizzle(postgres(getDatabaseUrl(), { prepare: false }));
  }

  return dbInstance;
}
