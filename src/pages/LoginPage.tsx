import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeSlash, CircleNotch, Storefront } from '@phosphor-icons/react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { AuthResponse } from '../types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { logoUrl, namaCafe } = useSettingsStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { username, email: username, password });
      login(data.user, data.accessToken, data.refreshToken);
      if (data.user.role === 'kasir') {
        navigate('/pos');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Gagal login. Cek koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-gradient-to-b from-[#059669] via-[#10b981] to-[#ecfdf5] relative overflow-hidden font-sans">
      {/* Decorative ambient background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Floating Card */}
      <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] p-8 sm:p-9 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-white/60 relative z-10 animate-fade-in flex flex-col items-center">
        {/* Top Circular Logo Badge */}
        <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 mb-6 shrink-0 border-4 border-white overflow-hidden p-1">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo Cafe" className="w-full h-full object-cover rounded-full" />
          ) : (
            <Storefront size={44} weight="light" className="text-white" />
          )}
        </div>

        {/* Cafe Name */}
        <h1 className="text-center text-lg font-bold text-zinc-800 tracking-tight mb-1">
          {namaCafe || 'POS Cafe'}
        </h1>
        <p className="text-center text-xs text-zinc-400 font-medium mb-6">
          Sistem Kasir Cafe Modern
        </p>

        {/* Error Alert */}
        {error && (
          <div className="w-full mb-5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {/* Username / Email Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
              <User size={18} weight="fill" />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username / Email"
              required
              className="w-full h-12 pl-11 pr-4 rounded-full bg-[#d4d4d8]/60 text-sm font-medium text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all border border-transparent focus:border-emerald-500"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
              <Lock size={18} weight="fill" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-12 pl-11 pr-11 rounded-full bg-[#d4d4d8]/60 text-sm font-medium text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all border border-transparent focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 transition-colors"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-[#059669] hover:bg-[#047857] active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <CircleNotch size={18} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Ke Sistem</span>
            )}
          </button>

          {/* Quick Demo Login Accounts (3 Separate Role Buttons) */}
          <div className="pt-3 border-t border-zinc-100 space-y-2">
            <p className="text-[11px] font-extrabold text-center text-zinc-400 uppercase tracking-wider">Demo Akun Cepat</p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => { setUsername('kasir1'); setPassword('kasir123'); }}
                className="py-2 px-2 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-extrabold transition-all text-center cursor-pointer active:scale-95"
              >
                Kasir
              </button>
              <button
                type="button"
                onClick={() => { setUsername('manager'); setPassword('manager123'); }}
                className="py-2 px-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-extrabold transition-all text-center cursor-pointer active:scale-95"
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => { setUsername('superadmin'); setPassword('admin123'); }}
                className="py-2 px-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold transition-all text-center cursor-pointer active:scale-95"
              >
                Super Admin
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
