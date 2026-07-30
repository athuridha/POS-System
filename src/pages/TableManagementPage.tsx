import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, PencilSimple, Trash, CircleNotch, X, Check, Table as TableIcon } from '@phosphor-icons/react';
import api from '../lib/api';
import type { Table } from '../types';

export default function TableManagementPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Table | null>(null);
  const queryClient = useQueryClient();

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ['tables-manage'],
    queryFn: async () => {
      const { data } = await api.get('/tables');
      return data.tables;
    },
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Manajemen Meja</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola daftar meja dan kapasitas tempat duduk cafe</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
        >
          <Plus size={18} />
          <span>Tambah Meja</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <TableIcon size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Belum ada meja</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-2xl border transition-all ${
                table.status === 'terisi'
                  ? 'border-amber-300 bg-amber-50/70'
                  : 'border-zinc-200 bg-white hover:border-emerald-500/40 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold font-mono text-zinc-900">{table.nomorMeja}</span>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  table.status === 'terisi' ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {table.status === 'terisi' ? 'Terisi' : 'Kosong'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">Kapasitas: {table.kapasitas} orang</p>
              <div className="flex gap-1.5 mt-3 pt-2 border-t border-zinc-100 justify-end">
                <button
                  onClick={() => { setEditing(table); setShowForm(true); }}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <PencilSimple size={16} />
                </button>
                <DeleteTableButton tableId={table.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <TableFormModal table={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function DeleteTableButton({ tableId }: { tableId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/tables/${tableId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });
  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
    >
      {mutation.isPending ? <CircleNotch size={16} className="animate-spin" /> : <Trash size={16} />}
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
      if (table) {
        await api.put(`/tables/${table.id}`, { nomorMeja, kapasitas: parseInt(kapasitas) });
      } else {
        await api.post('/tables', { nomorMeja, kapasitas: parseInt(kapasitas) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables-manage'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Gagal menyimpan data meja');
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h3 className="text-base font-bold text-zinc-900">{table ? 'Edit Meja' : 'Tambah Meja Baru'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-4 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Nomor / Nama Meja</label>
            <input
              type="text"
              value={nomorMeja}
              onChange={(e) => setNomorMeja(e.target.value.toUpperCase())}
              required
              placeholder="Contoh: M11"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Kapasitas (Orang)</label>
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
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <><Check size={18} /> <span>Simpan Meja</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
