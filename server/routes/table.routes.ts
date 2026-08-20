import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const tableRouter = Router();

// GET /api/tables — list all tables
tableRouter.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { nomorMeja: 'asc' },
    });

    res.json({ tables });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data meja' });
  }
});

// POST /api/tables — create table (manager only)
tableRouter.post('/', authenticate, authorize('manager') as any, async (req: AuthRequest, res: Response) => {
  try {
    const { nomorMeja, kapasitas } = req.body;

    if (!nomorMeja) {
      res.status(400).json({ error: 'Nomor meja wajib diisi' });
      return;
    }

    const existing = await prisma.table.findUnique({ where: { nomorMeja } });
    if (existing) {
      res.status(409).json({ error: 'Nomor meja sudah dipakai' });
      return;
    }

    const table = await prisma.table.create({
      data: { nomorMeja, kapasitas: kapasitas || 4 },
    });

    res.status(201).json({ table });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat meja' });
  }
});

// PUT /api/tables/:id — update table (manager only)
tableRouter.put('/:id', authenticate, authorize('manager') as any, async (req: AuthRequest, res: Response) => {
  try {
    const { nomorMeja, kapasitas } = req.body;

    const table = await prisma.table.update({
      where: { id: String(req.params?.id ?? '') as string },
      data: {
        ...(nomorMeja !== undefined && { nomorMeja }),
        ...(kapasitas !== undefined && { kapasitas }),
      },
    });

    res.json({ table });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate meja' });
  }
});

// PATCH /api/tables/:id/status — update table status (kasir can do this)
tableRouter.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;

    if (!status || !['kosong', 'terisi'].includes(status)) {
      res.status(400).json({ error: 'Status harus "kosong" atau "terisi"' });
      return;
    }

    const table = await prisma.table.update({
      where: { id: String(req.params?.id ?? '') as string },
      data: { status },
    });

    res.json({ table });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate status meja' });
  }
});

// DELETE /api/tables/:id — delete table (manager only)
tableRouter.delete('/:id', authenticate, authorize('manager') as any, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.table.delete({ where: { id: String(req.params?.id ?? '') as string } });
    res.json({ message: 'Meja berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus meja' });
  }
});
