import { db } from './src/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Dropping notification table...');
  await db.execute(sql`DROP TABLE IF EXISTS "notification" CASCADE;`);
  console.log('Dropped notification table.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
