const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function m() {
  console.time('connect');
  await p.$connect();
  console.timeEnd('connect');

  for (let i = 0; i < 3; i++) {
    console.time(`query-${i}`);
    await p.user.findFirst();
    console.timeEnd(`query-${i}`);
  }
  await p.$disconnect();
}
m();
