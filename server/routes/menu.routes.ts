import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const categoriesRouter = Router();
const productsRouter = Router();

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES
// ═══════════════════════════════════════════════════════════════

// GET /api/categories — list all categories with products (public for kasir cache)
categoriesRouter.get('/', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: { variants: { where: { isActive: true } } },
          orderBy: { namaProduk: 'asc' },
        },
      },
      orderBy: { urutan: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// POST /api/categories — create category (manager only)
categoriesRouter.post('/', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { namaKategori, urutan } = req.body;

    if (!namaKategori) {
      res.status(400).json({ error: 'Nama kategori wajib diisi' });
      return;
    }

    const category = await prisma.category.create({
      data: { namaKategori, urutan: urutan || 0 },
    });

    res.status(201).json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

// PUT /api/categories/:id — update category (manager only)
categoriesRouter.put('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaKategori, urutan, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(namaKategori !== undefined && { namaKategori }),
        ...(urutan !== undefined && { urutan }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate kategori' });
  }
});

// DELETE /api/categories/:id — soft delete category (manager only)
categoriesRouter.delete('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

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

// PUT /api/products/:id — update product (manager only)
productsRouter.put('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaProduk, categoryId, hargaDasar, imageUrl, deskripsi, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(namaProduk !== undefined && { namaProduk }),
        ...(categoryId !== undefined && { categoryId }),
        ...(hargaDasar !== undefined && { hargaDasar }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(deskripsi !== undefined && { deskripsi }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { variants: true, category: true },
    });

    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate produk' });
  }
});

// DELETE /api/products/:id — soft delete (manager only)
productsRouter.delete('/:id', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Produk berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

// ─── Product Variants ────────────────────────────────────────

// POST /api/products/:id/variants — add variant
productsRouter.post('/:id/variants', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { namaVarian, hargaTambahan } = req.body;

    if (!namaVarian) {
      res.status(400).json({ error: 'Nama varian wajib diisi' });
      return;
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId: req.params.id,
        namaVarian,
        hargaTambahan: hargaTambahan || 0,
      },
    });

    res.status(201).json({ variant });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah varian' });
  }
});

// PUT /api/products/:productId/variants/:variantId
productsRouter.put('/:productId/variants/:variantId', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const { namaVarian, hargaTambahan, isActive } = req.body;

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        ...(namaVarian !== undefined && { namaVarian }),
        ...(hargaTambahan !== undefined && { hargaTambahan }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ variant });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate varian' });
  }
});

// DELETE /api/products/:productId/variants/:variantId
productsRouter.delete('/:productId/variants/:variantId', authenticate, authorize('manager'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.productVariant.update({
      where: { id: req.params.variantId },
      data: { isActive: false },
    });

    res.json({ message: 'Varian berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus varian' });
  }
});

export const menuRouter = {
  categories: categoriesRouter,
  products: productsRouter,
};
