import { create } from 'zustand';

export interface CafeSettings {
  namaCafe: string;
  alamatCafe: string;
  teleponCafe: string;
  footerPesan: string;
  ukuranStruk: '58mm' | '80mm';
  logoUrl: string;
}

interface SettingsState extends CafeSettings {
  updateSettings: (newSettings: Partial<CafeSettings>) => void;
  loadFromStorage: () => void;
}

const DEFAULT_SETTINGS: CafeSettings = {
  namaCafe: 'POS CAFE',
  alamatCafe: 'Jl. Kopi Melati No. 12, Jakarta',
  teleponCafe: '(021) 555-0199',
  footerPesan: 'Terima kasih atas kunjungan Anda!',
  ukuranStruk: '80mm',
  logoUrl: 'https://placehold.co/120x120/10b981/ffffff?text=POS+Cafe',
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULT_SETTINGS,

  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state, ...newSettings };
      const toSave: CafeSettings = {
        namaCafe: updated.namaCafe,
        alamatCafe: updated.alamatCafe,
        teleponCafe: updated.teleponCafe,
        footerPesan: updated.footerPesan,
        ukuranStruk: updated.ukuranStruk,
        logoUrl: updated.logoUrl,
      };
      try {
        localStorage.setItem('cafeSettings', JSON.stringify(toSave));
      } catch (err) {
        console.warn('Failed to save to localStorage:', err);
      }
      return updated;
    });
  },

  loadFromStorage: () => {
    const saved = localStorage.getItem('cafeSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CafeSettings;
        set({
          namaCafe: parsed.namaCafe || DEFAULT_SETTINGS.namaCafe,
          alamatCafe: parsed.alamatCafe || DEFAULT_SETTINGS.alamatCafe,
          teleponCafe: parsed.teleponCafe || DEFAULT_SETTINGS.teleponCafe,
          footerPesan: parsed.footerPesan || DEFAULT_SETTINGS.footerPesan,
          ukuranStruk: parsed.ukuranStruk || DEFAULT_SETTINGS.ukuranStruk,
          logoUrl: parsed.logoUrl || DEFAULT_SETTINGS.logoUrl,
        });
      } catch {}
    }
  },
}));
