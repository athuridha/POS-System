import { create } from 'zustand';

export type GatewayProvider = 'none' | 'midtrans' | 'xendit' | 'doku';
export type GatewayEnvironment = 'sandbox' | 'production';

export interface MidtransConfig {
  merchantId: string;
  clientKey: string;
  serverKey: string;
  environment: GatewayEnvironment;
}

export interface XenditConfig {
  secretKey: string;
  publicKey: string;
  webhookToken: string;
  environment: GatewayEnvironment;
}

export interface DokuConfig {
  clientId: string;
  secretKey: string;
  mallId: string;
  environment: GatewayEnvironment;
}

export interface PaymentGatewayState {
  activeProvider: GatewayProvider;
  midtrans: MidtransConfig;
  xendit: XenditConfig;
  doku: DokuConfig;

  updateActiveProvider: (provider: GatewayProvider) => void;
  updateMidtrans: (config: Partial<MidtransConfig>) => void;
  updateXendit: (config: Partial<XenditConfig>) => void;
  updateDoku: (config: Partial<DokuConfig>) => void;
  loadFromStorage: () => void;
}

const DEFAULT_MIDTRANS: MidtransConfig = {
  merchantId: '',
  clientKey: '',
  serverKey: '',
  environment: 'sandbox',
};

const DEFAULT_XENDIT: XenditConfig = {
  secretKey: '',
  publicKey: '',
  webhookToken: '',
  environment: 'sandbox',
};

const DEFAULT_DOKU: DokuConfig = {
  clientId: '',
  secretKey: '',
  mallId: '',
  environment: 'sandbox',
};

function getInitialGatewaySettings(): {
  activeProvider: GatewayProvider;
  midtrans: MidtransConfig;
  xendit: XenditConfig;
  doku: DokuConfig;
} {
  try {
    const saved = localStorage.getItem('paymentGatewaySettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        activeProvider: parsed.activeProvider || 'none',
        midtrans: { ...DEFAULT_MIDTRANS, ...parsed.midtrans },
        xendit: { ...DEFAULT_XENDIT, ...parsed.xendit },
        doku: { ...DEFAULT_DOKU, ...parsed.doku },
      };
    }
  } catch (err) {
    console.warn('Failed to parse paymentGatewaySettings:', err);
  }
  return {
    activeProvider: 'none',
    midtrans: DEFAULT_MIDTRANS,
    xendit: DEFAULT_XENDIT,
    doku: DEFAULT_DOKU,
  };
}

export const usePaymentGatewayStore = create<PaymentGatewayState>((set, get) => ({
  ...getInitialGatewaySettings(),

  updateActiveProvider: (provider) => {
    set({ activeProvider: provider });
    saveToStorage({ ...get(), activeProvider: provider });
  },

  updateMidtrans: (config) => {
    set((state) => {
      const updated = { ...state.midtrans, ...config };
      saveToStorage({ ...state, midtrans: updated });
      return { midtrans: updated };
    });
  },

  updateXendit: (config) => {
    set((state) => {
      const updated = { ...state.xendit, ...config };
      saveToStorage({ ...state, xendit: updated });
      return { xendit: updated };
    });
  },

  updateDoku: (config) => {
    set((state) => {
      const updated = { ...state.doku, ...config };
      saveToStorage({ ...state, doku: updated });
      return { doku: updated };
    });
  },

  loadFromStorage: () => {
    set(getInitialGatewaySettings());
  },
}));

function saveToStorage(state: PaymentGatewayState) {
  try {
    const toSave = {
      activeProvider: state.activeProvider,
      midtrans: state.midtrans,
      xendit: state.xendit,
      doku: state.doku,
    };
    localStorage.setItem('paymentGatewaySettings', JSON.stringify(toSave));
  } catch (err) {
    console.warn('Failed to save paymentGatewaySettings:', err);
  }
}
