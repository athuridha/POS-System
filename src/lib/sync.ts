import api from './api';
import {
  getPendingTransactions,
  markTransactionSynced,
  markTransactionError,
  getPendingCount,
} from './db';
import type { SyncResponse } from '../types';

/**
 * TransactionSyncEngine
 * 
 * Monitors connectivity and syncs offline transactions to the server.
 * - Retries with exponential backoff
 * - Idempotent by clientUuid (safe to retry)
 * - Batch sync for efficiency
 */

let syncInProgress = false;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
const MAX_RETRY = 5;
const BASE_DELAY_MS = 2000;

type SyncListener = (pendingCount: number) => void;
const listeners: Set<SyncListener> = new Set();

/** Subscribe to sync status changes */
export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notify all listeners of current pending count */
async function notifyListeners(): Promise<void> {
  const count = await getPendingCount();
  listeners.forEach((fn) => fn(count));
}

/** Attempt to sync all pending transactions */
export async function syncPendingTransactions(): Promise<void> {
  if (syncInProgress) return;
  if (!navigator.onLine) return;

  const pending = await getPendingTransactions();
  if (pending.length === 0) {
    await notifyListeners();
    return;
  }

  syncInProgress = true;

  try {
    const { data } = await api.post<SyncResponse>('/sync/transactions', {
      transactions: pending,
    });

    // Process results
    for (const result of data.results) {
      if (result.status === 'created' || result.status === 'exists') {
        await markTransactionSynced(result.clientUuid);
      } else if (result.status === 'error') {
        await markTransactionError(result.clientUuid);
        console.error(`Sync error for ${result.clientUuid}:`, result.error);
      }
    }

    retryCount = 0; // Reset on success
    await notifyListeners();
  } catch (err) {
    console.error('Sync batch failed:', err);

    // Exponential backoff retry
    if (retryCount < MAX_RETRY) {
      retryCount++;
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
      console.log(`Retrying sync in ${delay}ms (attempt ${retryCount}/${MAX_RETRY})`);

      retryTimeout = setTimeout(() => {
        syncInProgress = false;
        syncPendingTransactions();
      }, delay);
    } else {
      console.error('Max sync retries reached. Will retry when connectivity changes.');
      retryCount = 0;
    }
  } finally {
    syncInProgress = false;
  }
}

/** Initialize sync engine — call once on app startup */
export function initSyncEngine(): () => void {
  // Sync on startup if online
  if (navigator.onLine) {
    syncPendingTransactions();
  }

  // Listen for online event
  const handleOnline = () => {
    console.log('Connection restored — syncing pending transactions...');
    retryCount = 0;
    syncPendingTransactions();
  };

  const handleOffline = () => {
    console.log('Connection lost — transactions will be saved locally');
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Periodic check (every 30s while online)
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncPendingTransactions();
    }
  }, 30000);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    clearInterval(interval);
    if (retryTimeout) clearTimeout(retryTimeout);
  };
}
