import { PrismaClient } from '@prisma/client';

const urls = [
  'postgresql://songrer:songrer_password@127.0.0.1:5432/songrer',
  'postgresql://songrer:songrer_password@127.0.0.1:5432/songrer?sslmode=disable',
  'postgresql://songrer:songrer_password@localhost:5432/songrer',
];

for (const url of urls) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const r = await p.$queryRawUnsafe('SELECT 1 as val');
    console.log(`OK [${url}]:`, JSON.stringify(r));
  } catch (e) {
    console.log(`FAIL [${url}]:`, e.message.split('\n')[0]);
  }
  await p.$disconnect();
}
