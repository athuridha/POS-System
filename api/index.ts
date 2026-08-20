import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lazy-loaded Express app — cached after first successful import.
// We do NOT import at the top level because server/app.ts pulls in
// prisma, pg, and all route modules. If any of those fail at module
// scope, the entire Vercel function dies before handling a single request.
let _app: ((req: VercelRequest, res: VercelResponse) => void) | null = null;

async function getApp() {
  if (!_app) {
    const mod = await import('../server/app');
    _app = mod.default as (req: VercelRequest, res: VercelResponse) => void;
  }
  return _app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = req.url || '';

  // ─── Health check endpoints (no external deps) ─────────────
  if (url.includes('health-basic')) {
    res.status(200).json({ phase: 1, ok: true, node: process.version });
    return;
  }

  if (url.includes('health-pg')) {
    try {
      const pg = await import('pg');
      res.status(200).json({ phase: 2, ok: true, pgVersion: typeof pg.default });
    } catch (err: any) {
      res.status(500).json({ phase: 2, error: 'pg import failed', message: err?.message });
    }
    return;
  }

  if (url.includes('health-prisma-client')) {
    try {
      const pc = await import('@prisma/client');
      res.status(200).json({ phase: 3, ok: true, hasPrismaClient: !!pc.PrismaClient });
    } catch (err: any) {
      res.status(500).json({ phase: 3, error: '@prisma/client import failed', message: err?.message });
    }
    return;
  }

  if (url.includes('health-adapter')) {
    try {
      const adapter = await import('@prisma/adapter-pg');
      res.status(200).json({ phase: 4, ok: true, hasAdapter: !!adapter.PrismaPg });
    } catch (err: any) {
      res.status(500).json({ phase: 4, error: '@prisma/adapter-pg import failed', message: err?.message });
    }
    return;
  }

  if (url.includes('health-db')) {
    try {
      const pg = await import('pg');
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { PrismaClient } = await import('@prisma/client');

      const dbUrl = process.env.DATABASE_URL;
      const pool = new pg.default.Pool({ connectionString: dbUrl, max: 1, connectionTimeoutMillis: 5000 });
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

  if (url.includes('health-app')) {
    try {
      const app = await getApp();
      res.status(200).json({ phase: 6, ok: true, hasApp: !!app });
    } catch (err: any) {
      res.status(500).json({
        phase: 6,
        error: 'server/app import failed',
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5),
      });
    }
    return;
  }

  // ─── Default: route all API requests through Express app ────
  try {
    const app = await getApp();
    app(req, res);
  } catch (err: any) {
    console.error('Failed to load Express app:', err);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Server failed to initialize',
        message: err?.message,
      });
    }
  }
}
