// Re-export from server/lib for backward compatibility (seed, etc.)
import { prisma } from '../server/lib/prisma';

export { prisma };
export default prisma;
