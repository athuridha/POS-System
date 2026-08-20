import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const shiftRouter = Router();

// ─── POST /api/shifts/open — buka shift ─────────────────────
shiftRouter.post('/open', authenticate, authorize('kasir', 'manager') as any, async (req: AuthRequest, res: Response) => {
  try {
    const { modalAwal } = req.body;
    const kasirId = req.user!.userId;

    if (modalAwal === undefined || modalAwal < 0) {
      res.status(400).json({ error: 'Modal awal wajib diisi (min. 0)' });
      return;
    }

    // Check if kasir already has an open shift
    const existingShift = await prisma.shift.findFirst({
      where: { kasirId, status: 'open' },
    });

    if (existingShift) {
      res.status(409).json({
        error: 'Anda sudah punya shift yang masih terbuka',
        shift: existingShift,
      });
      return;
    }

    const shift = await prisma.shift.create({
      data: {
        kasirId,
        modalAwal,
        waktuBuka: new Date(),
      },
      include: {
        kasir: { select: { id: true, nama: true, email: true } },
      },
    });

    res.status(201).json({ shift });
  } catch (err) {
    console.error('Open shift error:', err);
    res.status(500).json({ error: 'Gagal membuka shift' });
  }
});

// ─── POST /api/shifts/:id/close — tutup shift ───────────────
shiftRouter.post('/:id/close', authenticate, authorize('kasir', 'manager') as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { kasAktual } = req.body;
    const kasirId = req.user!.userId;

    if (kasAktual === undefined || kasAktual < 0) {
      res.status(400).json({ error: 'Kas aktual wajib diisi (min. 0)' });
      return;
    }

    // Verify shift exists and belongs to kasir (or is manager)
    const shift = await prisma.shift.findUnique({ where: { id } });

    if (!shift) {
      res.status(404).json({ error: 'Shift tidak ditemukan' });
      return;
    }

    if (shift.status === 'closed') {
      res.status(409).json({ error: 'Shift sudah ditutup sebelumnya' });
      return;
    }

    if (shift.kasirId !== kasirId && req.user!.role !== 'manager') {
      res.status(403).json({ error: 'Shift ini bukan milik Anda' });
      return;
    }

    // Calculate kasSeharusnya from Cash payments in this shift
    const kasSeharusnya = await calculateKasSeharusnya(id, shift.modalAwal);
    const selisih = kasAktual - kasSeharusnya;

    const closedShift = await prisma.shift.update({
      where: { id },
      data: {
        waktuTutup: new Date(),
        kasSeharusnya,
        kasAktual,
        selisih,
        status: 'closed',
      },
      include: {
        kasir: { select: { id: true, nama: true, email: true } },
      },
    });

    res.json({ shift: closedShift });
  } catch (err) {
    console.error('Close shift error:', err);
    res.status(500).json({ error: 'Gagal menutup shift' });
  }
});

// ─── GET /api/shifts/active — get current kasir's active shift ─
shiftRouter.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shift = await prisma.shift.findFirst({
      where: {
        kasirId: req.user!.userId,
        status: 'open',
      },
      include: {
        kasir: { select: { id: true, nama: true, email: true } },
        _count: { select: { transactions: true } },
      },
    });

    if (!shift) {
      res.json({ shift: null });
      return;
    }

    // Calculate running total for display
    const runningTotal = await calculateKasSeharusnya(shift.id, shift.modalAwal);

    res.json({
      shift: {
        ...shift,
        runningKasSeharusnya: runningTotal,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil shift aktif' });
  }
});

// ─── GET /api/shifts — list shifts (manager or own shifts) ───
shiftRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, kasirId } = req.query;
    const isManager = req.user!.role === 'manager';

    const shifts = await prisma.shift.findMany({
      where: {
        ...(!isManager && { kasirId: req.user!.userId }),
        ...(isManager && kasirId && { kasirId: kasirId as string }),
        ...(startDate && {
          waktuBuka: {
            gte: new Date(startDate as string),
            ...(endDate && { lte: new Date(endDate as string) }),
          },
        }),
      },
      include: {
        kasir: { select: { id: true, nama: true, email: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { waktuBuka: 'desc' },
      take: 50,
    });

    res.json({ shifts });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data shift' });
  }
});

// ─── GET /api/shifts/:id — shift detail ─────────────────────
shiftRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const shift = await prisma.shift.findUnique({
      where: { id: String(req.params?.id ?? '') as string },
      include: {
        kasir: { select: { id: true, nama: true, email: true } },
        transactions: {
          include: {
            payments: true,
            items: { include: { product: true, variant: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!shift) {
      res.status(404).json({ error: 'Shift tidak ditemukan' });
      return;
    }

    res.json({ shift });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail shift' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  Helper: Calculate kas seharusnya
//  = modalAwal + total Cash received - total Cash change given
// ═══════════════════════════════════════════════════════════════
async function calculateKasSeharusnya(shiftId: string, modalAwal: number): Promise<number> {
  const cashPayments = await prisma.payment.aggregate({
    where: {
      metode: 'cash',
      transaction: {
        shiftId,
        status: 'paid',
      },
    },
    _sum: {
      jumlahDibayar: true,
      kembalian: true,
    },
  });

  const totalCashReceived = cashPayments._sum.jumlahDibayar || 0;
  const totalCashChange = cashPayments._sum.kembalian || 0;

  // kas seharusnya = modal awal + (cash dibayar - kembalian)
  return modalAwal + (totalCashReceived - totalCashChange);
}
