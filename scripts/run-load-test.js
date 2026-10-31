/**
 * DaxabitHMS Comprehensive Realistic Load Testing & Scalability Suite
 * 
 * Tests 4 distinct concurrency scenarios:
 * - Scenario 1: 5 simultaneous users (normal morning shift)
 * - Scenario 2: 20 simultaneous users (busy lunch rush)
 * - Scenario 3: 50 simultaneous users (peak dinner rush)
 * - Scenario 4: 100 simultaneous users (high concurrency stress / banquet rush)
 * 
 * Measures:
 * - API Latency (p50, p95, p99, mean, min, max)
 * - Error rate (%)
 * - Throughput (RPS) & Order creation throughput (orders/sec)
 * - CPU & RAM consumption
 * - Database query performance (Neon PostgreSQL)
 * - WebSocket connection stability
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { performance } = require('perf_hooks');
const bcrypt = require(path.join(__dirname, '../apps/backend/node_modules/bcrypt'));
const { PrismaClient } = require(path.join(__dirname, '../apps/backend/node_modules/@prisma/client'));
const io = require(path.join(__dirname, '../apps/web/node_modules/socket.io-client'));

const prisma = new PrismaClient();
const PORT = 4000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const TEST_RESTAURANT_NAME = 'LoadTest Gourmet Dining';
const TEST_BRANCH_NAME = 'Downtown Flagship';
const TEST_EMAIL = 'loadtest.admin@daxabithms.local';
const TEST_PASSWORD = 'LoadTestSecurePassword!2026';

let serverProcess = null;
let sessionCookie = '';
let branchId = '';
let restaurantId = '';
let menuItemId = '';
let tableId = '';
let tableIds = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function makeHttpRequest(options, bodyData = null) {
  return new Promise((resolve) => {
    const start = performance.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = performance.now() - start;
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      });
    });

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        statusCode: 0,
        headers: {},
        data: err.message,
        duration,
        success: false,
      });
    });

    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function waitForServer(maxAttempts = 90) {
  console.log('Waiting for backend server to become healthy on port ' + PORT + '...');
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await makeHttpRequest({
        hostname: '127.0.0.1',
        port: PORT,
        path: '/api/v1/auth/me',
        method: 'GET',
      });
      if (res.statusCode === 401 || res.statusCode === 200) {
        console.log(`Backend server ready (attempt ${i + 1}).`);
        return true;
      }
    } catch {}
    await sleep(1000);
  }
  throw new Error('Backend server failed to start within timeout');
}

async function setupTestData() {
  console.log('\n[SETUP] Provisioning isolated test tenant in Neon PostgreSQL...');
  
  await cleanupTestData();

  // 1. Create Restaurant & Branch
  const restaurant = await prisma.restaurant.create({
    data: {
      name: TEST_RESTAURANT_NAME,
      currency: 'USD',
      branches: {
        create: {
          name: TEST_BRANCH_NAME,
          taxRegime: 'US_SALES_TAX',
          taxMode: 'EXCLUSIVE',
        },
      },
    },
    include: { branches: true },
  });
  restaurantId = restaurant.id;
  branchId = restaurant.branches[0].id;

  // 2. Create Owner Role & User
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  const role = await prisma.role.create({
    data: {
      restaurantId,
      name: 'OWNER',
      label: 'Owner',
    },
  });

  await prisma.user.create({
    data: {
      restaurantId,
      roleId: role.id,
      name: 'Load Test Admin',
      email: TEST_EMAIL,
      passwordHash,
      isActive: true,
      branches: {
        create: {
          branchId,
        },
      },
    },
  });

  // 3. Create Floor and Tables
  const floor = await prisma.floor.create({
    data: {
      branchId,
      name: 'Main Dining Room',
      tables: {
        create: Array.from({ length: 20 }).map((_, i) => ({
          number: String(i + 1),
          name: `Table ${i + 1}`,
          capacity: 4,
        })),
      },
    },
    include: { tables: true },
  });
  tableIds = floor.tables.map((t) => t.id);
  tableId = tableIds[0];

  // 4. Create Menu Category & Item
  const category = await prisma.menuCategory.create({
    data: {
      branchId,
      name: 'Main Courses',
    },
  });

  const menuItem = await prisma.menuItem.create({
    data: {
      branchId,
      categoryId: category.id,
      name: 'Prime Wagyu Ribeye',
      price: 48.0,
      taxRatePercent: 8.5,
    },
  });
  menuItemId = menuItem.id;

  console.log(`✓ Test tenant provisioned (Branch ID: ${branchId}, Menu Item: ${menuItemId})\n`);
}

async function loginAndGetCookie() {
  console.log('[AUTH] Logging in to establish session cookie...');
  const res = await makeHttpRequest(
    {
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }
  );

  if (!res.success) {
    throw new Error(`Login failed with status ${res.statusCode}: ${JSON.stringify(res.data)}`);
  }

  const rawCookies = res.headers['set-cookie'];
  if (!rawCookies || rawCookies.length === 0) {
    throw new Error('No set-cookie header received from login');
  }

  sessionCookie = rawCookies.map((c) => c.split(';')[0]).join('; ');
  console.log('✓ Session established successfully.\n');
}

async function testWebSocketStability(concurrency) {
  console.log(`  -> Testing WebSocket stability with ${concurrency} simultaneous socket connections...`);
  const sockets = [];
  let connectedCount = 0;
  let errorCount = 0;

  const connectPromises = Array.from({ length: concurrency }).map((_, i) => {
    return new Promise((resolve) => {
      const socket = io(BASE_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        extraHeaders: {
          Cookie: sessionCookie,
        },
        query: {
          branchId,
        },
        reconnection: false,
        timeout: 6000,
      });

      sockets.push(socket);

      socket.on('connect', () => {
        connectedCount++;
        resolve({ success: true });
      });

      socket.on('connect_error', () => {
        errorCount++;
        resolve({ success: false });
      });
    });
  });

  await Promise.all(connectPromises);
  const successRate = (connectedCount / concurrency) * 100;

  sockets.forEach((s) => s.disconnect());

  return {
    connectedCount,
    errorCount,
    successRate: Math.round(successRate * 10) / 10,
  };
}

async function runScenario(scenarioName, concurrentUsers, operationsPerUser) {
  console.log(`================================================================`);
  console.log(`  RUNNING: ${scenarioName} (${concurrentUsers} Concurrent Users)`);
  console.log(`  Workload: ${operationsPerUser} operations/user = ${concurrentUsers * operationsPerUser} total requests`);
  console.log(`================================================================`);

  const memBefore = process.memoryUsage();
  const cpuBefore = process.cpuUsage();
  const wallStart = performance.now();

  const latencies = [];
  const orderLatencies = [];
  let successCount = 0;
  let failCount = 0;
  let ordersCreated = 0;

  const userWorkers = Array.from({ length: concurrentUsers }).map(async (_, userIdx) => {
    for (let op = 0; op < operationsPerUser; op++) {
      const opType = op % 5;
      let res;

      if (opType === 0) {
        // Op 0: Order creation (heavy write transaction)
        const isDineIn = userIdx % 2 === 0;
        const assignedTableId = isDineIn ? tableIds[userIdx % tableIds.length] : undefined;
        const clientRequestId = `load_${concurrentUsers}_u${userIdx}_op${op}_${Date.now()}`;
        res = await makeHttpRequest(
          {
            hostname: '127.0.0.1',
            port: PORT,
            path: `/api/v1/orders?branchId=${branchId}`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: sessionCookie,
            },
          },
          {
            type: isDineIn ? 'DINE_IN' : 'TAKEAWAY',
            tableId: assignedTableId,
            clientRequestId,
            items: [
              {
                menuItemId,
                quantity: 1,
                modifierIds: [],
              },
            ],
          }
        );
        if (res.success) {
          ordersCreated++;
          orderLatencies.push(res.duration);
        }
      } else if (opType === 1) {
        // Op 1: Dashboard summary (aggregate reads with memoization)
        res = await makeHttpRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: `/api/v1/dashboard/summary?branchId=${branchId}`,
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        });
      } else if (opType === 2) {
        // Op 2: Tables status query
        res = await makeHttpRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: `/api/v1/tables/floors?branchId=${branchId}`,
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        });
      } else if (opType === 3) {
        // Op 3: KDS incoming/tickets query
        res = await makeHttpRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: `/api/v1/kds/tickets?branchId=${branchId}`,
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        });
      } else {
        // Op 4: Sales trends / report query
        res = await makeHttpRequest({
          hostname: '127.0.0.1',
          port: PORT,
          path: `/api/v1/dashboard/trends?branchId=${branchId}&days=7`,
          method: 'GET',
          headers: {
            Cookie: sessionCookie,
          },
        });
      }

      latencies.push(res.duration);
      if (res.success) {
        successCount++;
      } else {
        failCount++;
        if (failCount <= 3) {
          console.warn(`    [DEBUG ERR] opType=${opType} status=${res.statusCode} data=${JSON.stringify(res.data)}`);
        }
      }
    }
  });

  await Promise.all(userWorkers);

  const wallDurationMs = performance.now() - wallStart;
  const wallDurationSec = wallDurationMs / 1000;
  const memAfter = process.memoryUsage();
  const cpuAfter = process.cpuUsage(cpuBefore);

  // Measure database ping/health latency
  const dbPingStart = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  const dbPingMs = performance.now() - dbPingStart;

  // Measure WebSocket stability
  const wsMetrics = await testWebSocketStability(Math.min(concurrentUsers, 50));

  const totalRequests = successCount + failCount;
  const errorRate = (failCount / totalRequests) * 100;
  const rps = totalRequests / wallDurationSec;
  const orderThroughput = ordersCreated / wallDurationSec;

  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  const meanLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const orderP50 = percentile(orderLatencies, 50);
  const orderP95 = percentile(orderLatencies, 95);

  const rssMb = Math.round((memAfter.rss / 1024 / 1024) * 10) / 10;
  const heapMb = Math.round((memAfter.heapUsed / 1024 / 1024) * 10) / 10;
  const cpuPercent = Math.round(((cpuAfter.user + cpuAfter.system) / 1000 / wallDurationMs) * 100);

  const result = {
    scenarioName,
    concurrentUsers,
    totalRequests,
    successCount,
    failCount,
    errorRate: Math.round(errorRate * 100) / 100,
    durationSec: Math.round(wallDurationSec * 100) / 100,
    rps: Math.round(rps * 10) / 10,
    ordersCreated,
    orderThroughput: Math.round(orderThroughput * 10) / 10,
    latency: {
      min: Math.round(minLatency),
      mean: Math.round(meanLatency),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      max: Math.round(maxLatency),
      orderP50: Math.round(orderP50),
      orderP95: Math.round(orderP95),
    },
    system: {
      rssMb,
      heapMb,
      cpuPercent,
      dbPingMs: Math.round(dbPingMs),
    },
    websocket: wsMetrics,
  };

  console.log(`\n  [RESULTS - ${scenarioName}]`);
  console.log(`  - Total Requests:      ${result.totalRequests} (${result.successCount} OK, ${result.failCount} Err)`);
  console.log(`  - Error Rate:          ${result.errorRate}%`);
  console.log(`  - Throughput:          ${result.rps} req/sec`);
  console.log(`  - Order Creation Rate: ${result.orderThroughput} orders/sec (p50: ${result.latency.orderP50}ms, p95: ${result.latency.orderP95}ms)`);
  console.log(`  - Latency:             p50=${result.latency.p50}ms, p95=${result.latency.p95}ms, p99=${result.latency.p99}ms, mean=${result.latency.mean}ms`);
  console.log(`  - RAM (RSS/Heap):      ${result.system.rssMb} MB / ${result.system.heapMb} MB`);
  console.log(`  - Database Ping:       ${result.system.dbPingMs} ms`);
  console.log(`  - WebSocket Success:   ${result.websocket.successRate}% (${result.websocket.connectedCount} connected)`);
  console.log('----------------------------------------------------------------\n');

  return result;
}

async function cleanupTestData() {
  try {
    const r = await prisma.restaurant.findFirst({
      where: { name: TEST_RESTAURANT_NAME },
      include: { branches: true },
    });
    if (r) {
      const bIds = r.branches.map((b) => b.id);
      await prisma.kotItem.deleteMany({ where: { kot: { order: { branchId: { in: bIds } } } } });
      await prisma.kot.deleteMany({ where: { order: { branchId: { in: bIds } } } });
      await prisma.orderItemModifier.deleteMany({ where: { orderItem: { order: { branchId: { in: bIds } } } } });
      await prisma.orderItem.deleteMany({ where: { order: { branchId: { in: bIds } } } });
      await prisma.payment.deleteMany({ where: { order: { branchId: { in: bIds } } } });
      await prisma.order.deleteMany({ where: { branchId: { in: bIds } } });
      await prisma.table.deleteMany({ where: { floor: { branchId: { in: bIds } } } });
      await prisma.floor.deleteMany({ where: { branchId: { in: bIds } } });
      await prisma.menuItem.deleteMany({ where: { branchId: { in: bIds } } });
      await prisma.menuCategory.deleteMany({ where: { branchId: { in: bIds } } });
      await prisma.userBranch.deleteMany({ where: { branchId: { in: bIds } } });
      await prisma.user.deleteMany({ where: { restaurantId: r.id } });
      await prisma.role.deleteMany({ where: { restaurantId: r.id } });
      await prisma.branch.deleteMany({ where: { restaurantId: r.id } });
      await prisma.restaurant.delete({ where: { id: r.id } });
    }
  } catch (err) {
    console.warn('Cleanup warning:', err.message);
  }
}

async function run() {
  console.log('================================================================');
  console.log('   DAXABITHMS COMPREHENSIVE PERFORMANCE & SCALABILITY SUITE   ');
  console.log('================================================================\n');

  // 1. Provision test tenant
  await setupTestData();

  // 2. Start server as child process
  console.log('[SERVER] Launching backend server on port ' + PORT + '...');
  const serverScript = path.join(__dirname, '../apps/backend/dist/src/main.js');
  serverProcess = spawn('node', [serverScript], {
    cwd: path.join(__dirname, '../apps/backend'),
    env: {
      ...process.env,
      PORT: String(PORT),
      RATE_LIMIT_MAX: '50000',
    },
    stdio: 'inherit',
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
  });

  // 3. Wait for health check
  await waitForServer();

  // 4. Authenticate
  await loginAndGetCookie();

  // 5. Run scenarios: 5, 20, 50, 100 simultaneous users
  const results = [];
  results.push(await runScenario('Scenario 1: Small Shift', 5, 20));   // 100 requests
  results.push(await runScenario('Scenario 2: Lunch Rush', 20, 15));   // 300 requests
  results.push(await runScenario('Scenario 3: Dinner Peak', 50, 10));  // 500 requests
  results.push(await runScenario('Scenario 4: High Stress', 100, 10)); // 1,000 requests

  // 6. Cleanup
  console.log('[CLEANUP] Cleaning up test orders and tenant...');
  await cleanupTestData();

  if (serverProcess) {
    console.log('[SHUTDOWN] Stopping backend server process...');
    serverProcess.kill('SIGINT');
  }

  // 7. Write results JSON for documentation report
  const jsonPath = path.join(__dirname, 'load-test-results.json');
  require('fs').writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ All performance load test scenarios completed successfully.`);
  console.log(`✓ Raw metrics saved to: ${jsonPath}`);
}

run()
  .catch(async (err) => {
    console.error('Fatal load test error:', err);
    if (serverProcess) serverProcess.kill();
    await cleanupTestData();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
