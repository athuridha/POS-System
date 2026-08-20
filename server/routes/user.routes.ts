import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';
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

// ─── POST /api/users — create user (super_admin & manager) ─────────
userRouter.post('/', authenticate, authorize('super_admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    let { email, username, password, nama, role } = req.body;

    if (!nama || !password || !role) {
      res.status(400).json({ error: 'Nama, password, dan role wajib diisi' });
      return;
    }

    if (!['kasir', 'dapur', 'manager', 'super_admin'].includes(role)) {
      res.status(400).json({ error: 'Role tidak valid (kasir, dapur, manager, super_admin)' });
      return;
    }

    const cleanUsername = (username || email || nama).toLowerCase().replace(/\s+/g, '');
    const userEmail = email || `${cleanUsername}@poscafe.id`;

    const existing = await prisma.user.findUnique({ where: { email: userEmail } });
    if (existing) {
      res.status(409).json({ error: 'Username/Email ini sudah terdaftar' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: userEmail,
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
    res.status(500).json({ error: 'Gagal membuat user baru' });
  }
});

// ─── PUT /api/users/:id — update status or user details ─────────
userRouter.put('/:id', authenticate, authorize('super_admin', 'manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, nama, role, password } = req.body;

    let updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (nama !== undefined) updateData.nama = nama;
    if (role !== undefined) updateData.role = role;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
      },
    });

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate user' });
  }
});

// ─── POST /api/users/:id/reset-password ───────────────────────
userRouter.post('/:id/reset-password', authenticate, authorize('super_admin', 'manager'), async (req: AuthRequest, res: Response) => {
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

    res.json({ message: 'Password berhasil direset' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mereset password' });
  }
});
