require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = postgres(connectionString, { prepare: false });

  try {
    await sql.unsafe('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_name" text');
    await sql.unsafe('ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_phone" text');
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
