import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, CircleNotch, X, Check, Key, ShieldCheck, UserCheck, UserPlus } from '@phosphor-icons/react';
import api from '../lib/api';
import { formatDate, getErrorMessage } from '../lib/utils';
import type { User } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function UserManagementPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: ['users-manage'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const users = data?.users || [];
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      await api.put(`/users/${userId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-manage'] });
    },
  });

  return (
    <div className="p-3 sm:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Manajemen Pengguna (User)</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola akun pengguna dengan role Manager dan Kasir</p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
          >
            <UserPlus size={18} />
            <span>Tambah User Baru</span>
          </button>
        )}
      </div>

      {/* User Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
          <Users size={48} className="text-zinc-400 mb-3" />
          <p className="text-sm font-semibold text-zinc-600">Belum ada data user</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  {isSuperAdmin && <th className="py-3.5 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-zinc-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-300 flex items-center justify-center text-xs font-bold text-zinc-700 shrink-0">
                        {u.nama.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.nama}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-xs">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.isActive !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {u.isActive !== false ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-500 font-mono">
                      {formatDate(new Date())}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'super_admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  userId: u.id,
                                  isActive: !u.isActive,
                                })
                              }
                              disabled={toggleStatusMutation.isPending}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                                u.isActive !== false
                                  ? 'border-zinc-300 hover:bg-zinc-100 text-zinc-700'
                                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>

                            <button
                              onClick={() => setResettingUser(u)}
                              className="p-1.5 rounded-lg border border-zinc-300 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 text-zinc-500 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Key size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateForm && <CreateUserModal onClose={() => setShowCreateForm(false)} />}

      {/* Reset Password Modal */}
      {resettingUser && (
        <ResetPasswordModal
          user={resettingUser}
          onClose={() => setResettingUser(null)}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
        <ShieldCheck size={12} weight="bold" />
        Super Admin
      </span>
    );
  }
  if (role === 'manager') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
        Manager
      </span>
    );
  }
  if (role === 'dapur') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        Dapur / Barista
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      Kasir
    </span>
  );
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'manager' | 'kasir' | 'dapur'>('kasir');
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/users', { nama, username, email, password, role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-manage'] });
      onClose();
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Gagal membuat user baru'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
          <h3 className="text-base font-bold text-zinc-900">Tambah User Baru</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">{error}</div>}

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              placeholder="Contoh: Andi Wijaya"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="andi"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Email <span className="text-zinc-400 text-xs font-normal">(Opsional)</span></label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="andi@poscafe.id"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Role / Hak Akses</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('kasir')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  role === 'kasir'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-xs ring-1 ring-emerald-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Kasir
              </button>
              <button
                type="button"
                onClick={() => setRole('dapur')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  role === 'dapur'
                    ? 'border-amber-600 bg-amber-50 text-amber-700 shadow-xs ring-1 ring-amber-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Dapur
              </button>
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  role === 'manager'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs ring-1 ring-blue-600'
                    : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Manager
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <><Check size={18} /> <span>Buat User</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/users/${user.id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    },
    onError: (err: any) => {
      setError(getErrorMessage(err, 'Gagal reset password'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h3 className="text-base font-bold text-zinc-900">Reset Password</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="p-4 space-y-4">
          <p className="text-xs text-zinc-600">
            Reset password untuk user <strong className="text-zinc-900">{user.nama}</strong> ({user.email})
          </p>

          {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">{error}</div>}
          {success && <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">Password berhasil di-reset!</div>}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending || success}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {mutation.isPending ? <CircleNotch size={20} className="animate-spin" /> : <span>Reset Password</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
