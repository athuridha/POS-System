// ─── User & Auth ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  nama: string;
  role: 'kasir' | 'dapur' | 'manager' | 'super_admin';
  isActive?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Menu ────────────────────────────────────────────────────
export interface Category {
  id: string;
  namaKategori: string;
  urutan: number;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  categoryId: string;
  namaProduk: string;
  hargaDasar: number;
  imageUrl?: string | null;
  deskripsi?: string | null;
  isActive: boolean;
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  namaVarian: string;
  hargaTambahan: number;
  isActive: boolean;
}

// ─── Table ───────────────────────────────────────────────────
export interface Table {
  id: string;
  nomorMeja: string;
  kapasitas: number;
  status: 'kosong' | 'terisi';
}

// ─── Shift ───────────────────────────────────────────────────
export interface Shift {
  id: string;
  kasirId: string;
  waktuBuka: string;
  waktuTutup?: string | null;
  modalAwal: number;
  kasSeharusnya?: number | null;
  kasAktual?: number | null;
  selisih?: number | null;
  status: 'open' | 'closed';
  kasir?: { id: string; nama: string; email?: string };
  _count?: { transactions: number };
  runningKasSeharusnya?: number;
}

// ─── Transaction ─────────────────────────────────────────────
export type TipeOrder = 'dine_in' | 'take_away';
export type MetodePembayaran = 'cash' | 'qris' | 'kartu';
export type TransactionStatus = 'paid' | 'unpaid' | 'void';

export interface TransactionItem {
  id?: string;
  transactionId?: string;
  productId: string;
  variantId?: string | null;
  jumlah: number;
  hargaSatuan: number;
  hargaTotal: number;
  catatan?: string | null;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Payment {
  id?: string;
  transactionId?: string;
  metode: MetodePembayaran;
  jumlahDibayar: number;
  kembalian: number;
  referensiGateway?: string | null;
}

export interface Transaction {
  id: string;
  clientUuid: string;
  shiftId: string;
  tableId?: string | null;
  tipeOrder: TipeOrder;
  status: TransactionStatus;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  catatan?: string | null;
  nomorAntrian?: string | null;
  createdAt: string;
  syncedAt?: string | null;
  items: TransactionItem[];
  payments: Payment[];
  shift?: Shift & { kasir?: { nama: string } };
  table?: Table | null;
}

// ─── Cart (frontend-only) ────────────────────────────────────
export interface CartItem {
  productId: string;
  variantId?: string | null;
  namaProduk: string;
  namaVarian?: string;
  hargaSatuan: number;
  jumlah: number;
  catatan?: string;
}

// ─── Discount ────────────────────────────────────────────────
export interface Discount {
  id: string;
  kodeVoucher: string;
  tipe: 'persentase' | 'nominal';
  nilai: number;
  minBelanja: number;
  isActive: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// ─── Reports ─────────────────────────────────────────────────
export interface DailyReport {
  date: string;
  totalPenjualan: number;
  totalTransaksi: number;
  totalDiskon: number;
  rataRata: number;
  paymentBreakdown: Record<string, { count: number; total: number }>;
  orderTypeBreakdown: { dine_in: number; take_away: number };
}

// ─── Sync ────────────────────────────────────────────────────
export interface SyncResult {
  clientUuid: string;
  status: 'created' | 'exists' | 'error';
  transactionId?: string;
  error?: string;
}

export interface SyncResponse {
  summary: { total: number; created: number; exists: number; errors: number };
  results: SyncResult[];
}

// ─── Offline Transaction (stored in IndexedDB) ──────────────
export interface OfflineTransaction {
  clientUuid: string;
  shiftId: string;
  tableId?: string | null;
  tipeOrder: TipeOrder;
  status: TransactionStatus;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  catatan?: string | null;
  discountId?: string | null;
  createdAt: string;
  syncedAt?: string | null;
  syncStatus: 'pending' | 'synced' | 'error';
  items: TransactionItem[];
  payments: Payment[];
}
