import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// ─── POST /api/auth/login ────────────────────────────────────
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email dan password wajib diisi' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ error: 'Email atau password salah' });
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────
authRouter.post('/refresh', async (req, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token wajib diisi' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User tidak ditemukan atau tidak aktif' });
      return;
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      nama: user.nama,
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token tidak valid' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, nama: true, role: true, isActive: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan' });
      return;
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
