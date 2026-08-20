import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.routes';
import { menuRouter } from './routes/menu.routes';
import { tableRouter } from './routes/table.routes';
import { shiftRouter } from './routes/shift.routes';
import { transactionRouter } from './routes/transaction.routes';
import { syncRouter } from './routes/sync.routes';
import { discountRouter } from './routes/discount.routes';
import { reportRouter } from './routes/report.routes';
import { userRouter } from './routes/user.routes';
import { uploadRouter } from './routes/upload.routes';
import { settingRouter } from './routes/setting.routes';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const diagnostics: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? 'SET (length=' + process.env.DATABASE_URL.length + ')' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'MISSING',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV || 'not set',
    },
  };

  try {
    const userCount = await prisma.user.count();
    diagnostics.database = { connected: true, userCount };
  } catch (err: any) {
    diagnostics.database = { connected: false, error: err?.message || String(err) };
  }

  res.json(diagnostics);
});

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/categories', menuRouter.categories);
app.use('/api/products', menuRouter.products);
app.use('/api/tables', tableRouter);
app.use('/api/shifts', shiftRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/sync', syncRouter);
app.use('/api/discounts', discountRouter);
app.use('/api/reports', reportRouter);
app.use('/api/users', userRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/settings', settingRouter);

// ─── Error Handler ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
