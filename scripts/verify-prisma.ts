import { prisma } from '../lib/prisma';

async function verify() {
  try {
    const userCount = await prisma.user.count();
    const catCount = await prisma.category.count();
    const prodCount = await prisma.product.count();
    const varCount = await prisma.productVariant.count();
    const tableCount = await prisma.table.count();
    const discCount = await prisma.discount.count();
    console.log(`Counts -> Users: ${userCount}, Categories: ${catCount}, Products: ${prodCount}, Variants: ${varCount}, Tables: ${tableCount}, Discounts: ${discCount}`);
    console.log('✅ Connected');
  } catch (error) {
    console.error('❌ Connection verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
