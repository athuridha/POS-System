import { Router, Response } from 'react';
import { Router as ExpressRouter } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = ExpressRouter();

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════

// GET /api/categories — list all categories with their products & variants
router.get('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            variants: {
              where: { isActive: true },
            },
          },
          orderBy: { namaProduk: 'asc' },
        },
      },
      orderBy: { namaKategori: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// POST /api/categories — create category (manager only)
router.post('/categories', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { namaKategori } = req.body;
    if (!namaKategori) {
      res.status(400).json({ error: 'namaKategori wajib diisi' });
      return;
    }

    const category = await prisma.category.create({
      data: { namaKategori },
    });

    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

// PUT /api/categories/:id — update category (manager only)
router.put('/categories/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaKategori } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: { namaKategori },
    });

    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate kategori' });
  }
});

// DELETE /api/categories/:id — soft delete category (manager only)
router.delete('/categories/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Soft delete category
    await prisma.category.update({
      where: { id },
      data: { isActive: false },
    });

    // Also deactivate all products in this category
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { isActive: false },
    });

    res.json({ message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PRODUCTS
// ═══════════════════════════════════════════════════════════════

// GET /api/products — list all products with variants
const productsRouter = ExpressRouter();

productsRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, includeInactive } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId: categoryId as string }),
        ...(includeInactive !== 'true' && { isActive: true }),
      },
      include: {
        category: true,
        variants: {
          where: includeInactive === 'true' ? {} : { isActive: true },
        },
      },
      orderBy: { namaProduk: 'asc' },
    });

    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// GET /api/products/:id — product detail
productsRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, variants: true },
    });

    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail produk' });
  }
});

// POST /api/products — create product (manager only)
productsRouter.post('/', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, namaProduk, hargaDasar, imageUrl, deskripsi, variants } = req.body;

    if (!categoryId || !namaProduk || hargaDasar === undefined) {
      res.status(400).json({ error: 'categoryId, namaProduk, dan hargaDasar wajib diisi' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        namaProduk,
        hargaDasar,
        imageUrl,
        deskripsi,
        variants: variants?.length
          ? {
              create: variants.map((v: { namaVarian: string; hargaTambahan: number }) => ({
                namaVarian: v.namaVarian,
                hargaTambahan: v.hargaTambahan || 0,
              })),
            }
          : undefined,
      },
      include: { variants: true, category: true },
    });

    res.status(201).json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat produk' });
  }
});

// PUT /api/products/:id — update product & variants (manager only)
productsRouter.put('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaProduk, categoryId, hargaDasar, imageUrl, deskripsi, isActive, variants } = req.body;

    await prisma.product.update({
      where: { id },
      data: {
        ...(namaProduk !== undefined && { namaProduk }),
        ...(categoryId !== undefined && { categoryId }),
        ...(hargaDasar !== undefined && { hargaDasar }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Sync variants if provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v: { namaVarian: string; hargaTambahan: number }) => ({
            productId: id,
            namaVarian: v.namaVarian,
            hargaTambahan: v.hargaTambahan || 0,
          })),
        });
      }
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });

    res.json({ product: updatedProduct });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate produk' });
  }
});

// DELETE /api/products/:id — soft delete product (manager only)
productsRouter.delete('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

export { router as categoryRouter, productsRouter };
