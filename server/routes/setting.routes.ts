import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

export const settingRouter = Router();

// ─── GET /api/settings (Public / Authenticated - Read Cafe Settings) ──
settingRouter.get('/', async (_req: Request, res: Response) => {
  try {
    let setting = await prisma.setting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: 'default',
          namaCafe: 'POS Cafe',
          alamatCafe: '',
          teleponCafe: '',
          footerPesan: 'Terima kasih atas kunjungan Anda!',
          ukuranStruk: '80mm',
          logoUrl: 'https://placehold.co/120x120/10b981/ffffff?text=POS+Cafe',
        },
      });
    }

    res.json({ setting });
  } catch (err: any) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Gagal memuat pengaturan cafe dari database' });
  }
});

// ─── PUT /api/settings (Admin/Manager - Update Cafe Settings) ───────
const managerAuth = authorize('super_admin', 'manager');
settingRouter.put('/', authenticate, managerAuth as any, async (req: AuthRequest, res: Response) => {
  try {
    const { namaCafe, alamatCafe, teleponCafe, footerPesan, ukuranStruk, logoUrl } = req.body;

    const setting = await prisma.setting.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        namaCafe: namaCafe || 'POS Cafe',
        alamatCafe: alamatCafe || '',
        teleponCafe: teleponCafe || '',
        footerPesan: footerPesan || 'Terima kasih atas kunjungan Anda!',
        ukuranStruk: ukuranStruk || '80mm',
        logoUrl: logoUrl || 'https://placehold.co/120x120/10b981/ffffff?text=POS+Cafe',
      },
      update: {
        ...(namaCafe !== undefined && { namaCafe }),
        ...(alamatCafe !== undefined && { alamatCafe }),
        ...(teleponCafe !== undefined && { teleponCafe }),
        ...(footerPesan !== undefined && { footerPesan }),
        ...(ukuranStruk !== undefined && { ukuranStruk }),
        ...(logoUrl !== undefined && { logoUrl }),
      },
    });

    res.json({ message: 'Pengaturan berhasil diperbarui di database', setting });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan cafe di database' });
  }
});
