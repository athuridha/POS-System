import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('FATAL: DATABASE_URL environment variable is not set!');
}

// Serverless-optimized: max=1 since each invocation handles one request
const pool = new pg.Pool({
  connectionString,
  max: 1,
  idleTimeoutMillis: 0,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful disconnect for serverless environments
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
    await pool.end();
  } catch {
    // ignore errors during cleanup
  }
}

export default prisma;
