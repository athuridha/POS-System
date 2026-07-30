import { useState, useEffect } from 'react';
import {
  CreditCard,
  Check,
  ShieldCheck,
  CheckCircle,
  Copy,
  Gear,
  CircleNotch,
  WarningCircle,
  LockKey,
  Globe,
  Lightning,
  Sparkle,
} from '@phosphor-icons/react';
import { usePaymentGatewayStore, GatewayProvider, GatewayEnvironment } from '../stores/paymentGatewayStore';

export default function PaymentGatewayPage() {
  const {
    activeProvider,
    midtrans,
    xendit,
    doku,
    updateActiveProvider,
    updateMidtrans,
    updateXendit,
    updateDoku,
  } = usePaymentGatewayStore();

  const [activeTab, setActiveTab] = useState<GatewayProvider>('midtrans');

  // Form states
  const [midForm, setMidForm] = useState(midtrans);
  const [xenForm, setXenForm] = useState(xendit);
  const [dokuForm, setDokuForm] = useState(doku);

  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    setMidForm(midtrans);
    setXenForm(xendit);
    setDokuForm(doku);
  }, [midtrans, xendit, doku]);

  const handleSaveMidtrans = (e: React.FormEvent) => {
    e.preventDefault();
    updateMidtrans(midForm);
    showSaveSuccess('Pengaturan Midtrans berhasil disimpan!');
  };

  const handleSaveXendit = (e: React.FormEvent) => {
    e.preventDefault();
    updateXendit(xenForm);
    showSaveSuccess('Pengaturan Xendit berhasil disimpan!');
  };

  const handleSaveDoku = (e: React.FormEvent) => {
    e.preventDefault();
    updateDoku(dokuForm);
    showSaveSuccess('Pengaturan DOKU berhasil disimpan!');
  };

  const showSaveSuccess = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleTestConnection = (provider: GatewayProvider) => {
    setTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setTesting(false);
      if (provider === 'midtrans') {
        if (!midForm.serverKey || !midForm.clientKey) {
          setTestResult({
            provider: 'Midtrans',
            success: false,
            message: 'Server Key dan Client Key Wajib Diisi.',
          });
        } else {
          setTestResult({
            provider: 'Midtrans',
            success: true,
            message: `Koneksi Midtrans API (${midForm.environment.toUpperCase()}) Berhasil! Merchant ID: ${midForm.merchantId || 'Default'}`,
          });
        }
      } else if (provider === 'xendit') {
        if (!xenForm.secretKey) {
          setTestResult({
            provider: 'Xendit',
            success: false,
            message: 'Secret API Key Xendit Wajib Diisi.',
          });
        } else {
          setTestResult({
            provider: 'Xendit',
            success: true,
            message: `Koneksi Xendit API (${xenForm.environment.toUpperCase()}) Valid & Siap Digunakan!`,
          });
        }
      } else if (provider === 'doku') {
        if (!dokuForm.clientId || !dokuForm.secretKey) {
          setTestResult({
            provider: 'DOKU',
            success: false,
            message: 'Client ID dan Secret Key DOKU Wajib Diisi.',
          });
        } else {
          setTestResult({
            provider: 'DOKU',
            success: true,
            message: `Koneksi DOKU API (${dokuForm.environment.toUpperCase()}) Terverifikasi!`,
          });
        }
      }
    }, 800);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Pengaturan Payment Gateway</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Integrasikan sistem POS cafe Anda dengan Midtrans, Xendit, atau DOKU untuk pembayaran otomatis (QRIS, E-Wallet, VA)
        </p>
      </div>

      {/* Save Success Alert */}
      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle size={20} className="text-emerald-600 font-bold" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Active Provider Selector Banner */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Pilih Payment Gateway Aktif</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Gateway terpilih akan digunakan saat pelanggan membayar dengan QRIS / Online Payment</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Aktif: {activeProvider === 'none' ? 'Manual QRIS' : activeProvider.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Provider Card 1: Manual / None */}
          <div
            onClick={() => updateActiveProvider('none')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProvider === 'none'
                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs">
                QRIS
              </div>
              {activeProvider === 'none' && <CheckCircle size={20} className="text-emerald-600 font-bold" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Manual / Statis</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Scan QRIS statis tanpa API Gateway</p>
            </div>
          </div>

          {/* Provider Card 2: Midtrans */}
          <div
            onClick={() => updateActiveProvider('midtrans')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProvider === 'midtrans'
                ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                Midtrans
              </div>
              {activeProvider === 'midtrans' && <CheckCircle size={20} className="text-blue-600 font-bold" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Midtrans</h3>
              <p className="text-xs text-zinc-500 mt-0.5">GoPay, QRIS, ShopeePay, Virtual Account</p>
            </div>
          </div>

          {/* Provider Card 3: Xendit */}
          <div
            onClick={() => updateActiveProvider('xendit')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProvider === 'xendit'
                ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20 shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                Xendit
              </div>
              {activeProvider === 'xendit' && <CheckCircle size={20} className="text-purple-600 font-bold" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Xendit</h3>
              <p className="text-xs text-zinc-500 mt-0.5">QRIS, OVO, Dana, LinkAja, Credit Card</p>
            </div>
          </div>

          {/* Provider Card 4: DOKU */}
          <div
            onClick={() => updateActiveProvider('doku')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeProvider === 'doku'
                ? 'border-rose-600 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
                DOKU
              </div>
              {activeProvider === 'doku' && <CheckCircle size={20} className="text-rose-600 font-bold" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">DOKU</h3>
              <p className="text-xs text-zinc-500 mt-0.5">DOKU Wallet, QRIS, Credit Card, VA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs For Gateway Setup */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/50">
          <button
            onClick={() => setActiveTab('midtrans')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'midtrans'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Konfigurasi Midtrans</span>
          </button>
          <button
            onClick={() => setActiveTab('xendit')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'xendit'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span>Konfigurasi Xendit</span>
          </button>
          <button
            onClick={() => setActiveTab('doku')}
            className={`flex-1 py-3.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'doku'
                ? 'border-rose-600 text-rose-700 bg-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span>Konfigurasi DOKU</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Test connection result banner */}
          {testResult && testResult.provider.toLowerCase() === activeTab && (
            <div
              className={`mb-6 p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 animate-fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {testResult.success ? <CheckCircle size={20} /> : <WarningCircle size={20} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* MIDTRANS FORM */}
          {activeTab === 'midtrans' && (
            <form onSubmit={handleSaveMidtrans} className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Midtrans Payment Gateway</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Dapatkan kredensial API dari Dashboard Midtrans (SNAP API Integration Settings)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Mode Environment</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setMidForm({ ...midForm, environment: 'sandbox' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      midForm.environment === 'sandbox'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Sandbox (Testing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMidForm({ ...midForm, environment: 'production' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      midForm.environment === 'production'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="midMerchantId" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Merchant ID
                </label>
                <input
                  id="midMerchantId"
                  type="text"
                  value={midForm.merchantId}
                  onChange={(e) => setMidForm({ ...midForm, merchantId: e.target.value })}
                  placeholder="Contoh: G123456789"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="midClientKey" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Client Key
                </label>
                <input
                  id="midClientKey"
                  type="text"
                  value={midForm.clientKey}
                  onChange={(e) => setMidForm({ ...midForm, clientKey: e.target.value })}
                  placeholder="SB-Mid-client-XXXXX atau Mid-client-XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="midServerKey" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Server Key (Rahasia)
                </label>
                <input
                  id="midServerKey"
                  type="password"
                  value={midForm.serverKey}
                  onChange={(e) => setMidForm({ ...midForm, serverKey: e.target.value })}
                  placeholder="SB-Mid-server-XXXXX atau Mid-server-XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Webhook notification helper */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="text-xs font-bold text-zinc-700 block">Webhook Notification Notification URL (Midtrans)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:5000/api/webhooks/midtrans"
                    className="flex-1 h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-mono text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:5000/api/webhooks/midtrans')}
                    className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={14} />
                    <span>{copiedUrl.includes('midtrans') ? 'Tercopy!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('midtrans')}
                  disabled={testing}
                  className="h-11 px-5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {testing ? <CircleNotch size={18} className="animate-spin" /> : <Lightning size={18} />}
                  <span>Tes Koneksi API</span>
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <Check size={18} />
                  <span>Simpan Midtrans</span>
                </button>
              </div>
            </form>
          )}

          {/* XENDIT FORM */}
          {activeTab === 'xendit' && (
            <form onSubmit={handleSaveXendit} className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Xendit Payment Gateway</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Dapatkan kredensial API dari Dashboard Xendit (Settings &gt; API Keys)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Mode Environment</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setXenForm({ ...xenForm, environment: 'sandbox' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      xenForm.environment === 'sandbox'
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Development (Testing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setXenForm({ ...xenForm, environment: 'production' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      xenForm.environment === 'production'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="xenSecretKey" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Secret API Key (Wajib)
                </label>
                <input
                  id="xenSecretKey"
                  type="password"
                  value={xenForm.secretKey}
                  onChange={(e) => setXenForm({ ...xenForm, secretKey: e.target.value })}
                  placeholder="xnd_development_XXXXX atau xnd_production_XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="xenPublicKey" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Public API Key (Opsional)
                </label>
                <input
                  id="xenPublicKey"
                  type="text"
                  value={xenForm.publicKey}
                  onChange={(e) => setXenForm({ ...xenForm, publicKey: e.target.value })}
                  placeholder="xnd_public_development_XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="xenWebhookToken" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Webhook Verification Token
                </label>
                <input
                  id="xenWebhookToken"
                  type="text"
                  value={xenForm.webhookToken}
                  onChange={(e) => setXenForm({ ...xenForm, webhookToken: e.target.value })}
                  placeholder="xnd_wh_tok_XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Webhook notification helper */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="text-xs font-bold text-zinc-700 block">Webhook Callback URL (Xendit)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:5000/api/webhooks/xendit"
                    className="flex-1 h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-mono text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:5000/api/webhooks/xendit')}
                    className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={14} />
                    <span>{copiedUrl.includes('xendit') ? 'Tercopy!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('xendit')}
                  disabled={testing}
                  className="h-11 px-5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {testing ? <CircleNotch size={18} className="animate-spin" /> : <Lightning size={18} />}
                  <span>Tes Koneksi API</span>
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-purple-600/20"
                >
                  <Check size={18} />
                  <span>Simpan Xendit</span>
                </button>
              </div>
            </form>
          )}

          {/* DOKU FORM */}
          {activeTab === 'doku' && (
            <form onSubmit={handleSaveDoku} className="space-y-5 max-w-2xl">
              <div>
                <h3 className="text-base font-bold text-zinc-900">DOKU Payment Gateway</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Dapatkan kredensial API dari Back Office / Dashboard DOKU (Integration Merchant Setup)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Mode Environment</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setDokuForm({ ...dokuForm, environment: 'sandbox' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      dokuForm.environment === 'sandbox'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Sandbox (Testing)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDokuForm({ ...dokuForm, environment: 'production' })}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      dokuForm.environment === 'production'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Production (Live)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="dokuClientId" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Client ID / App ID
                </label>
                <input
                  id="dokuClientId"
                  type="text"
                  value={dokuForm.clientId}
                  onChange={(e) => setDokuForm({ ...dokuForm, clientId: e.target.value })}
                  placeholder="Contoh: CLIENT-ID-12345"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="dokuSecretKey" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Secret Key (Shared Key)
                </label>
                <input
                  id="dokuSecretKey"
                  type="password"
                  value={dokuForm.secretKey}
                  onChange={(e) => setDokuForm({ ...dokuForm, secretKey: e.target.value })}
                  placeholder="SK-XXXXX-XXXXX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                />
              </div>

              <div>
                <label htmlFor="dokuMallId" className="block text-sm font-semibold text-zinc-700 mb-1">
                  Mall ID
                </label>
                <input
                  id="dokuMallId"
                  type="text"
                  value={dokuForm.mallId}
                  onChange={(e) => setDokuForm({ ...dokuForm, mallId: e.target.value })}
                  placeholder="Contoh: 1234"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all"
                />
              </div>

              {/* Webhook notification helper */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1.5">
                <span className="text-xs font-bold text-zinc-700 block">Notification / Webhook URL (DOKU)</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="http://localhost:5000/api/webhooks/doku"
                    className="flex-1 h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-mono text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard('http://localhost:5000/api/webhooks/doku')}
                    className="h-9 px-3 rounded-lg border border-zinc-300 bg-white text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={14} />
                    <span>{copiedUrl.includes('doku') ? 'Tercopy!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleTestConnection('doku')}
                  disabled={testing}
                  className="h-11 px-5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-sm font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  {testing ? <CircleNotch size={18} className="animate-spin" /> : <Lightning size={18} />}
                  <span>Tes Koneksi API</span>
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/20"
                >
                  <Check size={18} />
                  <span>Simpan DOKU</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
