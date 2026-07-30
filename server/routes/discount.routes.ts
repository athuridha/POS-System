import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const discountRouter = Router();

// GET /api/discounts — list all discounts
discountRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { activeOnly } = req.query;

    const discounts = await prisma.discount.findMany({
      where: activeOnly === 'true' ? { isActive: true } : {},
      orderBy: { createdAt: 'desc' },
    });

    res.json({ discounts });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data diskon' });
  }
});

// POST /api/discounts — create discount (manager only)
discountRouter.post('/', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { kodeVoucher, tipe, nilai, minBelanja, startDate, endDate } = req.body;

    if (!kodeVoucher || !tipe || nilai === undefined) {
      res.status(400).json({ error: 'kodeVoucher, tipe, dan nilai wajib diisi' });
      return;
    }

    if (!['persentase', 'nominal'].includes(tipe)) {
      res.status(400).json({ error: 'Tipe harus "persentase" atau "nominal"' });
      return;
    }

    const existing = await prisma.discount.findUnique({ where: { kodeVoucher } });
    if (existing) {
      res.status(409).json({ error: 'Kode voucher sudah dipakai' });
      return;
    }

    const discount = await prisma.discount.create({
      data: {
        kodeVoucher: kodeVoucher.toUpperCase(),
        tipe,
        nilai,
        minBelanja: minBelanja || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({ discount });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat diskon' });
  }
});

// PUT /api/discounts/:id — update discount (manager only)
discountRouter.put('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { kodeVoucher, tipe, nilai, minBelanja, isActive, startDate, endDate } = req.body;

    const discount = await prisma.discount.update({
      where: { id: req.params.id },
      data: {
        ...(kodeVoucher !== undefined && { kodeVoucher: kodeVoucher.toUpperCase() }),
        ...(tipe !== undefined && { tipe }),
        ...(nilai !== undefined && { nilai }),
        ...(minBelanja !== undefined && { minBelanja }),
        ...(isActive !== undefined && { isActive }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    res.json({ discount });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate diskon' });
  }
});

// DELETE /api/discounts/:id — deactivate discount (manager only)
discountRouter.delete('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.discount.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Diskon berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus diskon' });
  }
});

// POST /api/discounts/validate — validate voucher code
discountRouter.post('/validate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { kodeVoucher, subtotal } = req.body;

    if (!kodeVoucher) {
      res.status(400).json({ error: 'Kode voucher wajib diisi' });
      return;
    }

    const discount = await prisma.discount.findUnique({
      where: { kodeVoucher: kodeVoucher.toUpperCase() },
    });

    if (!discount || !discount.isActive) {
      res.status(404).json({ error: 'Voucher tidak ditemukan atau tidak aktif' });
      return;
    }

    // Check date range
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      res.status(400).json({ error: 'Voucher belum berlaku' });
      return;
    }
    if (discount.endDate && now > discount.endDate) {
      res.status(400).json({ error: 'Voucher sudah expired' });
      return;
    }

    // Check minimum spending
    if (subtotal && subtotal < discount.minBelanja) {
      res.status(400).json({
        error: `Minimum belanja Rp ${discount.minBelanja.toLocaleString('id-ID')} untuk voucher ini`,
      });
      return;
    }

    // Calculate discount amount
    let potongan = 0;
    if (subtotal) {
      if (discount.tipe === 'persentase') {
        potongan = Math.floor(subtotal * (discount.nilai / 100));
      } else {
        potongan = discount.nilai;
      }
    }

    res.json({
      valid: true,
      discount,
      potongan,
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memvalidasi voucher' });
  }
});
