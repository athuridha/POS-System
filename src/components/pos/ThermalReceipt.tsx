import { forwardRef } from 'react';
import { formatRupiah, formatDateTime, orderTypeLabel, shortId } from '../../lib/utils';
import { useSettingsStore } from '../../stores/settingsStore';

export interface ThermalReceiptData {
  clientUuid: string;
  createdAt: string;
  kasirNama?: string;
  tipeOrder: string;
  nomorMeja?: string | null;
  items: Array<{
    namaProduk: string;
    namaVarian?: string;
    jumlah: number;
    hargaSatuan: number;
    hargaTotal: number;
    catatan?: string | null;
  }>;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  payments: Array<{
    metode: string;
    jumlahDibayar: number;
    kembalian: number;
  }>;
}

function formatTableLabel(nomorMeja?: string | null): string {
  if (!nomorMeja) return '';
  if (nomorMeja.length > 10 && nomorMeja.includes('-')) {
    return 'Meja';
  }
  return nomorMeja.toLowerCase().startsWith('meja') ? nomorMeja : `Meja ${nomorMeja}`;
}

export const ThermalReceipt = forwardRef<HTMLDivElement, { data: ThermalReceiptData }>(
  ({ data }, ref) => {
    const { namaCafe, alamatCafe, teleponCafe, footerPesan, ukuranStruk } = useSettingsStore();

    const is58mm = ukuranStruk === '58mm';
    const widthClass = is58mm ? 'w-[58mm] max-w-[58mm]' : 'w-[80mm] max-w-[80mm]';

    const totalPaid = (data.payments || []).reduce((sum, p) => sum + p.jumlahDibayar, 0);
    const totalKembalian = (data.payments || []).reduce((sum, p) => sum + (p.metode === 'cash' ? p.kembalian : 0), 0);

    return (
      <div
        ref={ref}
        id="thermal-receipt-print-root"
        className={`${widthClass} p-3 bg-white text-black font-mono text-[10px] leading-tight select-none border border-zinc-300 shadow-xs mx-auto`}
      >
        {/* Header */}
        <div className="text-center space-y-0.5 mb-2">
          <h2 className="text-sm font-bold tracking-tight uppercase">{namaCafe || 'POS CAFE'}</h2>
          {alamatCafe && <p className="text-[9px] text-zinc-600">{alamatCafe}</p>}
          {teleponCafe && <p className="text-[9px] text-zinc-600">Telp: {teleponCafe}</p>}
        </div>

        {/* Dashed Divider */}
        <div className="border-b border-dashed border-zinc-400 my-1.5" />

        {/* Transaction Header Info */}
        <div className="space-y-0.5 text-[9px] text-zinc-800">
          <div className="flex justify-between">
            <span>No. Struk</span>
            <span className="font-bold">#{shortId(data.clientUuid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Waktu</span>
            <span>{formatDateTime(data.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir</span>
            <span className="font-semibold">{data.kasirNama || 'Kasir'}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe Order</span>
            <span className="font-semibold">
              {orderTypeLabel(data.tipeOrder)}
              {data.nomorMeja ? ` (${formatTableLabel(data.nomorMeja)})` : ''}
            </span>
          </div>
        </div>

        {/* Dashed Divider */}
        <div className="border-b border-dashed border-zinc-400 my-1.5" />

        {/* Item List */}
        <div className="space-y-1.5 my-1.5">
          {data.items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="font-bold text-zinc-900 leading-snug">
                {item.namaProduk}
                {item.namaVarian ? ` (${item.namaVarian})` : ''}
              </div>
              {item.catatan && (
                <div className="text-[8.5px] text-zinc-600 italic pl-1">
                  * Note: {item.catatan}
                </div>
              )}
              <div className="flex justify-between text-zinc-700 text-[9px]">
                <span>
                  {item.jumlah} x {formatRupiah(item.hargaSatuan)}
                </span>
                <span className="font-bold font-mono">{formatRupiah(item.hargaTotal)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dashed Divider */}
        <div className="border-b border-dashed border-zinc-400 my-1.5" />

        {/* Calculation Summary */}
        <div className="space-y-0.5 text-zinc-800 text-[9px]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-mono">{formatRupiah(data.subtotal)}</span>
          </div>

          {data.diskon > 0 && (
            <div className="flex justify-between font-semibold text-zinc-900">
              <span>Diskon</span>
              <span className="font-mono">-{formatRupiah(data.diskon)}</span>
            </div>
          )}

          {data.pajak > 0 && (
            <div className="flex justify-between">
              <span>Pajak</span>
              <span className="font-mono">{formatRupiah(data.pajak)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-bold text-black border-t border-zinc-400 pt-1 mt-1">
            <span>TOTAL</span>
            <span className="font-mono text-sm">{formatRupiah(data.total)}</span>
          </div>
        </div>

        {/* Dashed Divider */}
        <div className="border-b border-dashed border-zinc-400 my-1.5" />

        {/* Clean Payment Summary (Total Paid & Change Only) */}
        <div className="space-y-0.5 text-zinc-800 text-[9px]">
          <div className="flex justify-between font-semibold">
            <span>Bayar</span>
            <span className="font-mono">{formatRupiah(totalPaid > 0 ? totalPaid : data.total)}</span>
          </div>

          {totalKembalian > 0 && (
            <div className="flex justify-between font-bold text-black pt-0.5">
              <span>Kembali</span>
              <span className="font-mono text-xs">{formatRupiah(totalKembalian)}</span>
            </div>
          )}
        </div>

        {/* Footer Message */}
        <div className="border-t border-dashed border-zinc-400 mt-3 pt-2 text-center space-y-1">
          {(footerPesan || 'Terima kasih atas kunjungan Anda!')
            .split('\n')
            .filter((line) => line.trim().length > 0)
            .map((line, i) => (
              <p key={i} className={`text-[9.5px] ${i === 0 ? 'font-bold uppercase text-black' : 'text-zinc-700 font-medium'}`}>
                {line}
              </p>
            ))}
        </div>
      </div>
    );
  }
);

ThermalReceipt.displayName = 'ThermalReceipt';
