import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const transactionRouter = Router();

// ─── POST /api/transactions/public — create unpaid self-order ──
transactionRouter.post('/public', async (req, res) => {
  try {
    const { clientUuid, tipeOrder, tableId, items, catatan } = req.body;

    if (!clientUuid || !items?.length) {
      res.status(400).json({ error: 'clientUuid dan items wajib diisi' });
      return;
    }

    const existing = await prisma.transaction.findUnique({
      where: { clientUuid },
      include: { items: true },
    });

    if (existing) {
      res.json({ transaction: existing, message: 'Pesanan sudah ada' });
      return;
    }

    // Get any active shift
    const activeShift = await prisma.shift.findFirst({
      where: { status: 'open' },
      orderBy: { waktuBuka: 'desc' },
    });

    if (!activeShift) {
      res.status(400).json({ error: 'Kasir belum membuka shift. Silakan hubungi kasir.' });
      return;
    }

    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isActive) {
        res.status(400).json({ error: `Produk ${item.productId} tidak tersedia` });
        return;
      }

      let hargaSatuan = product.hargaDasar;
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (variant && variant.isActive) {
          hargaSatuan += variant.hargaTambahan;
        }
      }

      const hargaTotal = hargaSatuan * item.jumlah;
      subtotal += hargaTotal;

      itemsData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        jumlah: item.jumlah,
        hargaSatuan,
        hargaTotal,
        catatan: item.catatan || null,
      });
    }

    const total = subtotal;

    const transaction = await prisma.transaction.create({
      data: {
        clientUuid,
        shiftId: activeShift.id,
        tableId: tableId || null,
        tipeOrder: tipeOrder || 'dine_in',
        status: 'unpaid',
        subtotal,
        diskon: 0,
        pajak: 0,
        total,
        catatan: catatan || null,
        createdAt: new Date(),
        syncedAt: new Date(),
        items: { create: itemsData },
      },
      include: {
        items: { include: { product: true, variant: true } },
        table: true,
      },
    });

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'terisi' },
      });
    }

    res.status(201).json({ transaction });
  } catch (err) {
    console.error('Public order error:', err);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
});

// ─── POST /api/transactions — create transaction (online paid by kasir) ────
transactionRouter.post('/', authenticate, authorize('kasir', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientUuid,
      tipeOrder,
      tableId,
      items,
      payments,
      discountId,
      catatan,
    } = req.body;

    if (!clientUuid || !tipeOrder || !items?.length || !payments?.length) {
      res.status(400).json({
        error: 'clientUuid, tipeOrder, items, dan payments wajib diisi',
      });
      return;
    }

    const existing = await prisma.transaction.findUnique({
      where: { clientUuid },
      include: { items: true, payments: true },
    });

    if (existing) {
      res.json({ transaction: existing, message: 'Transaksi sudah ada (idempotent)' });
      return;
    }

    const activeShift = await prisma.shift.findFirst({
      where: { kasirId: req.user!.userId, status: 'open' },
    });

    if (!activeShift) {
      res.status(400).json({ error: 'Anda belum membuka shift. Buka shift terlebih dahulu.' });
      return;
    }

    let subtotal = 0;
    const itemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || !product.isActive) {
        res.status(400).json({ error: `Produk ${item.productId} tidak ditemukan atau tidak aktif` });
        return;
      }

      let hargaSatuan = product.hargaDasar;

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          res.status(400).json({ error: `Varian ${item.variantId} tidak ditemukan atau tidak aktif` });
          return;
        }
        hargaSatuan += variant.hargaTambahan;
      }

      const hargaTotal = hargaSatuan * item.jumlah;
      subtotal += hargaTotal;

      itemsData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        jumlah: item.jumlah,
        hargaSatuan,
        hargaTotal,
        catatan: item.catatan || null,
      });
    }

    let diskon = 0;
    if (discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (discount && discount.isActive) {
        if (subtotal >= discount.minBelanja) {
          if (discount.tipe === 'persentase') {
            diskon = Math.floor(subtotal * (discount.nilai / 100));
          } else {
            diskon = discount.nilai;
          }
        }
      }
    }

    const pajak = 0;
    const total = subtotal - diskon + pajak;

    const totalPayment = payments.reduce((sum: number, p: any) => sum + p.jumlahDibayar, 0);
    if (totalPayment < total) {
      res.status(400).json({
        error: `Jumlah pembayaran (${totalPayment}) kurang dari total (${total})`,
      });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        clientUuid,
        shiftId: activeShift.id,
        tableId: tableId || null,
        tipeOrder,
        status: 'paid',
        subtotal,
        diskon,
        pajak,
        total,
        catatan: catatan || null,
        discountId: discountId || null,
        createdAt: new Date(),
        syncedAt: new Date(),
        items: {
          create: itemsData,
        },
        payments: {
          create: payments.map((p: any) => ({
            metode: p.metode,
            jumlahDibayar: p.jumlahDibayar,
            kembalian: p.kembalian || 0,
            referensiGateway: p.referensiGateway || null,
          })),
        },
      },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        payments: true,
        shift: {
          include: {
            kasir: { select: { nama: true } },
          },
        },
        table: true,
      },
    });

    if (tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'terisi' },
      });
    }

    res.status(201).json({ transaction });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Gagal membuat transaksi' });
  }
});

