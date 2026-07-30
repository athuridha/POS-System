import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const userRouter = Router();

// ─── GET /api/users — list all users ─────────────────────────
userRouter.get('/', authenticate, authorize('super_admin', 'manager'), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data user' });
  }
});

// ─── POST /api/users — create user (super_admin only) ─────────
userRouter.post('/', authenticate, authorize('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, nama, role } = req.body;

    if (!email || !password || !nama || !role) {
      res.status(400).json({ error: 'Email, password, nama, dan role wajib diisi' });
      return;
    }

    if (!['kasir', 'manager', 'super_admin'].includes(role)) {
      res.status(400).json({ error: 'Role tidak valid (kasir, manager, super_admin)' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email sudah terdaftar' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nama,
        role,
      },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Gagal membuat user baru' });
  }
});

// ─── PUT /api/users/:id — update user (super_admin only) ──────
userRouter.put('/:id', authenticate, authorize('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nama, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(nama !== undefined && { nama }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate user' });
  }
});

// ─── POST /api/users/:id/reset-password (super_admin only) ──
userRouter.post('/:id/reset-password', authenticate, authorize('super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password baru minimal 6 karakter' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ message: 'Password berhasil di-reset' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal reset password' });
  }
});
