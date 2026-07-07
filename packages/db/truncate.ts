import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  await sql`TRUNCATE TABLE "user" CASCADE`;
  console.log('User table truncated.');
  process.exit(0);
}

main().catch(console.error);
