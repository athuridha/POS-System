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

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// ─── Error Handler ───────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
