/**
 * Vercel Serverless Function — single entry point for ALL /api/* routes.
 *
 * Uses STATIC import for server/app so esbuild traces and bundles
 * all dependencies. The Prisma client uses Proxy-based lazy init,
 * so no DB connection happens at import time.
 */
import app from '../server/app';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const url: string = req.url || '';

  // ─── Health check: zero deps ─────────────────────────────────
  if (url.includes('health-basic')) {
    res.status(200).json({ phase: 1, ok: true, node: process.version });
    return;
  }

  // ─── Health check: pg module ─────────────────────────────────
  if (url.includes('health-pg')) {
    try {
      const pg = await import('pg');
      res.status(200).json({ phase: 2, ok: true, pgVersion: typeof pg.default });
    } catch (err: any) {
      res.status(500).json({ phase: 2, error: 'pg import failed', message: err?.message });
    }
    return;
  }

  // ─── Health check: @prisma/client ────────────────────────────
  if (url.includes('health-prisma-client')) {
    try {
      const pc = await import('@prisma/client');
      res.status(200).json({ phase: 3, ok: true, hasPrismaClient: !!pc.PrismaClient });
    } catch (err: any) {
      res.status(500).json({ phase: 3, error: '@prisma/client import failed', message: err?.message });
    }
    return;
  }

  // ─── Health check: @prisma/adapter-pg ────────────────────────
  if (url.includes('health-adapter')) {
    try {
      const adapter = await import('@prisma/adapter-pg');
      res.status(200).json({ phase: 4, ok: true, hasAdapter: !!adapter.PrismaPg });
    } catch (err: any) {
      res.status(500).json({ phase: 4, error: '@prisma/adapter-pg import failed', message: err?.message });
    }
    return;
  }

  // ─── Health check: full DB connection ─────────────────────────
  if (url.includes('health-db')) {
    try {
      const pg = await import('pg');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { PrismaClient } = await import('@prisma/client');

      const dbUrl = process.env.DATABASE_URL;
      const pool = new (pg as any).default.Pool({
        connectionString: dbUrl,
        max: 1,
        connectionTimeoutMillis: 5000,
      });
      const adapter = new PrismaPg(pool);
      const prisma = new PrismaClient({ adapter });

      const count = await prisma.user.count();
      await prisma.$disconnect();
      await pool.end();

      res.status(200).json({
        phase: 5,
        ok: true,
        userCount: count,
        dbUrlSet: !!dbUrl,
        dbUrlLen: dbUrl?.length,
      });
    } catch (err: any) {
      res.status(500).json({
        phase: 5,
        error: 'DB connection failed',
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5),
        dbUrlSet: !!process.env.DATABASE_URL,
      });
    }
    return;
  }

  // ─── Default: route all API requests through Express app ──────
  try {
    app(req, res);
  } catch (err: any) {
    console.error('Failed to handle request:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Server failed to initialize',
        message: err?.message,
      });
    }
  }
}
