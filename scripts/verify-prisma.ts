import { prisma } from '../lib/prisma';

async function verify() {
  try {
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database.`);
    console.log('✅ Connected');
  } catch (error) {
    console.error('❌ Connection verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
