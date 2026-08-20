import { Router, Request, Response } from 'express';
import { put } from '@vercel/blob';
import { authenticate } from '../middleware/auth';

export const uploadRouter = Router();

// ─── POST /api/upload (Vercel Blob Upload) ─────────────────────────
uploadRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { image, filename = `upload-${Date.now()}.png`, folder = 'pos-cafe' } = req.body;

    if (!image) {
      res.status(400).json({ error: 'Data gambar (base64/data URL) wajib dikirim' });
      return;
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    // Extract mime type and base64 buffer from data URL
    let buffer: Buffer;
    let contentType = 'image/png';

    if (image.startsWith('data:')) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(image, 'base64');
      }
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobPath = `${folder}/${Date.now()}-${cleanFilename}`;

    if (token) {
      // Upload to Vercel Blob Storage
      const blob = await put(blobPath, buffer, {
        access: 'public',
        token,
        contentType,
      });

      res.json({
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname: blob.pathname,
        contentType: blob.contentType,
      });
      return;
    }

    // Fallback if token is not configured yet (e.g. offline testing)
    console.warn('⚠️ [Vercel Blob] BLOB_READ_WRITE_TOKEN is not set. Returning data URL.');
    res.json({
      url: image,
      pathname: blobPath,
      contentType,
      warning: 'Uploaded locally as Data URL because BLOB_READ_WRITE_TOKEN is not set',
    });
  } catch (err: any) {
    console.error('Vercel Blob upload error:', err);
    res.status(500).json({
      error: err?.message || 'Gagal mengupload gambar ke Vercel Blob Storage',
    });
  }
});
