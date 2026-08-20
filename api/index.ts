import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Phase 1: Basic function test
  if (req.url === '/api/health-basic') {
    res.status(200).json({ phase: 1, status: 'Function runs OK', nodeVersion: process.version });
    return;
  }

  // Phase 2: Try importing express
  try {
    const express = await import('express');
    if (req.url === '/api/health-express') {
      res.status(200).json({ phase: 2, status: 'Express imported OK' });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ phase: 2, error: 'Express import failed', message: err?.message });
    return;
  }

  // Phase 3: Try importing Prisma/pg
  try {
    const prismaModule = await import('../lib/prisma');
    if (req.url === '/api/health-prisma') {
      const count = await prismaModule.prisma.user.count();
      res.status(200).json({ phase: 3, status: 'Prisma connected OK', userCount: count });
      return;
    }
  } catch (err: any) {
    if (req.url === '/api/health-prisma') {
      res.status(500).json({ phase: 3, error: 'Prisma import/connect failed', message: err?.message, stack: err?.stack?.split('\n').slice(0, 5) });
      return;
    }
  }

  // Phase 4: Full app
  try {
    const appModule = await import('../server/app');
    const app = appModule.default;
    app(req, res);
  } catch (err: any) {
    res.status(500).json({
      error: 'Full app import failed',
      message: err?.message,
      stack: err?.stack?.split('\n').slice(0, 8),
    });
  }
}
