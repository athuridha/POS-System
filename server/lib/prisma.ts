/**
 * Prisma client with TRULY lazy initialization via Proxy.
 *
 * CRITICAL for Vercel: all heavy imports (pg, @prisma/adapter-pg,
 * @prisma/client) are deferred until the first property access on `prisma`.
 * This prevents the entire serverless function from crashing during cold start
 * if any native module has issues loading.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _prismaClient: any = null;

function initPrismaClient(): any {
  if (_prismaClient) return _prismaClient;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pg = require('pg');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require('@prisma/adapter-pg');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require('@prisma/client');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[prisma] DATABASE_URL environment variable is not set!');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pool = new (pg as any).Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });

  const adapter = new PrismaPg(pool);
  _prismaClient = new PrismaClient({ adapter });
  return _prismaClient;
}

/**
 * Lazy proxy: the underlying PrismaClient is only created when you
 * first access a property (e.g. prisma.user.findMany(...)).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _handler: ProxyHandler<any> = {
  get(_target, prop: string | symbol, _receiver) {
    // Pass through symbols and internal properties
    if (typeof prop === 'symbol') return undefined;

    const client = initPrismaClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop];

    // Bind methods so they work correctly when destructured
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
};

// In development, cache on globalThis to survive HMR reloads
const globalForPrisma = global as unknown as { prisma: any };

export const prisma = globalForPrisma.prisma || new Proxy({}, _handler);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful disconnect for serverless environments.
 */
export async function disconnectPrisma() {
  try {
    if (_prismaClient) {
      await _prismaClient.$disconnect();
    }
  } catch {
    // ignore errors during cleanup
  }
  _prismaClient = null;
}

export default prisma;
