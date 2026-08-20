import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Lazy initialization — modules are created on first use, not at import time.
// This is critical for Vercel serverless: if pool/client creation runs at
// module scope and fails, the entire function crashes before handling any request.

let _pool: pg.Pool | null = null;
let _prisma: PrismaClient | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('FATAL: DATABASE_URL environment variable is not set!');
    }
    _pool = new pg.Pool({
      connectionString,
      max: 1,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: true,
    });
  }
  return _pool;
}

function createPrismaClient(): PrismaClient {
  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// In development, cache on globalThis to survive HMR reloads
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful disconnect for serverless environments
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    if (_pool) {
      await _pool.end();
      _pool = null;
    }
  } catch {
    // ignore errors during cleanup
  }
}

export default prisma;
