import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  QrCode,
  Printer,
  Table as TableIcon,
  ShareNetwork,
  DownloadSimple,
  MagnifyingGlass,
  Sparkle,
  DeviceMobile,
  CheckCircle,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { useSettingsStore } from '../stores/settingsStore';
import type { Table } from '../types';

export default function TableQrPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');
  const [searchQuery, setSearchQuery] = useState('');
  const { namaCafe, logoUrl } = useSettingsStore();

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
  });

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const q = searchQuery.toLowerCase().trim();
    return tables.filter(
      (t) => t.nomorMeja.toLowerCase().includes(q) || t.kapasitas.toString().includes(q)
    );
  }, [tables, searchQuery]);

  const handlePrintSingle = (table: Table) => {
    setSelectedTable(table);
    setPrintMode('single');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintAll = () => {
    setPrintMode('all');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleDownloadQr = (table: Table) => {
    const qrUrl = `${window.location.origin}/order/${table.id}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=png&data=${encodeURIComponent(qrUrl)}`;
    
    const link = document.createElement('a');
    link.href = qrImageUrl;
    link.download = `QR-Meja-${table.nomorMeja}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">QR Code Meja (Self-Order)</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Cetak stiker QR Code meja agar pelanggan dapat langsung memesan & melihat menu dari smartphone
          </p>
        </div>

        {tables.length > 0 && (
          <button
            onClick={handlePrintAll}
            className="h-10 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-zinc-900/20 shrink-0"
          >
            <Printer size={17} weight="bold" />
            <span>Cetak Semua Meja (A4 Sheet)</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nomor meja (contoh: M01, OUT-01)..."
            className="w-full h-9 pl-9 pr-3 text-xs font-semibold rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900"
          />
        </div>
        <span className="text-xs font-bold text-zinc-500 pr-2">
          {filteredTables.length} dari {tables.length} Meja
        </span>
      </div>

      {/* Tables QR Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-60 rounded-3xl" />
          ))}
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-200 opacity-60 text-center p-6">
          <QrCode size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Meja tidak ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTables.map((table) => {
            const qrUrl = `${window.location.origin}/order/${table.id}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrUrl)}`;

            return (
              <div
                key={table.id}
                className="p-5 rounded-3xl border border-zinc-200 bg-white hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold font-mono text-sm shadow-xs">
                      {table.nomorMeja}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-zinc-900">Meja {table.nomorMeja}</h3>
                      <p className="text-xs text-zinc-500 font-medium">Kapasitas: {table.kapasitas} orang</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      table.status === 'terisi'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {table.status === 'terisi' ? 'Terisi' : 'Kosong'}
                  </span>
                </div>

                {/* QR Preview Box */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col items-center justify-center">
                  <div className="p-2 bg-white rounded-xl shadow-xs border border-zinc-200">
                    <img
                      src={qrImageUrl}
                      alt={`QR Meja ${table.nomorMeja}`}
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 mt-2.5 truncate max-w-full text-center px-1">
                    {qrUrl}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`/order/${table.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Buka tampilan self-order pelanggan"
                    >
                      <ShareNetwork size={15} />
                      <span>Tes Link</span>
                    </a>
                    <button
                      onClick={() => handleDownloadQr(table)}
                      className="h-9 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Unduh file gambar QR PNG"
                    >
                      <DownloadSimple size={15} />
                      <span>PNG</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handlePrintSingle(table)}
                    className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shadow-emerald-600/20"
                  >
                    <Printer size={16} weight="bold" />
                    <span>Cetak Stiker Meja {table.nomorMeja}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── PRINT AREA 1: SINGLE TABLE QR STIKER / CARD ─────────────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {selectedTable && printMode === 'single' && (
        <div id="printable-table-qr">
          <div
            style={{
              width: '100%',
              maxWidth: '380px',
              border: '3px solid #18181b',
              borderRadius: '24px',
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              boxShadow: 'none',
              fontFamily: 'sans-serif',
            }}
          >
            {/* Header / Cafe Info */}
            <div style={{ marginBottom: '12px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#18181b', letterSpacing: '-0.5px', margin: '0' }}>
                {namaCafe || 'POS CAFE'}
              </h1>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                Scan QR Untuk Pesan Menu
              </p>
            </div>

            {/* QR Code Container */}
            <div
              style={{
                width: '220px',
                height: '220px',
                margin: '12px auto',
                padding: '12px',
                border: '2px dashed #71717a',
                borderRadius: '16px',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.origin}/order/${selectedTable.id}`)}`}
                alt={`QR Meja ${selectedTable.nomorMeja}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Table Number Highlight Badge */}
            <div
              style={{
                backgroundColor: '#18181b',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '8px 16px',
                margin: '12px 0',
                display: 'inline-block',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '1px' }}>
                MEJA {selectedTable.nomorMeja}
              </span>
            </div>

            {/* Instructions */}
            <div style={{ marginTop: '10px', borderTop: '1px solid #e4e4e7', paddingTop: '10px', textAlign: 'left' }}>
              <ol style={{ fontSize: '10px', color: '#3f3f46', lineHeight: '1.5', paddingLeft: '16px', margin: 0 }}>
                <li>Buka kamera smartphone atau aplikasi scanner Anda</li>
                <li>Arahkan kamera ke QR Code di atas</li>
                <li>Pilih menu makanan & minuman favorit Anda</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ── PRINT AREA 2: BATCH ALL TABLE QRS (A4 GRID SHEET) ───────── */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {printMode === 'all' && (
        <div id="printable-all-qrs">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              width: '100%',
              backgroundColor: '#ffffff',
              fontFamily: 'sans-serif',
            }}
          >
            {tables.map((t) => (
              <div
                key={t.id}
                style={{
                  border: '2px dashed #27272a',
                  borderRadius: '16px',
                  padding: '12px',
                  textAlign: 'center',
                  backgroundColor: '#ffffff',
                  pageBreakInside: 'avoid',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#18181b' }}>
                  {namaCafe || 'POS CAFE'}
                </div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: '#059669', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Scan Untuk Pesan
                </div>

                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto',
                    padding: '4px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/order/${t.id}`)}`}
                    alt={`QR Meja ${t.nomorMeja}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: '#18181b',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    marginTop: '8px',
                    display: 'inline-block',
                    fontSize: '13px',
                    fontWeight: '900',
                    fontFamily: 'monospace',
                  }}
                >
                  MEJA {t.nomorMeja}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
