import { db } from './src/index';
import { notifications } from './src/schema';

async function main() {
  console.log('Seeding notifications...');
  
  await db.insert(notifications).values({
    userId: null,
    type: 'support_creator',
    title: 'Support the Creator',
    body: 'OmoZoku is built and maintained by a solo developer. If you love using it, consider dropping a follow or saying hi!',
    linkUrl: 'https://x.com/0nyxexe',
    isDismissible: false,
    priority: 9999,
  });

  console.log('Done!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
