import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Printer, Table as TableIcon, ArrowRight, ShareNetwork, Sparkle } from '@phosphor-icons/react';
import api from '../lib/api';
import type { Table } from '../types';

export default function TableQrPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
  });

  const handlePrintQr = () => {
    window.print();
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">QR Code Meja (Digital Self-Order)</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Cetak stiker QR Code meja agar pelanggan dapat langsung memesan menu dari HP mereka</p>
      </div>

      {/* Grid Meja */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tables.map((table) => {
            const qrUrl = `${window.location.origin}/order/${table.id}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrUrl)}`;

            return (
              <div
                key={table.id}
                className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold font-mono">
                      {table.nomorMeja}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">Meja {table.nomorMeja}</h3>
                      <p className="text-xs text-zinc-500">Kapasitas: {table.kapasitas} orang</p>
                    </div>
                  </div>
                </div>

                {/* QR Preview Box */}
                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center">
                  <img src={qrImageUrl} alt={`QR Meja ${table.nomorMeja}`} className="w-28 h-28 rounded-lg shadow-xs" />
                  <p className="text-[11px] font-mono text-zinc-500 mt-2 truncate max-w-full">{qrUrl}</p>
                </div>

                {/* Print & Test buttons */}
                <div className="flex gap-2 pt-1">
                  <a
                    href={`/order/${table.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 h-9 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShareNetwork size={15} />
                    <span>Buka Link</span>
                  </a>
                  <button
                    onClick={() => {
                      setSelectedTable(table);
                      setTimeout(() => window.print(), 300);
                    }}
                    className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Printer size={15} />
                    <span>Cetak QR</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Hidden QR Sheet */}
      {selectedTable && (
        <div className="hidden print:flex flex-col items-center justify-center p-12 text-center h-[100vh]">
          <div className="p-8 rounded-3xl border-4 border-black max-w-sm w-full space-y-4 bg-white">
            <h2 className="text-2xl font-bold tracking-tight">POS CAFE</h2>
            <p className="text-sm font-bold uppercase tracking-wider text-zinc-600">Scan untuk Pesan Menu</p>
            <div className="w-48 h-48 mx-auto p-2 border-2 border-black rounded-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/order/${selectedTable.id}`)}`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-2xl font-extrabold font-mono border-t-2 border-black pt-3">MEJA {selectedTable.nomorMeja}</p>
            <p className="text-xs text-zinc-500">Buka kamera HP Anda & scan QR di atas untuk memesan</p>
          </div>
        </div>
      )}
    </div>
  );
}
