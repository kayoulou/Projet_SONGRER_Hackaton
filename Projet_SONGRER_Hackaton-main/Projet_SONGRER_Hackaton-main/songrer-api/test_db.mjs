import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const r = await p.$queryRawUnsafe('SELECT 1');
  console.log('OK:', JSON.stringify(r));
} catch (e) {
  console.log('ERROR:', e.message);
}
await p.$disconnect();