// ─── PATCH /api/transactions/:id/pay — pay unpaid transaction ──
transactionRouter.patch('/:id/pay', authenticate, authorize('kasir', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { payments, discountId } = req.body;

    const existingTx = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTx) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }

    const activeShift = await prisma.shift.findFirst({
      where: { kasirId: req.user!.userId, status: 'open' },
    });

    if (!activeShift) {
      res.status(400).json({ error: 'Buka shift terlebih dahulu sebelum menerima pembayaran' });
      return;
    }

    let diskon = 0;
    if (discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: discountId } });
      if (discount && discount.isActive && existingTx.subtotal >= discount.minBelanja) {
        diskon = discount.tipe === 'persentase' ? Math.floor(existingTx.subtotal * (discount.nilai / 100)) : discount.nilai;
      }
    }

    const total = existingTx.subtotal - diskon;

    await prisma.payment.deleteMany({ where: { transactionId: existingTx.id } });

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        status: 'paid',
        shiftId: activeShift.id,
        diskon,
        total,
        discountId: discountId || null,
        payments: {
          create: (payments || []).map((p: any) => ({
            metode: p.metode,
            jumlahDibayar: p.jumlahDibayar,
            kembalian: p.kembalian || 0,
            referensiGateway: p.referensiGateway || null,
          })),
        },
      },
      include: {
        items: { include: { product: true, variant: true } },
        payments: true,
        table: true,
      },
    });

    res.json({ transaction, message: 'Pembayaran berhasil diselesaikan' });
  } catch (err) {
    console.error('Pay transaction error:', err);
    res.status(500).json({ error: 'Gagal memproses pembayaran' });
  }
});

// ─── GET /api/transactions — list transactions ───────────────
transactionRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, shiftId, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = {};

    if (startDate) {
      where.createdAt = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    }
    if (shiftId) where.shiftId = shiftId;
    if (status) where.status = status;

    if (req.user!.role === 'kasir' && status !== 'unpaid') {
      where.shift = { kasirId: req.user!.userId };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          payments: true,
          shift: { include: { kasir: { select: { id: true, nama: true } } } },
          table: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data transaksi' });
  }
});

// ─── GET /api/transactions/:id — transaction detail ──────────
transactionRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true, variant: true } },
        payments: true,
        shift: { include: { kasir: { select: { id: true, nama: true } } } },
        table: true,
        discount: true,
      },
    });

    if (!transaction) {
      res.status(404).json({ error: 'Transaksi tidak ditemukan' });
      return;
    }

    res.json({ transaction });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail transaksi' });
  }
});

// ─── PATCH /api/transactions/:id/void — void transaction ─────
transactionRouter.patch('/:id/void', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'void' },
    });

    if (transaction.tableId) {
      await prisma.table.update({
        where: { id: transaction.tableId },
        data: { status: 'kosong' },
      });
    }

    res.json({ transaction, message: 'Transaksi berhasil di-void' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal void transaksi' });
  }
});
