import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// ─── POST /api/auth/login (Support Username or Email Login) ───
authRouter.post('/login', async (req, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      res.status(400).json({ error: 'Username/Email dan password wajib diisi' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { isActive: true },
    });

    const user = users.find((u) => {
      const uEmail = u.email.toLowerCase();
      const uPrefix = uEmail.split('@')[0];
      const uNama = u.nama.toLowerCase().replace(/\s+/g, '');
      const idLower = identifier.toLowerCase().replace(/\s+/g, '');

      return (
        uEmail === idLower ||
        uPrefix === idLower ||
        uNama === idLower
      );
    });

    if (!user) {
      res.status(401).json({ error: 'Username/Email atau password salah' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({ error: 'Username/Email atau password salah' });
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

// ─── GET /api/auth/me ─────────────────────────────────────────
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        nama: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
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

// ─── POST /api/auth/refresh ──────────────────────────────────
authRouter.post('/refresh', async (req, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token wajib disertakan' });
      return;
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
      email: string;
      role: string;
      nama: string;
    };

    const newPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      nama: payload.nama,
    };

    const accessToken = jwt.sign(newPayload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Refresh token tidak valid atau expired' });
  }
});
