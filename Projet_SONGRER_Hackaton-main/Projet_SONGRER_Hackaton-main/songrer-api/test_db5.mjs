import { PrismaClient } from '@prisma/client';

// Try with an explicit pg client to verify credentials
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Let's see what prisma thinks the datasource URL is
console.log('prisma client version:', require('@prisma/client/package.json').version);

// Check what prisma client thinks the engine path is
const path = require('path');
const engineDir = path.dirname(require.resolve('@prisma/client'));
console.log('engine dir:', engineDir);

// Try connecting
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://songrer:songrer_password@127.0.0.1:5432/songrer'
    }
  }
});

try {
  await p.$connect();
  console.log('CONNECTED!');
  const r = await p.$queryRawUnsafe('SELECT 1 as val');
  console.log('QUERY OK:', JSON.stringify(r));
  await p.$disconnect();
} catch (e) {
  console.log('ERROR:', e.constructor.name, e.message);
  if (e.stack) console.log(e.stack.split('\n').slice(0, 3).join('\n'));
}
