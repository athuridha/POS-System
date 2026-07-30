import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const syncRouter = Router();

/**
 * POST /api/sync/transactions
 * Batch upsert transactions by clientUuid — idempotent sync endpoint.
 * Receives array of transactions created offline, inserts only those
 * that don't already exist (by clientUuid).
 */
syncRouter.post('/transactions', authenticate, authorize('kasir', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({ error: 'Array transactions wajib diisi' });
      return;
    }

    const results: Array<{
      clientUuid: string;
      status: 'created' | 'exists' | 'error';
      transactionId?: string;
      error?: string;
    }> = [];

    for (const tx of transactions) {
      try {
        // Check if already exists
        const existing = await prisma.transaction.findUnique({
          where: { clientUuid: tx.clientUuid },
        });

        if (existing) {
          // Already synced — skip (idempotent)
          results.push({
            clientUuid: tx.clientUuid,
            status: 'exists',
            transactionId: existing.id,
          });
          continue;
        }

        // Validate shift exists
        const shift = await prisma.shift.findUnique({ where: { id: tx.shiftId } });
        if (!shift) {
          results.push({
            clientUuid: tx.clientUuid,
            status: 'error',
            error: 'Shift tidak ditemukan',
          });
          continue;
        }

        // Create the transaction
        const created = await prisma.transaction.create({
          data: {
            clientUuid: tx.clientUuid,
            shiftId: tx.shiftId,
            tableId: tx.tableId || null,
            tipeOrder: tx.tipeOrder,
            status: tx.status || 'paid',
            subtotal: tx.subtotal,
            diskon: tx.diskon || 0,
            pajak: tx.pajak || 0,
            total: tx.total,
            catatan: tx.catatan || null,
            discountId: tx.discountId || null,
            createdAt: new Date(tx.createdAt),
            syncedAt: new Date(),
            items: {
              create: (tx.items || []).map((item: any) => ({
                productId: item.productId,
                variantId: item.variantId || null,
                jumlah: item.jumlah,
                hargaSatuan: item.hargaSatuan,
                hargaTotal: item.hargaTotal,
                catatan: item.catatan || null,
              })),
            },
            payments: {
              create: (tx.payments || []).map((p: any) => ({
                metode: p.metode,
                jumlahDibayar: p.jumlahDibayar,
                kembalian: p.kembalian || 0,
                referensiGateway: p.referensiGateway || null,
              })),
            },
          },
        });

        // Update table status if dine-in
        if (tx.tableId) {
          await prisma.table.update({
            where: { id: tx.tableId },
            data: { status: 'terisi' },
          }).catch(() => {}); // Ignore if table doesn't exist
        }

        results.push({
          clientUuid: tx.clientUuid,
          status: 'created',
          transactionId: created.id,
        });
      } catch (itemErr: any) {
        results.push({
          clientUuid: tx.clientUuid,
          status: 'error',
          error: itemErr.message,
        });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const exists = results.filter((r) => r.status === 'exists').length;
    const errors = results.filter((r) => r.status === 'error').length;

    res.json({
      summary: { total: results.length, created, exists, errors },
      results,
    });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'Gagal menyinkronkan transaksi' });
  }
});
