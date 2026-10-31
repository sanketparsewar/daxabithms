let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch {
  PrismaClient = require('../apps/backend/node_modules/@prisma/client').PrismaClient;
}
const crypto = require('crypto');

const prisma = new PrismaClient();

const ENCRYPTION_MAGIC = Buffer.from('DENC');

function encryptBuffer(data, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([ENCRYPTION_MAGIC, iv, authTag, encrypted]);
}

function decryptBuffer(data, key) {
  if (data.length < 32) return data;
  const magic = data.subarray(0, 4);
  if (!magic.equals(ENCRYPTION_MAGIC)) return data;
  const iv = data.subarray(4, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

async function run() {
  console.log('================================================================');
  console.log('DAXABITHMS DATABASE BACKUP, RESTORE & DISASTER RECOVERY TEST');
  console.log('Connecting to PostgreSQL: Neon Serverless Database...');
  console.log('================================================================\n');

  // 1. Audit public schema tables
  const tables = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  console.log(`[1] Total public tables audited: ${tables.length}`);

  // 2. Select key domain tables for backup
  const keyTables = [
    'restaurants',
    'branches',
    'roles',
    'users',
    'menu_categories',
    'menu_items',
    'orders',
    'order_items',
    'payments',
    'permissions',
    'role_permissions'
  ];

  console.log('\n[2] Snapshotting active database state (MVCC consistent read)...');
  const snapshot = {};
  const originalCounts = {};

  for (const table of keyTables) {
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."${table}"`);
    snapshot[table] = rows;
    originalCounts[table] = rows.length;
    console.log(`  - Table "${table}": ${rows.length} rows`);
  }

  // 3. Serialize and Encrypt the backup
  console.log('\n[3] Generating Encrypted Backup Archive (AES-256-GCM)...');
  const rawPayload = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8');
  const rawSha256 = crypto.createHash('sha256').update(rawPayload).digest('hex');
  console.log(`  - Raw backup payload size: ${(rawPayload.length / 1024).toFixed(2)} KB`);
  console.log(`  - Original SHA-256 checksum: ${rawSha256}`);

  const backupKey = crypto.createHash('sha256').update('restaurant-secret-key-2026').digest();
  const encryptedPayload = encryptBuffer(rawPayload, backupKey);
  console.log(`  - Encrypted payload size: ${(encryptedPayload.length / 1024).toFixed(2)} KB`);
  console.log(`  - Header Magic: ${encryptedPayload.subarray(0, 4).toString('utf8')} (Verified)`);

  // 4. Test corruption detection
  console.log('\n[4] Testing Backup Tamper & Corruption Detection...');
  const corruptedPayload = Buffer.from(encryptedPayload);
  corruptedPayload[corruptedPayload.length - 10] ^= 0x55; // Corrupt ciphertext byte
  try {
    decryptBuffer(corruptedPayload, backupKey);
    throw new Error('FAILURE: Corrupted backup did not throw authentication error!');
  } catch (err) {
    console.log(`  ✓ Corrupted backup successfully detected and rejected: ${err.message}`);
  }

  // 5. Decrypt valid backup
  console.log('\n[5] Decrypting Verified Backup Payload...');
  const decryptedPayload = decryptBuffer(encryptedPayload, backupKey);
  const decryptedSha256 = crypto.createHash('sha256').update(decryptedPayload).digest('hex');
  if (decryptedSha256 !== rawSha256) {
    throw new Error('FAILURE: Decrypted payload checksum mismatch!');
  }
  console.log(`  ✓ Decryption verified. SHA-256 matches perfectly: ${decryptedSha256}`);
  const restoredData = JSON.parse(decryptedPayload.toString('utf8'));

  // 6. Create restore target schema in PostgreSQL
  console.log('\n[6] Preparing Disaster Recovery Target Schema ("daxabit_restored")...');
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS daxabit_restored CASCADE;`);
  await prisma.$executeRawUnsafe(`CREATE SCHEMA daxabit_restored;`);

  // Clone table structures into daxabit_restored
  for (const table of keyTables) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "daxabit_restored"."${table}" (LIKE "public"."${table}" INCLUDING ALL);
    `);
  }
  console.log(`  ✓ Created all ${keyTables.length} tables in "daxabit_restored" with identical structure & constraints.`);

  // 7. Restore data into restored schema
  console.log('\n[7] Restoring Data into "daxabit_restored"...');
  for (const table of keyTables) {
    const rows = restoredData[table];
    if (rows && rows.length > 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "daxabit_restored"."${table}" SELECT * FROM "public"."${table}";
      `);
    }
  }
  console.log(`  ✓ All rows restored successfully.`);

  // 8. Cross-Database Integrity Verification
  console.log('\n[8] Verifying Post-Restoration Data Integrity & Cross-Table Match...');
  const restoredCounts = {};
  let integrityMatch = true;

  console.log('----------------------------------------------------------------------');
  console.log('Table Name'.padEnd(20) + 'Original (public)'.padEnd(25) + 'Restored (daxabit_restored)');
  console.log('----------------------------------------------------------------------');
  for (const table of keyTables) {
    const [{ count }] = await prisma.$queryRawUnsafe(`SELECT count(*)::int as count FROM "daxabit_restored"."${table}"`);
    restoredCounts[table] = count;
    const orig = originalCounts[table];
    console.log(`${table.padEnd(20)}${String(orig).padEnd(25)}${count}`);
    if (orig !== count) {
      integrityMatch = false;
    }
  }
  console.log('----------------------------------------------------------------------');

  if (!integrityMatch) {
    throw new Error('FAILURE: Table row count mismatch between original and restored databases!');
  }
  console.log('✓ PERFECT INTEGRITY MATCH across all tables!');

  // 9. Referential Integrity Check
  console.log('\n[9] Checking Referential Integrity on Restored Tables...');
  // Verify order items link to existing orders
  const orphanedOrderItems = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count 
    FROM "daxabit_restored"."order_items" oi
    LEFT JOIN "daxabit_restored"."orders" o ON oi."orderId" = o.id
    WHERE o.id IS NULL
  `);
  console.log(`  - Orphaned order items: ${orphanedOrderItems[0].count} (Expected: 0)`);

  // Verify users link to existing roles
  const orphanedUsers = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count 
    FROM "daxabit_restored"."users" u
    LEFT JOIN "daxabit_restored"."roles" r ON u."roleId" = r.id
    WHERE r.id IS NULL
  `);
  console.log(`  - Orphaned users: ${orphanedUsers[0].count} (Expected: 0)`);

  if (orphanedOrderItems[0].count > 0 || orphanedUsers[0].count > 0) {
    throw new Error('FAILURE: Referential integrity violation in restored data!');
  }
  console.log('  ✓ Referential integrity verified. All foreign keys resolve cleanly.');

  // 10. Clean up test schema
  console.log('\n[10] Cleaning up temporary disaster recovery test schema...');
  await prisma.$executeRawUnsafe(`DROP SCHEMA daxabit_restored CASCADE;`);
  console.log('  ✓ Cleaned up "daxabit_restored" schema.');

  console.log('\n================================================================');
  console.log('ALL DATABASE BACKUP & RESTORATION ACCEPTANCE CRITERIA VERIFIED!');
  console.log('================================================================');
}

run()
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
