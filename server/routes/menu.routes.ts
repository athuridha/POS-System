import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

// ═══════════════════════════════════════════════════════════════
//  CATEGORIES ROUTER (/api/categories)
// ═══════════════════════════════════════════════════════════════
const categoriesRouter = Router();

// GET /api/categories — list all categories with active products & variants
categoriesRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
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
      orderBy: { urutan: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// POST /api/categories — create category (manager & super_admin)
categoriesRouter.post('/', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { namaKategori, urutan } = req.body;
    if (!namaKategori || !namaKategori.trim()) {
      res.status(400).json({ error: 'namaKategori wajib diisi' });
      return;
    }

    const category = await prisma.category.create({
      data: {
        namaKategori: namaKategori.trim(),
        urutan: urutan ? parseInt(urutan, 10) : 0,
        isActive: true,
      },
      include: {
        products: true,
      },
    });

    res.status(201).json({ category });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

// PUT /api/categories/:id — update category (manager & super_admin)
categoriesRouter.put('/:id', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaKategori, urutan, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(namaKategori !== undefined && { namaKategori: namaKategori.trim() }),
        ...(urutan !== undefined && { urutan: parseInt(urutan, 10) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
      include: {
        products: {
          include: { variants: true },
        },
      },
    });

    res.json({ category });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Gagal mengupdate kategori' });
  }
});

// DELETE /api/categories/:id — soft delete category (manager & super_admin)
categoriesRouter.delete('/:id', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
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

    res.json({ message: 'Kategori dan produk terkait berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

// ═══════════════════════════════════════════════════════════════
//  PRODUCTS ROUTER (/api/products)
// ═══════════════════════════════════════════════════════════════
const productsRouter = Router();

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
    console.error('Error fetching products:', err);
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
    console.error('Error fetching product detail:', err);
    res.status(500).json({ error: 'Gagal mengambil detail produk' });
  }
});

// POST /api/products — create product (manager & super_admin)
productsRouter.post('/', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, namaProduk, hargaDasar, imageUrl, deskripsi, variants } = req.body;

    if (!categoryId || !namaProduk || hargaDasar === undefined) {
      res.status(400).json({ error: 'categoryId, namaProduk, dan hargaDasar wajib diisi' });
      return;
    }

    const parsedPrice = parseInt(String(hargaDasar), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      res.status(400).json({ error: 'Harga dasar harus berupa angka positif' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        categoryId,
        namaProduk: namaProduk.trim(),
        hargaDasar: parsedPrice,
        imageUrl: imageUrl || null,
        deskripsi: deskripsi || null,
        isActive: true,
        variants: variants?.length
          ? {
              create: variants
                .filter((v: { namaVarian: string }) => v.namaVarian && v.namaVarian.trim())
                .map((v: { namaVarian: string; hargaTambahan: any }) => ({
                  namaVarian: v.namaVarian.trim(),
                  hargaTambahan: parseInt(String(v.hargaTambahan || 0), 10) || 0,
                  isActive: true,
                })),
            }
          : undefined,
      },
      include: { variants: true, category: true },
    });

    res.status(201).json({ product });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Gagal membuat produk' });
  }
});

// PUT /api/products/:id — update product & variants (manager & super_admin)
productsRouter.put('/:id', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { namaProduk, categoryId, hargaDasar, imageUrl, deskripsi, isActive, variants } = req.body;

    const parsedPrice = hargaDasar !== undefined ? parseInt(String(hargaDasar), 10) : undefined;

    await prisma.product.update({
      where: { id },
      data: {
        ...(namaProduk !== undefined && { namaProduk: namaProduk.trim() }),
        ...(categoryId !== undefined && { categoryId }),
        ...(parsedPrice !== undefined && { hargaDasar: parsedPrice }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(deskripsi !== undefined && { deskripsi: deskripsi || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    // Sync variants if provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      const validVariants = variants
        .filter((v: { namaVarian: string }) => v.namaVarian && v.namaVarian.trim())
        .map((v: { namaVarian: string; hargaTambahan: any }) => ({
          productId: id,
          namaVarian: v.namaVarian.trim(),
          hargaTambahan: parseInt(String(v.hargaTambahan || 0), 10) || 0,
          isActive: true,
        }));

      if (validVariants.length > 0) {
        await prisma.productVariant.createMany({
          data: validVariants,
        });
      }
    }

    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true },
    });

    res.json({ product: updatedProduct });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Gagal mengupdate produk' });
  }
});

// DELETE /api/products/:id — soft delete product (manager & super_admin)
productsRouter.delete('/:id', authenticate, authorize('manager', 'super_admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

export const menuRouter = {
  categories: categoriesRouter,
  products: productsRouter,
};
