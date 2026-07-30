import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Users ───────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const kasirPassword = await bcrypt.hash('kasir123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@poscafe.id' },
    update: {},
    create: {
      email: 'superadmin@poscafe.id',
      passwordHash: superAdminPassword,
      nama: 'Super Admin',
      role: 'super_admin',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@poscafe.id' },
    update: {},
    create: {
      email: 'manager@poscafe.id',
      passwordHash: managerPassword,
      nama: 'Rendra Mahardika',
      role: 'manager',
    },
  });

  const kasir1 = await prisma.user.upsert({
    where: { email: 'kasir1@poscafe.id' },
    update: {},
    create: {
      email: 'kasir1@poscafe.id',
      passwordHash: kasirPassword,
      nama: 'Dita Pramesti',
      role: 'kasir',
    },
  });

  const kasir2 = await prisma.user.upsert({
    where: { email: 'kasir2@poscafe.id' },
    update: {},
    create: {
      email: 'kasir2@poscafe.id',
      passwordHash: kasirPassword,
      nama: 'Bagus Wicaksono',
      role: 'kasir',
    },
  });

  console.log('Users created:', superAdmin.nama, manager.nama, kasir1.nama, kasir2.nama);

  // Check if categories already exist
  const existingCategory = await prisma.category.findFirst();
  if (existingCategory) {
    console.log('Menu and categories already seeded. Skipping product creation.');
    return;
  }

  // ─── Categories ──────────────────────────────────────────
  const catKopi = await prisma.category.create({
    data: { namaKategori: 'Kopi', urutan: 1 },
  });
  const catNonKopi = await prisma.category.create({
    data: { namaKategori: 'Non-Kopi', urutan: 2 },
  });
  const catMakanan = await prisma.category.create({
    data: { namaKategori: 'Makanan', urutan: 3 },
  });
  const catSnack = await prisma.category.create({
    data: { namaKategori: 'Snack & Dessert', urutan: 4 },
  });

  console.log('Categories created');

  // ─── Products + Variants ─────────────────────────────────
  // Kopi
  const espresso = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Espresso',
      hargaDasar: 18000,
      deskripsi: 'Single shot espresso arabica',
      variants: {
        create: [
          { namaVarian: 'Single Shot', hargaTambahan: 0 },
          { namaVarian: 'Double Shot', hargaTambahan: 6000 },
        ],
      },
    },
  });

  const americano = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Americano',
      hargaDasar: 22000,
      deskripsi: 'Espresso + hot water',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const caffeLatte = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Caffe Latte',
      hargaDasar: 28000,
      deskripsi: 'Espresso + steamed milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
          { namaVarian: 'Extra Shot', hargaTambahan: 6000 },
        ],
      },
    },
  });

  const cappuccino = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Cappuccino',
      hargaDasar: 28000,
      deskripsi: 'Espresso + steamed milk + foam',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const mocha = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Mocha Latte',
      hargaDasar: 32000,
      deskripsi: 'Espresso + chocolate + steamed milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const vietDrip = await prisma.product.create({
    data: {
      categoryId: catKopi.id,
      namaProduk: 'Vietnamese Drip',
      hargaDasar: 25000,
      deskripsi: 'Robusta drip + condensed milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  // Non-Kopi
  const matchaLatte = await prisma.product.create({
    data: {
      categoryId: catNonKopi.id,
      namaProduk: 'Matcha Latte',
      hargaDasar: 30000,
      deskripsi: 'Japanese matcha + steamed milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const chocoLatte = await prisma.product.create({
    data: {
      categoryId: catNonKopi.id,
      namaProduk: 'Chocolate Latte',
      hargaDasar: 28000,
      deskripsi: 'Premium dark chocolate + milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const taro = await prisma.product.create({
    data: {
      categoryId: catNonKopi.id,
      namaProduk: 'Taro Latte',
      hargaDasar: 28000,
      deskripsi: 'Creamy taro + milk',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  const lemonTea = await prisma.product.create({
    data: {
      categoryId: catNonKopi.id,
      namaProduk: 'Lemon Tea',
      hargaDasar: 18000,
      deskripsi: 'Black tea + fresh lemon',
      variants: {
        create: [
          { namaVarian: 'Hot', hargaTambahan: 0 },
          { namaVarian: 'Iced', hargaTambahan: 3000 },
        ],
      },
    },
  });

  // Makanan
  const nasiGoreng = await prisma.product.create({
    data: {
      categoryId: catMakanan.id,
      namaProduk: 'Nasi Goreng Spesial',
      hargaDasar: 35000,
      deskripsi: 'Nasi goreng + telur + ayam suwir',
      variants: {
        create: [
          { namaVarian: 'Regular', hargaTambahan: 0 },
          { namaVarian: 'Extra Ayam', hargaTambahan: 8000 },
        ],
      },
    },
  });

  const indomie = await prisma.product.create({
    data: {
      categoryId: catMakanan.id,
      namaProduk: 'Indomie Goreng',
      hargaDasar: 20000,
      deskripsi: 'Indomie goreng + telur + sayuran',
      variants: {
        create: [
          { namaVarian: 'Goreng', hargaTambahan: 0 },
          { namaVarian: 'Kuah', hargaTambahan: 0 },
          { namaVarian: 'Double', hargaTambahan: 8000 },
        ],
      },
    },
  });

  const sandwich = await prisma.product.create({
    data: {
      categoryId: catMakanan.id,
      namaProduk: 'Club Sandwich',
      hargaDasar: 38000,
      deskripsi: 'Roti panggang + ayam + telur + sayuran',
    },
  });

  const pasta = await prisma.product.create({
    data: {
      categoryId: catMakanan.id,
      namaProduk: 'Aglio Olio',
      hargaDasar: 42000,
      deskripsi: 'Spaghetti + garlic + chili flakes + olive oil',
      variants: {
        create: [
          { namaVarian: 'Chicken', hargaTambahan: 0 },
          { namaVarian: 'Beef', hargaTambahan: 10000 },
        ],
      },
    },
  });

  // Snack & Dessert
  const frenchFries = await prisma.product.create({
    data: {
      categoryId: catSnack.id,
      namaProduk: 'French Fries',
      hargaDasar: 22000,
      deskripsi: 'Crispy fries + seasoning',
      variants: {
        create: [
          { namaVarian: 'Regular', hargaTambahan: 0 },
          { namaVarian: 'Cheese', hargaTambahan: 5000 },
          { namaVarian: 'Truffle', hargaTambahan: 10000 },
        ],
      },
    },
  });

  const rotiBarang = await prisma.product.create({
    data: {
      categoryId: catSnack.id,
      namaProduk: 'Banana Toast',
      hargaDasar: 25000,
      deskripsi: 'Roti panggang + pisang + madu + kayu manis',
    },
  });

  const brownies = await prisma.product.create({
    data: {
      categoryId: catSnack.id,
      namaProduk: 'Brownies',
      hargaDasar: 28000,
      deskripsi: 'Fudgy chocolate brownies',
      variants: {
        create: [
          { namaVarian: 'Original', hargaTambahan: 0 },
          { namaVarian: 'Ice Cream', hargaTambahan: 8000 },
        ],
      },
    },
  });

  console.log('Products created');

  // ─── Tables ──────────────────────────────────────────────
  const tables = [];
  for (let i = 1; i <= 10; i++) {
    const nomorMeja = `M${i.toString().padStart(2, '0')}`;
    const table = await prisma.table.upsert({
      where: { nomorMeja },
      update: {},
      create: {
        nomorMeja,
        kapasitas: i <= 6 ? 4 : 6,
      },
    });
    tables.push(table);
  }

  console.log('Tables created:', tables.length);

  // ─── Sample Discount ─────────────────────────────────────
  await prisma.discount.upsert({
    where: { kodeVoucher: 'GRAND10' },
    update: {},
    create: {
      kodeVoucher: 'GRAND10',
      tipe: 'persentase',
      nilai: 10,
      minBelanja: 50000,
      isActive: true,
    },
  });

  await prisma.discount.upsert({
    where: { kodeVoucher: 'HEMAT15K' },
    update: {},
    create: {
      kodeVoucher: 'HEMAT15K',
      tipe: 'nominal',
      nilai: 15000,
      minBelanja: 75000,
      isActive: true,
    },
  });

  console.log('Discounts created');
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
