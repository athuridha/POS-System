import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Gear,
  Check,
  Storefront,
  MapPin,
  Phone,
  ChatTeardropText,
  Printer,
  UploadSimple,
  ArrowCounterClockwise,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsClockwise,
  Crop,
  X,
  ArrowsOutCardinal,
} from '@phosphor-icons/react';
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

  // Cropper Modal state
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormNama(namaCafe);
    setFormAlamat(alamatCafe);
    setFormTelepon(teleponCafe);
    setFormFooter(footerPesan);
    setFormUkuran(ukuranStruk);
    setFormLogo(logoUrl);
  }, [namaCafe, alamatCafe, teleponCafe, footerPesan, ukuranStruk, logoUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar. Maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageToCrop(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be chosen again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setFormLogo(croppedDataUrl);
    setRawImageToCrop(null);
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
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Pengaturan Struk & Cafe</h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
          Ubah logo cafe, nama, alamat, nomor telepon, ukuran printer, dan footer struk
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fade-in shadow-xs">
          <Check size={18} className="text-emerald-600 font-bold" />
          <span>Pengaturan berhasil disimpan! Logo dan informasi baru langsung aktif di seluruh sistem.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Logo & Informasi Cafe</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload & Adjust Section */}
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5 flex items-center gap-2">
                <Storefront size={16} className="text-emerald-600" />
                <span>Logo Cafe / Brand (Bisa Di-Zoom & Potong)</span>
              </label>
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-50 border border-zinc-200">
                <img
                  src={formLogo}
                  alt="Cafe Logo"
                  className="w-14 h-14 rounded-2xl object-cover border border-zinc-300 shadow-xs shrink-0 bg-white"
                />
                <div className="space-y-1.5 flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs shadow-emerald-600/20"
                    >
                      <UploadSimple size={14} weight="bold" />
                      <span>Upload & Atur Logo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormLogo('https://placehold.co/120x120/10b981/ffffff?text=POS+Cafe')}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <ArrowCounterClockwise size={14} />
                      <span>Reset Default</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Pilih gambar untuk membuka jendela <strong>Zoom, Putar, & Crop</strong>
                  </p>
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
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-600'
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
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-600'
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

        {/* Right Col: Live Ticket & Browser Tab Preview */}
        <div className="space-y-6">
          {/* Live Browser Tab Preview */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview Tab Browser</h2>
            <div className="bg-zinc-900 p-2.5 rounded-xl text-zinc-300">
              <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 max-w-full">
                <img
                  src={formLogo}
                  alt="Favicon"
                  className="w-4 h-4 rounded-xs object-cover shrink-0 bg-white"
                />
                <span className="text-xs font-bold text-white truncate flex-1">
                  {formNama || 'POS Cafe'}
                </span>
                <span className="text-zinc-500 text-xs hover:text-white cursor-pointer ml-1">×</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Nama Cafe dan Logo ini akan otomatis menjadi <strong>Judul Halaman</strong> dan <strong>Favicon Tab Browser</strong> Anda.
            </p>
          </div>

          {/* Live Ticket Preview */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview Struk ({formUkuran})</h2>
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-[11px] text-zinc-800 space-y-2 text-center shadow-inner">
              <img src={formLogo} alt="Logo Preview" className="w-10 h-10 rounded-lg mx-auto object-cover border border-zinc-200 bg-white" />
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

      {/* ── Modal Image Cropper & Zoom Adjuster ── */}
      {rawImageToCrop && (
        <ImageCropModal
          imageSrc={rawImageToCrop}
          onClose={() => setRawImageToCrop(null)}
          onApply={handleCropComplete}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ── COMPONENT: ImageCropModal (Zoom In, Zoom Out, Rotate, Pan & Crop) ─
// ══════════════════════════════════════════════════════════════════════
function ImageCropModal({
  imageSrc,
  onClose,
  onApply,
}: {
  imageSrc: string;
  onClose: () => void;
  onApply: (croppedDataUrl: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Mouse & Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom helpers
  const handleZoomIn = () => setZoom((prev) => Math.min(3, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.4, +(prev - 0.15).toFixed(2)));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleCropAndApply = () => {
    if (!imgElement) return;

    const CROP_SIZE = 512; // High-resolution square output
    const canvas = document.createElement('canvas');
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Background fill (white)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

    // Coordinate transformations
    ctx.save();
    ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Compute scaled dimensions
    // Box in modal is 280x280, scale ratio to 512 is 512/280
    const VIEWPORT_SIZE = 280;
    const scaleFactor = CROP_SIZE / VIEWPORT_SIZE;

    const baseWidth = imgElement.width;
    const baseHeight = imgElement.height;

    // Fit contain ratio
    const fitRatio = Math.min(VIEWPORT_SIZE / baseWidth, VIEWPORT_SIZE / baseHeight);
    const drawWidth = baseWidth * fitRatio * zoom * scaleFactor;
    const drawHeight = baseHeight * fitRatio * zoom * scaleFactor;

    ctx.drawImage(
      imgElement,
      -drawWidth / 2 + offset.x * scaleFactor,
      -drawHeight / 2 + offset.y * scaleFactor,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/png', 0.95);
    onApply(croppedDataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs font-sans animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 max-w-md w-full overflow-hidden flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <Crop size={20} className="text-emerald-600 font-bold" />
            <h3 className="text-base font-bold text-zinc-900">Sesuaikan & Potong Logo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          <p className="text-xs text-zinc-500 text-center font-medium">
            Geser posisi gambar dan sesuaikan zoom agar logo pas di dalam bingkai.
          </p>

          {/* Interactive Crop Viewport (280x280) */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative w-[280px] h-[280px] rounded-2xl bg-zinc-900 border-2 border-emerald-500 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing select-none flex items-center justify-center"
          >
            {/* Background Grid Lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/10 z-20">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div />
            </div>

            {/* Circular Preview Ring Overlay */}
            <div className="absolute inset-2 rounded-full border border-dashed border-emerald-400/40 pointer-events-none z-20" />

            {/* Render Image with dynamic Zoom, Pan & Rotation */}
            {imgElement && (
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
                className="transition-transform duration-75 ease-out"
              />
            )}
          </div>

          {/* Zoom Slider & Controls */}
          <div className="w-full space-y-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Zoom Out"
              >
                <MagnifyingGlassMinus size={16} />
              </button>

              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-zinc-200 rounded-lg"
              />

              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0 shadow-xs"
                title="Zoom In"
              >
                <MagnifyingGlassPlus size={16} />
              </button>

              <span className="text-xs font-mono font-bold text-zinc-600 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Rotate & Reset Buttons */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl bg-white border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <ArrowsClockwise size={14} />
                <span>Putar 90° ({rotation}°)</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl border border-transparent text-zinc-500 font-semibold hover:text-zinc-900 transition-colors cursor-pointer flex items-center gap-1"
              >
                <ArrowCounterClockwise size={14} />
                <span>Reset Posisi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-zinc-200 bg-zinc-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCropAndApply}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/20"
          >
            <Check size={16} weight="bold" />
            <span>Terapkan & Gunakan Logo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
