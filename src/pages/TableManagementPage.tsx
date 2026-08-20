import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  PencilSimple,
  Trash,
  CircleNotch,
  X,
  Check,
  Table as TableIcon,
  Broom,
  Sparkle,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import api from '../lib/api';
import { getErrorMessage } from '../lib/utils';
import type { Table } from '../types';

export default function TableManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'terisi' | 'kosong'>('all');
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading, isFetching } = useQuery<Table[]>({
    queryKey: ['tables-manage'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
    refetchInterval: 10000,
  });

  const occupiedCount = useMemo(() => tables.filter((t) => t.status === 'terisi').length, [tables]);
  const emptyCount = useMemo(() => tables.filter((t) => t.status === 'kosong').length, [tables]);

  const displayedTables = useMemo(() => {
    if (statusFilter === 'terisi') return tables.filter((t) => t.status === 'terisi');
    if (statusFilter === 'kosong') return tables.filter((t) => t.status === 'kosong');
    return tables;
  }, [tables, statusFilter]);

  // Bulk Clear All Tables Mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const occupiedTables = tables.filter((t) => t.status === 'terisi');
      for (const t of occupiedTables) {
        await api.patch(`/tables/${t.id}/status`, { status: 'kosong' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const handleClearAllOccupied = () => {
    if (occupiedCount === 0) return;
    if (window.confirm(`Kosongkan status semua ${occupiedCount} meja yang sedang terisi?`)) {
      clearAllMutation.mutate();
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Manajemen Meja Cafe</h1>
            {isFetching && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                <ArrowsClockwise size={12} className="animate-spin" />
                <span>Live</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Pantau status ketersediaan meja, kapasitas duduk, dan reset meja yang sudah selesai/ditinggal pelanggan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {occupiedCount > 0 && (
            <button
              onClick={handleClearAllOccupied}
              disabled={clearAllMutation.isPending}
              className="h-10 px-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Kosongkan semua meja yang terisi sekaligus"
            >
              {clearAllMutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Broom size={16} weight="bold" />}
              <span>Kosongkan Semua Meja Terisi ({occupiedCount})</span>
            </button>
          )}

          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <Plus size={18} weight="bold" />
            <span>Tambah Meja</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Semua Meja ({tables.length})
          </button>
          <button
            onClick={() => setStatusFilter('terisi')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'terisi'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Terisi ({occupiedCount})
          </button>
          <button
            onClick={() => setStatusFilter('kosong')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'kosong'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Kosong ({emptyCount})
          </button>
        </div>

        <p className="text-xs text-zinc-400">
          💡 Klik <span className="font-bold text-zinc-700">"Kosongkan Meja"</span> untuk melepas meja jika tamu sudah pergi/tidak ada.
        </p>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : displayedTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-zinc-200 opacity-60 text-center p-6">
          <TableIcon size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Tidak ada meja dengan filter ini</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {displayedTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => { setEditing(table); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {showForm && <TableFormModal table={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function TableCard({ table, onEdit }: { table: Table; onEdit: () => void }) {
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async (newStatus: 'kosong' | 'terisi') => {
      await api.patch(`/tables/${table.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const isOccupied = table.status === 'terisi';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
        isOccupied
          ? 'border-amber-300 bg-amber-50/80 shadow-xs'
          : 'border-zinc-200 bg-white hover:border-emerald-500/50 hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-extrabold font-mono text-zinc-900">{table.nomorMeja}</span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isOccupied
                ? 'bg-amber-200 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isOccupied ? 'Terisi' : 'Kosong'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 font-medium">Kapasitas: {table.kapasitas} org</p>
      </div>

      <div className="mt-3.5 space-y-2 pt-2.5 border-t border-zinc-200/80">
        {/* Quick Toggle Status Button */}
        {isOccupied ? (
          <button
            onClick={() => statusMutation.mutate('kosong')}
            disabled={statusMutation.isPending}
            className="w-full h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Kosongkan meja ini agar bisa dipakai pelanggan baru"
          >
            {statusMutation.isPending ? <CircleNotch size={14} className="animate-spin" /> : <Broom size={14} weight="bold" />}
            <span>Kosongkan Meja</span>
          </button>
        ) : (
          <button
            onClick={() => statusMutation.mutate('terisi')}
            disabled={statusMutation.isPending}
            className="w-full h-8 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
            title="Tandai meja ini terisi tamu"
          >
            {statusMutation.isPending ? <CircleNotch size={14} className="animate-spin" /> : <Sparkle size={14} />}
            <span>Set Terisi</span>
          </button>
        )}

        {/* Action icons: Edit & Delete */}
        <div className="flex gap-1 justify-end pt-1">
          <button
            onClick={onEdit}
            title="Edit Meja"
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <PencilSimple size={15} />
          </button>
          <DeleteTableButton tableId={table.id} nomorMeja={table.nomorMeja} />
        </div>
      </div>
    </div>
  );
}

function DeleteTableButton({ tableId, nomorMeja }: { tableId: string; nomorMeja: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Hapus Meja "${nomorMeja}"?`)) {
      mutation.mutate();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={mutation.isPending}
      title="Hapus Meja"
      className="p-1 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={15} className="animate-spin" /> : <Trash size={15} />}
    </button>
  );
}

function TableFormModal({ table, onClose }: { table: Table | null; onClose: () => void }) {
  const [nomorMeja, setNomorMeja] = useState(table?.nomorMeja || '');
  const [kapasitas, setKapasitas] = useState(table?.kapasitas?.toString() || '4');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedCapacity = parseInt(kapasitas, 10) || 4;
      if (table) {
        await api.put(`/tables/${table.id}`, { nomorMeja, kapasitas: parsedCapacity });
      } else {
        await api.post('/tables', { nomorMeja, kapasitas: parsedCapacity });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onClose();
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Gagal menyimpan data meja'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-zinc-900">{table ? 'Edit Meja Cafe' : 'Tambah Meja Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nomor / Kode Meja *</label>
            <input
              type="text"
              value={nomorMeja}
              onChange={(e) => setNomorMeja(e.target.value.toUpperCase())}
              required
              placeholder="Contoh: M11 atau OUT-05"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Kapasitas Kursi (Orang) *</label>
            <input
              type="number"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
              min={1}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={18} className="animate-spin" /> : <><Check size={18} weight="bold" /> <span>Simpan Meja</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
