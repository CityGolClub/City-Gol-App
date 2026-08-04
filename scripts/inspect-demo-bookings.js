require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');

async function main() {
  const sql = postgres(process.env.DATABASE_URL, { prepare: false });

  try {
    const rows = await sql.unsafe(`
      select qr_token, valid_from, valid_until, now() as current_time
      from bookings
      where qr_token in ('prev123', 'cur123', 'next123')
      order by qr_token
    `);

    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
