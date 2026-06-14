require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const sql = postgres(connectionString, { prepare: false });

  try {
    await sql.unsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" uuid');
    await sql.unsafe(
      'CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_unique" ON "users" USING btree ("auth_user_id")',
    );
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
