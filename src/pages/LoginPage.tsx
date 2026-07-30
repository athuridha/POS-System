import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeSlash, CircleNotch, Storefront } from '@phosphor-icons/react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { AuthResponse } from '../types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
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
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/pos');
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
          {/* Email / Username Input */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
              <User size={18} weight="fill" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {/* Remember me & Forgot password row */}
          <div className="flex items-center justify-between px-1 text-xs text-zinc-400 font-medium pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setError('Silakan hubungi Super Admin jika Anda lupa password')}
              className="hover:underline text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit LOGIN Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/30 flex items-center justify-center"
          >
            {loading ? (
              <CircleNotch size={22} className="animate-spin text-white" />
            ) : (
              <span>LOGIN</span>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Switcher */}
        <div className="w-full mt-6 pt-4 border-t border-zinc-100 text-center">
          <p className="text-[11px] font-semibold text-zinc-400 mb-2">Pilih akun cepat (Demo):</p>
          <div className="flex justify-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setEmail('superadmin@poscafe.id'); setPassword('admin123'); }}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition-all cursor-pointer border border-zinc-200"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => { setEmail('manager@poscafe.id'); setPassword('manager123'); }}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition-all cursor-pointer border border-zinc-200"
            >
              Manager
            </button>
            <button
              type="button"
              onClick={() => { setEmail('kasir1@poscafe.id'); setPassword('kasir123'); }}
              className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-bold transition-all cursor-pointer border border-zinc-200"
            >
              Kasir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
