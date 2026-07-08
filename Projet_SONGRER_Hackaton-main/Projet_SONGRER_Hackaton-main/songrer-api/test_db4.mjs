import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  await p.$connect();
  console.log('CONNECTED');
  await p.$disconnect();
} catch (e) {
  console.log('ERROR:', e.message);
}
