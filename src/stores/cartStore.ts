import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { CartItem, TipeOrder } from '../types';

interface CartState {
  items: CartItem[];
  tipeOrder: TipeOrder;
  tableId: string | null;
  discountId: string | null;
  discountAmount: number;
  clientUuid: string;

  // Actions
  addItem: (item: Omit<CartItem, 'jumlah'>) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null | undefined, jumlah: number) => void;
  updateItemNote: (productId: string, variantId: string | null | undefined, catatan: string) => void;
  setTipeOrder: (tipe: TipeOrder) => void;
  setTableId: (tableId: string | null) => void;
  setDiscount: (discountId: string | null, amount: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotal: () => number;
}

function matchItem(item: CartItem, productId: string, variantId?: string | null): boolean {
  return item.productId === productId && (item.variantId || null) === (variantId || null);
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tipeOrder: 'dine_in',
  tableId: null,
  discountId: null,
  discountAmount: 0,
  clientUuid: uuidv4(),

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => matchItem(i, item.productId, item.variantId));
      if (existing) {
        return {
          items: state.items.map((i) =>
            matchItem(i, item.productId, item.variantId)
              ? { ...i, jumlah: i.jumlah + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { ...item, jumlah: 1 }] };
    });
  },

  removeItem: (productId, variantId) => {
    set((state) => ({
      items: state.items.filter((i) => !matchItem(i, productId, variantId)),
    }));
  },

  updateQuantity: (productId, variantId, jumlah) => {
    if (jumlah <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        matchItem(i, productId, variantId) ? { ...i, jumlah } : i
      ),
    }));
  },

  updateItemNote: (productId, variantId, catatan) => {
    set((state) => ({
      items: state.items.map((i) =>
        matchItem(i, productId, variantId) ? { ...i, catatan } : i
      ),
    }));
  },

  setTipeOrder: (tipeOrder) => set({ tipeOrder }),
  setTableId: (tableId) => set({ tableId }),
  setDiscount: (discountId, discountAmount) => set({ discountId, discountAmount }),

  clearCart: () =>
    set({
      items: [],
      tipeOrder: 'dine_in',
      tableId: null,
      discountId: null,
      discountAmount: 0,
      clientUuid: uuidv4(), // Generate fresh UUID for next transaction
    }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.hargaSatuan * item.jumlah, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    return subtotal - get().discountAmount;
  },
}));
