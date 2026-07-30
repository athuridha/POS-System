import Dexie, { type Table } from 'dexie';
import type { OfflineTransaction, Category, Discount } from '../types';

/**
 * IndexedDB via Dexie.js for offline data:
 * - Cached menu (categories with products)
 * - Cached active discounts/vouchers
 * - Offline transaction queue
 */
export class PosDatabase extends Dexie {
  categories!: Table<Category & { products?: any[] }, string>;
  discounts!: Table<Discount, string>;
  offlineTransactions!: Table<OfflineTransaction, string>;

  constructor() {
    super('pos-cafe-db');

    this.version(1).stores({
      categories: 'id, namaKategori',
      discounts: 'id, kodeVoucher, isActive',
      offlineTransactions: 'clientUuid, syncStatus, createdAt',
    });
  }
}

export const db = new PosDatabase();

// ─── Cache helpers ───────────────────────────────────────────

/** Cache menu categories (with nested products + variants) into IndexedDB */
export async function cacheMenu(categories: Category[]): Promise<void> {
  await db.categories.clear();
  await db.categories.bulkPut(categories);
}

/** Get cached menu from IndexedDB */
export async function getCachedMenu(): Promise<Category[]> {
  return db.categories.orderBy('namaKategori').toArray();
}

/** Cache active discounts into IndexedDB */
export async function cacheDiscounts(discounts: Discount[]): Promise<void> {
  await db.discounts.clear();
  await db.discounts.bulkPut(discounts);
}

/** Get cached discounts from IndexedDB */
export async function getCachedDiscounts(): Promise<Discount[]> {
  return db.discounts.where('isActive').equals(1).toArray();
}

// ─── Offline transaction queue ───────────────────────────────

/** Save a transaction offline */
export async function saveOfflineTransaction(tx: OfflineTransaction): Promise<void> {
  await db.offlineTransactions.put(tx);
}

/** Get all pending (unsynced) transactions */
export async function getPendingTransactions(): Promise<OfflineTransaction[]> {
  return db.offlineTransactions.where('syncStatus').equals('pending').toArray();
}

/** Mark a transaction as synced */
export async function markTransactionSynced(clientUuid: string): Promise<void> {
  await db.offlineTransactions.update(clientUuid, {
    syncStatus: 'synced',
    syncedAt: new Date().toISOString(),
  });
}

/** Mark a transaction as errored */
export async function markTransactionError(clientUuid: string): Promise<void> {
  await db.offlineTransactions.update(clientUuid, { syncStatus: 'error' });
}

/** Get count of pending transactions */
export async function getPendingCount(): Promise<number> {
  return db.offlineTransactions.where('syncStatus').equals('pending').count();
}

/** Clear synced transactions from local DB */
export async function clearSyncedTransactions(): Promise<void> {
  await db.offlineTransactions.where('syncStatus').equals('synced').delete();
}
