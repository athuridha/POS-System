import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const reportRouter = Router();

// All report endpoints are manager-only
reportRouter.use(authenticate);
reportRouter.use(authorize('manager') as any);

// ─── GET /api/reports/daily — daily sales summary ────────────
reportRouter.get('/daily', async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'paid',
      },
      include: {
        payments: true,
        items: { include: { product: true } },
        shift: { include: { kasir: { select: { nama: true } } } },
      },
    });

    const totalPenjualan = transactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalTransaksi = transactions.length;
    const totalDiskon = transactions.reduce((sum, tx) => sum + tx.diskon, 0);

    // Payment breakdown
    const paymentBreakdown: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
      kartu: { count: 0, total: 0 },
    };

    for (const tx of transactions) {
      for (const payment of tx.payments) {
        if (paymentBreakdown[payment.metode]) {
          paymentBreakdown[payment.metode].count++;
          paymentBreakdown[payment.metode].total += payment.jumlahDibayar - payment.kembalian;
        }
      }
    }

    // Order type breakdown
    const orderTypeBreakdown = {
      dine_in: transactions.filter((tx) => tx.tipeOrder === 'dine_in').length,
      take_away: transactions.filter((tx) => tx.tipeOrder === 'take_away').length,
    };

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      totalPenjualan,
      totalTransaksi,
      totalDiskon,
      rataRata: totalTransaksi > 0 ? Math.round(totalPenjualan / totalTransaksi) : 0,
      paymentBreakdown,
      orderTypeBreakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan harian' });
  }
});

// ─── GET /api/reports/by-payment-method — payment method breakdown ─
reportRouter.get('/by-payment-method', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        transaction: {
          createdAt: { gte: start, lte: end },
          status: 'paid',
        },
      },
    });

    const breakdown: Record<string, { count: number; total: number }> = {};

    for (const p of payments) {
      if (!breakdown[p.metode]) {
        breakdown[p.metode] = { count: 0, total: 0 };
      }
      breakdown[p.metode].count++;
      breakdown[p.metode].total += p.jumlahDibayar - p.kembalian;
    }

    res.json({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      breakdown,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan metode pembayaran' });
  }
});

// ─── GET /api/reports/by-cashier — per-cashier breakdown ─────
reportRouter.get('/by-cashier', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const shifts = await prisma.shift.findMany({
      where: {
        waktuBuka: { gte: start, lte: end },
      },
      include: {
        kasir: { select: { id: true, nama: true } },
        transactions: {
          where: { status: 'paid' },
          include: { payments: true },
        },
      },
    });

    const cashierMap: Record<string, {
      kasirId: string;
      nama: string;
      totalShifts: number;
      totalTransaksi: number;
      totalPenjualan: number;
      totalSelisih: number;
    }> = {};

    for (const shift of shifts) {
      const kasirId = shift.kasirId;
      if (!cashierMap[kasirId]) {
        cashierMap[kasirId] = {
          kasirId,
          nama: shift.kasir.nama,
          totalShifts: 0,
          totalTransaksi: 0,
          totalPenjualan: 0,
          totalSelisih: 0,
        };
      }

      cashierMap[kasirId].totalShifts++;
      cashierMap[kasirId].totalTransaksi += shift.transactions.length;
      cashierMap[kasirId].totalPenjualan += shift.transactions.reduce((sum, tx) => sum + tx.total, 0);
      cashierMap[kasirId].totalSelisih += shift.selisih || 0;
    }

    res.json({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      cashiers: Object.values(cashierMap),
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan per kasir' });
  }
});

// ─── GET /api/reports/top-products — best selling products ───
reportRouter.get('/top-products', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, limit = '10' } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: { gte: start, lte: end },
          status: 'paid',
        },
      },
      include: {
        product: { select: { id: true, namaProduk: true, hargaDasar: true } },
      },
    });

    const productMap: Record<string, {
      productId: string;
      namaProduk: string;
      totalTerjual: number;
      totalPendapatan: number;
    }> = {};

    for (const item of items) {
      const pid = item.productId;
      if (!productMap[pid]) {
        productMap[pid] = {
          productId: pid,
          namaProduk: item.product.namaProduk,
          totalTerjual: 0,
          totalPendapatan: 0,
        };
      }
      productMap[pid].totalTerjual += item.jumlah;
      productMap[pid].totalPendapatan += item.hargaTotal;
    }

    const topProducts = Object.values(productMap)
      .sort((a, b) => b.totalTerjual - a.totalTerjual)
      .slice(0, parseInt(limit as string));

    res.json({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      products: topProducts,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan produk terlaris' });
  }
});

// ─── GET /api/reports/weekly — weekly trend ──────────────────
reportRouter.get('/weekly', async (req: AuthRequest, res: Response) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: 'paid',
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyTotals: Record<string, { date: string; total: number; count: number }> = {};

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyTotals[dateStr] = { date: dateStr, total: 0, count: 0 };
    }

    for (const tx of transactions) {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      if (dailyTotals[dateStr]) {
        dailyTotals[dateStr].total += tx.total;
        dailyTotals[dateStr].count++;
      }
    }

    res.json({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      daily: Object.values(dailyTotals),
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil laporan mingguan' });
  }
});
