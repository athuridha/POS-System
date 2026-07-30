import { useState, useEffect, useRef } from 'react';
import { Gear, Check, Storefront, MapPin, Phone, ChatTeardropText, Printer, UploadSimple, ArrowCounterClockwise } from '@phosphor-icons/react';
import { useSettingsStore } from '../stores/settingsStore';

export default function SettingsPage() {
  const { namaCafe, alamatCafe, teleponCafe, footerPesan, ukuranStruk, logoUrl, updateSettings } = useSettingsStore();

  const [formNama, setFormNama] = useState(namaCafe);
  const [formAlamat, setFormAlamat] = useState(alamatCafe);
  const [formTelepon, setFormTelepon] = useState(teleponCafe);
  const [formFooter, setFormFooter] = useState(footerPesan);
  const [formUkuran, setFormUkuran] = useState<'58mm' | '80mm'>(ukuranStruk);
  const [formLogo, setFormLogo] = useState(logoUrl);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormNama(namaCafe);
    setFormAlamat(alamatCafe);
    setFormTelepon(teleponCafe);
    setFormFooter(footerPesan);
    setFormUkuran(ukuranStruk);
    setFormLogo(logoUrl);
  }, [namaCafe, alamatCafe, teleponCafe, footerPesan, ukuranStruk, logoUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      namaCafe: formNama,
      alamatCafe: formAlamat,
      teleponCafe: formTelepon,
      footerPesan: formFooter,
      ukuranStruk: formUkuran,
      logoUrl: formLogo,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Pengaturan Struk & Cafe</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Ubah logo cafe, nama, alamat, nomor telepon, ukuran printer, dan footer struk</p>
      </div>

      {saved && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Check size={18} className="text-emerald-600 font-bold" />
          <span>Pengaturan berhasil disimpan! Logo dan informasi baru langsung aktif di seluruh sistem.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Logo & Informasi Cafe</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <Storefront size={16} className="text-emerald-600" />
                <span>Logo Cafe / Brand</span>
              </label>
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                <img
                  src={formLogo}
                  alt="Cafe Logo"
                  className="w-14 h-14 rounded-xl object-cover border border-zinc-300 shadow-xs shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <UploadSimple size={14} />
                      <span>Upload Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormLogo('https://placehold.co/120x120/10b981/ffffff?text=POS+Cafe')}
                      className="px-3 py-1.5 rounded-lg border border-transparent text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowCounterClockwise size={14} />
                      <span>Reset</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">Format PNG/JPG, maksimal 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="namaCafe" className="block text-sm font-semibold text-zinc-700 mb-1.5">
                Nama Cafe / Toko
              </label>
              <input
                id="namaCafe"
                type="text"
                value={formNama}
                onChange={(e) => setFormNama(e.target.value)}
                placeholder="Contoh: CAFE KITA"
                required
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="alamatCafe" className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" />
                <span>Alamat Cafe</span>
              </label>
              <input
                id="alamatCafe"
                type="text"
                value={formAlamat}
                onChange={(e) => setFormAlamat(e.target.value)}
                placeholder="Jl. Melati No. 12, Jakarta"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label htmlFor="teleponCafe" className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <Phone size={16} className="text-emerald-600" />
                <span>Nomor Telepon</span>
              </label>
              <input
                id="teleponCafe"
                type="text"
                value={formTelepon}
                onChange={(e) => setFormTelepon(e.target.value)}
                placeholder="(021) 555-0199 / 08123456789"
                className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 bg-white text-sm font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <Printer size={16} className="text-emerald-600" />
                <span>Ukuran Kertas Printer Thermal</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormUkuran('80mm')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer text-left ${
                    formUkuran === '80mm'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="font-bold text-base">80mm</div>
                  <div className="text-xs text-zinc-500 font-normal">Standar Printer POS Kasir</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormUkuran('58mm')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all cursor-pointer text-left ${
                    formUkuran === '58mm'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                      : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  <div className="font-bold text-base">58mm</div>
                  <div className="text-xs text-zinc-500 font-normal">Printer Thermal Bluetooth Kecil</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="footerPesan" className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <ChatTeardropText size={16} className="text-emerald-600" />
                <span>Pesan Footer Struk (Multi-Line / Bebas Kustom)</span>
              </label>
              <textarea
                id="footerPesan"
                rows={4}
                value={formFooter}
                onChange={(e) => setFormFooter(e.target.value)}
                placeholder={`Terima kasih atas kunjungan Anda!\nFollow Instagram @amarcafe.id\nPassword WiFi: amarcafe123`}
                className="w-full p-3.5 rounded-xl border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all leading-relaxed"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Gunakan Enter untuk membuat baris baru (misal: Pesan terima kasih, Info WiFi, Social Media, atau Catatan Toko).
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Check size={18} />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Ticket Preview */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Preview Struk ({formUkuran})</h2>
          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-[11px] text-zinc-800 space-y-2 text-center shadow-inner">
            <img src={formLogo} alt="Logo Preview" className="w-10 h-10 rounded-lg mx-auto object-cover border border-zinc-200" />
            <h3 className="text-sm font-bold uppercase text-black">{formNama || 'NAMA CAFE'}</h3>
            {formAlamat && <p className="text-[10px] text-zinc-600">{formAlamat}</p>}
            {formTelepon && <p className="text-[10px] text-zinc-600">Telp: {formTelepon}</p>}

            <div className="border-b border-dashed border-zinc-400 my-2" />
            <p className="text-[10px] text-zinc-500 italic">[Detail Transaksi & Item Order]</p>
            <div className="border-b border-dashed border-zinc-400 my-2" />

            <div className="pt-1 space-y-0.5">
              {(formFooter || 'Pesan Footer')
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line, i) => (
                  <p key={i} className={`text-[10px] ${i === 0 ? 'font-bold uppercase text-black' : 'text-zinc-600 font-medium'}`}>
                    {line}
                  </p>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
