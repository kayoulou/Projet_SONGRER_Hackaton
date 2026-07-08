import { PrismaClient } from '@prisma/client';
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://songrer:songrer_password@127.0.0.1:5432/songrer'
    }
  }
});
try {
  const r = await p.$queryRawUnsafe('SELECT 1');
  console.log('OK:', JSON.stringify(r));
} catch (e) {
  console.log('ERROR:', e.message);
  console.log('STACK:', e.stack);
}
await p.$disconnect();
