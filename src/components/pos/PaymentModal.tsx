import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Money,
  QrCode,
  CreditCard,
  CheckCircle,
  CircleNotch,
  Printer,
  Plus,
  Trash,
  Check,
  Users,
  Wallet,
  CheckSquare,
  Square,
  Receipt,
} from '@phosphor-icons/react';
import api from '../../lib/api';
import { saveOfflineTransaction } from '../../lib/db';
import { useCartStore } from '../../stores/cartStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { usePaymentGatewayStore } from '../../stores/paymentGatewayStore';
import { formatRupiah, paymentMethodLabel } from '../../lib/utils';
import type { Shift, MetodePembayaran } from '../../types';
import { ThermalReceipt, ThermalReceiptData } from './ThermalReceipt';
import { useAuthStore } from '../../stores/authStore';

interface Props {
  activeShift: Shift;
  onClose: () => void;
}

export interface PartialPaymentEntry {
  id: string;
  metode: MetodePembayaran;
  jumlahDibayar: number;
  kembalian: number;
  itemNames?: string[];
}

type PaymentMode = 'single' | 'split';
type SplitType = 'itemized' | 'nominal';
type PaymentStep = 'input' | 'success';

export default function PaymentModal({ activeShift, onClose }: Props) {
  const { items, tipeOrder, tableId, getSubtotal, getTotal, discountAmount, discountId, clientUuid, unpaidTxId, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { ukuranStruk } = useSettingsStore();
  const { activeProvider: activeGatewayProvider } = usePaymentGatewayStore();

  const total = getTotal();
  const subtotal = getSubtotal();

  const [mode, setMode] = useState<PaymentMode>('single');
  const [splitType, setSplitType] = useState<SplitType>('itemized');
  const [step, setStep] = useState<PaymentStep>('input');
  const [selectedMethod, setSelectedMethod] = useState<MetodePembayaran>('cash');

  // Itemized Split selection state
  const [paidItemKeys, setPaidItemKeys] = useState<Set<string>>(new Set());
  const [selectedItemKeys, setSelectedItemKeys] = useState<Set<string>>(new Set());

  // Amounts
  const [inputAmount, setInputAmount] = useState(total.toString());
  const [inputDisplayValue, setInputDisplayValue] = useState(total.toLocaleString('id-ID'));
  const [paymentsList, setPaymentsList] = useState<PartialPaymentEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedTx, setCompletedTx] = useState<any>(null);

  // Helper key generator
  const getItemKey = (item: any) => `${item.productId}-${item.variantId || ''}`;

  // Sum of payments collected in split mode
  const totalCollected = useMemo(() => {
    if (mode === 'single') return 0;
    return paymentsList.reduce((sum, p) => sum + (p.metode === 'cash' ? Math.min(p.jumlahDibayar, total - sum) : p.jumlahDibayar), 0);
  }, [paymentsList, total, mode]);

  const remainingBalance = Math.max(0, total - totalCollected);
  const isFullyPaid = mode === 'split' ? remainingBalance === 0 : true;

  const activeKembalian = selectedMethod === 'cash'
    ? Math.max(0, (parseInt(inputAmount || '0') - (mode === 'split' ? (splitType === 'itemized' && selectedItemKeys.size > 0 ? Array.from(selectedItemKeys).reduce((sum, k) => { const it = items.find(i => getItemKey(i) === k); return sum + (it ? it.hargaSatuan * it.jumlah : 0); }, 0) : remainingBalance) : total)))
    : 0;

  // Toggle item selection for itemized split
  const toggleItemSelection = (key: string) => {
    setSelectedItemKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      // Automatically recalculate amount based on selected items!
      let calcSum = 0;
      items.forEach((item) => {
        const itemKey = getItemKey(item);
        if (next.has(itemKey)) {
          calcSum += item.hargaSatuan * item.jumlah;
        }
      });

      if (calcSum > 0) {
        setInputAmount(calcSum.toString());
        setInputDisplayValue(calcSum.toLocaleString('id-ID'));
      } else {
        setInputAmount('');
        setInputDisplayValue('');
      }

      return next;
    });
  };

  const handleInputChange = (val: string) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) {
      setInputAmount('');
      setInputDisplayValue('');
      return;
    }
    const num = parseInt(rawDigits, 10);
    setInputAmount(num.toString());
    setInputDisplayValue(num.toLocaleString('id-ID'));
  };

  const handleSelectQuickAmount = (amt: number) => {
    setInputAmount(amt.toString());
    setInputDisplayValue(amt.toLocaleString('id-ID'));
  };

  const handleSwitchMode = (newMode: PaymentMode) => {
    setMode(newMode);
    setError('');
    setSelectedMethod('cash');
    setPaidItemKeys(new Set());
    setSelectedItemKeys(new Set());

    if (newMode === 'single') {
      setInputAmount(total.toString());
      setInputDisplayValue(total.toLocaleString('id-ID'));
    } else {
      setInputAmount('');
      setInputDisplayValue('');
      setPaymentsList([]);
    }
  };

  // Add partial payment chunk in split mode
  const handleAddPaymentChunk = () => {
    const amt = parseInt(inputAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Pilih minimal 1 item atau masukkan nominal pembayaran yang valid');
      return;
    }

    const chunkKembalian = selectedMethod === 'cash' ? Math.max(0, amt - remainingBalance) : 0;

    // Collect names of selected items
    const selectedNames: string[] = [];
    if (splitType === 'itemized' && selectedItemKeys.size > 0) {
      items.forEach((i) => {
        if (selectedItemKeys.has(getItemKey(i))) {
          selectedNames.push(`${i.jumlah}x ${i.namaProduk}${i.namaVarian ? ` (${i.namaVarian})` : ''}`);
        }
      });

      // Mark selected items as paid
      setPaidItemKeys((prev) => {
        const next = new Set(prev);
        selectedItemKeys.forEach((k) => next.add(k));
        return next;
      });
    }

    const newEntry: PartialPaymentEntry = {
      id: `pay-${Date.now()}-${Math.random()}`,
      metode: selectedMethod,
      jumlahDibayar: amt,
      kembalian: chunkKembalian,
      itemNames: selectedNames.length > 0 ? selectedNames : undefined,
    };

    setPaymentsList((prev) => [...prev, newEntry]);
    setSelectedItemKeys(new Set());
    setInputAmount('');
    setInputDisplayValue('');
    setError('');
  };

  const handleRemovePaymentChunk = (entry: PartialPaymentEntry) => {
    setPaymentsList((prev) => prev.filter((p) => p.id !== entry.id));
    // Reset paid keys if itemized
    if (entry.itemNames) {
      setPaidItemKeys(new Set());
    }
  };

  const { data: tablesData } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/tables');
        return data.tables || [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const selectedTableObj = tablesData?.find((t: any) => t.id === tableId);
  const displayNomorMeja = selectedTableObj ? selectedTableObj.nomorMeja : tableId;

  // Prepare thermal receipt data
  const receiptData: ThermalReceiptData = useMemo(() => {
    let finalPayments = paymentsList;
    if (mode === 'single' || finalPayments.length === 0) {
      const amt = parseInt(inputAmount || total.toString());
      finalPayments = [
        {
          id: 'pay-single',
          metode: selectedMethod,
          jumlahDibayar: amt,
          kembalian: selectedMethod === 'cash' ? Math.max(0, amt - total) : 0,
        },
      ];
    }

    return {
      clientUuid,
      createdAt: new Date().toISOString(),
      kasirNama: user?.nama || 'Kasir',
      tipeOrder,
      nomorMeja: displayNomorMeja || null,
      items: items.map((i) => ({
        namaProduk: i.namaProduk,
        namaVarian: i.namaVarian,
        jumlah: i.jumlah,
        hargaSatuan: i.hargaSatuan,
        hargaTotal: i.hargaSatuan * i.jumlah,
        catatan: i.catatan || null,
      })),
      subtotal,
      diskon: discountAmount,
      pajak: 0,
      total,
      payments: finalPayments.map((p) => ({
        metode: p.metode,
        jumlahDibayar: p.jumlahDibayar,
        kembalian: p.kembalian,
      })),
    };
  }, [clientUuid, user, tipeOrder, displayNomorMeja, items, subtotal, discountAmount, total, paymentsList, mode, selectedMethod, inputAmount]);

  // Submit transaction
  const handleCompleteTransaction = async () => {
    let finalPayments = [...paymentsList];

    if (mode === 'single' || finalPayments.length === 0) {
      const amt = parseInt(inputAmount);
      if (isNaN(amt) || (selectedMethod === 'cash' && amt < total)) {
        setError('Jumlah pembayaran tunai belum mencukupi total tagihan');
        return;
      }
      finalPayments = [
        {
          id: `pay-${Date.now()}`,
          metode: selectedMethod,
          jumlahDibayar: amt,
          kembalian: selectedMethod === 'cash' ? Math.max(0, amt - total) : 0,
        },
      ];
    }

    setLoading(true);
    setError('');

    const transactionData = {
      clientUuid,
      tipeOrder,
      tableId: tableId || null,
      discountId: discountId || null,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        jumlah: i.jumlah,
        hargaSatuan: i.hargaSatuan,
        hargaTotal: i.hargaSatuan * i.jumlah,
        catatan: i.catatan || null,
      })),
      payments: finalPayments.map((p) => ({
        metode: p.metode,
        jumlahDibayar: p.jumlahDibayar,
        kembalian: p.kembalian,
      })),
    };

    try {
      if (unpaidTxId) {
        const { data } = await api.patch(`/transactions/${unpaidTxId}/pay`, {
          payments: transactionData.payments,
          discountId: transactionData.discountId,
        });
        setCompletedTx(data.transaction);
      } else if (navigator.onLine) {
        const { data } = await api.post('/transactions', transactionData);
        setCompletedTx(data.transaction);
      } else {
        await saveOfflineTransaction({
          ...transactionData,
          shiftId: activeShift.id,
          status: 'paid',
          subtotal,
          diskon: discountAmount,
          pajak: 0,
          total,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
        });
        setCompletedTx({ clientUuid, total, offline: true });
      }

      setStep('success');
    } catch (err: any) {
      try {
        await saveOfflineTransaction({
          ...transactionData,
          shiftId: activeShift.id,
          status: 'paid',
          subtotal,
          diskon: discountAmount,
          pajak: 0,
          total,
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
        });
        setCompletedTx({ clientUuid, total, offline: true });
        setStep('success');
      } catch {
        setError(err.response?.data?.error || 'Gagal memproses pembayaran');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    clearCart();
    onClose();
  };

  const handlePrint = () => {
    document.body.classList.remove('paper-58mm', 'paper-80mm');
    document.body.classList.add(ukuranStruk === '58mm' ? 'paper-58mm' : 'paper-80mm');
    window.print();
  };

  const printContainer = document.getElementById('thermal-receipt-container');

  return (
    <>
      {printContainer && createPortal(<ThermalReceipt data={receiptData} />, printContainer)}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-4 font-sans">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl animate-slide-up border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50">
            <div>
              <h3 className="text-base font-bold text-zinc-900">Pembayaran Kasir</h3>
              <p className="text-xs text-zinc-500 font-mono">
                Total Tagihan: <span className="font-bold text-emerald-600">{formatRupiah(total)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* ─── STEP 1: PAYMENT INPUT & MODE TABS ─── */}
          {step === 'input' && (
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Mode Segmented Control Tabs */}
              <div className="flex rounded-xl bg-zinc-100 p-1 border border-zinc-200">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('single')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'single'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Wallet size={15} weight={mode === 'single' ? 'fill' : 'regular'} />
                  <span>Bayar Penuh (1 Tagihan)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchMode('split')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    mode === 'split'
                      ? 'bg-white text-blue-800 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <Users size={15} weight={mode === 'split' ? 'fill' : 'regular'} />
                  <span>Split Payment (Patungan)</span>
                </button>
              </div>

              {/* Split Mode Banner & Sub-mode (Itemized vs Nominal) */}
              {mode === 'split' && (
                <div className="space-y-3">
                  <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isFullyPaid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}>
                    <div>
                      <p className="text-xs font-semibold">
                        {isFullyPaid ? 'Status Tagihan:' : 'Sisa Tagihan Yang Belum Dibayar:'}
                      </p>
                      <p className="text-xl font-bold font-mono">
                        {isFullyPaid ? 'LUNAS' : formatRupiah(remainingBalance)}
                      </p>
                    </div>
                    {isFullyPaid && (
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Check size={18} />
                      </div>
                    )}
                  </div>

                  {/* Split Sub-mode: Itemized vs Nominal */}
                  {!isFullyPaid && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitType('itemized')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          splitType === 'itemized'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200'
                        }`}
                      >
                        Pilih Per Item (Otomatis)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitType('nominal')}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          splitType === 'nominal'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200'
                        }`}
                      >
                        Input Manual Nominal
                      </button>
                    </div>
                  )}

                  {/* Itemized Selection List */}
                  {splitType === 'itemized' && !isFullyPaid && (
                    <div className="space-y-2 p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                      <label className="block text-xs font-bold text-zinc-700">
                        Centang Item Yang Mau Dibayar Orang Ini (Total Otomatis Hitung):
                      </label>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {items.map((item) => {
                          const key = getItemKey(item);
                          const isPaid = paidItemKeys.has(key);
                          const isChecked = selectedItemKeys.has(key);
                          const itemTotal = item.hargaSatuan * item.jumlah;

                          return (
                            <div
                              key={key}
                              onClick={() => !isPaid && toggleItemSelection(key)}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs select-none ${
                                isPaid
                                  ? 'bg-zinc-200/70 border-zinc-300 opacity-50 cursor-not-allowed'
                                  : isChecked
                                  ? 'bg-blue-50 border-blue-400 font-bold text-blue-900 cursor-pointer shadow-xs'
                                  : 'bg-white border-zinc-200 hover:border-blue-300 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {isPaid ? (
                                  <CheckCircle size={18} className="text-zinc-500" />
                                ) : isChecked ? (
                                  <CheckSquare size={18} weight="fill" className="text-blue-600" />
                                ) : (
                                  <Square size={18} className="text-zinc-400" />
                                )}
                                <div>
                                  <p className="font-bold text-zinc-900">
                                    {item.jumlah}x {item.namaProduk}
                                    {item.namaVarian ? ` (${item.namaVarian})` : ''}
                                  </p>
                                  {item.catatan && <p className="text-[10px] text-zinc-500 italic">* {item.catatan}</p>}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-zinc-900">{formatRupiah(itemTotal)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Method Selector */}
              {(!isFullyPaid || mode === 'single') && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-2">
                    Pilih Metode Pembayaran:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('cash');
                        if (mode === 'single') {
                          setInputAmount(total.toString());
                          setInputDisplayValue(total.toLocaleString('id-ID'));
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <Money size={20} weight={selectedMethod === 'cash' ? 'fill' : 'regular'} />
                      <span className="text-xs">Tunai</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('qris');
                        if (mode === 'single') {
                          setInputAmount(total.toString());
                          setInputDisplayValue(total.toLocaleString('id-ID'));
                        } else if (splitType === 'nominal') {
                          setInputAmount(remainingBalance.toString());
                          setInputDisplayValue(remainingBalance.toLocaleString('id-ID'));
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedMethod === 'qris'
                          ? 'border-blue-500 bg-blue-50 text-blue-800 font-bold shadow-xs'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <QrCode size={20} weight={selectedMethod === 'qris' ? 'fill' : 'regular'} />
                      <span className="text-xs">QRIS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod('kartu');
                        if (mode === 'single') {
                          setInputAmount(total.toString());
                          setInputDisplayValue(total.toLocaleString('id-ID'));
                        } else if (splitType === 'nominal') {
                          setInputAmount(remainingBalance.toString());
                          setInputDisplayValue(remainingBalance.toLocaleString('id-ID'));
                        }
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedMethod === 'kartu'
                          ? 'border-purple-500 bg-purple-50 text-purple-800 font-bold shadow-xs'
                          : 'border-zinc-200 hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <CreditCard size={20} weight={selectedMethod === 'kartu' ? 'fill' : 'regular'} />
                      <span className="text-xs">Kartu EDC</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Input Box */}
              {mode === 'single' ? (
                <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50">
                  {selectedMethod === 'cash' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1">
                          Jumlah Uang Diterima Tunai (Rp)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 select-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputDisplayValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={total.toLocaleString('id-ID')}
                            autoFocus
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-300 bg-white text-base font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>
                      </div>

                      {/* Quick presets */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectQuickAmount(total)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                        >
                          Uang Pas ({formatRupiah(total)})
                        </button>
                        {[50000, 100000, 200000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSelectQuickAmount(amt)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs font-mono font-medium text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            {formatRupiah(amt)}
                          </button>
                        ))}
                      </div>

                      {/* Kembalian */}
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-zinc-200 font-bold">
                        <span className="text-zinc-600">Kembalian:</span>
                        <span className="font-mono text-base text-emerald-600">
                          {formatRupiah(activeKembalian)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center space-y-1">
                      <p className="text-xs text-zinc-500">Total Tagihan:</p>
                      <p className="text-2xl font-bold font-mono text-emerald-600">{formatRupiah(total)}</p>
                      <p className="text-xs text-zinc-400">Pastikan pembayaran QRIS / EDC berhasil sebelum konfirmasi</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Split Mode Input Box */
                !isFullyPaid && (
                  <div className="space-y-3 p-3.5 rounded-xl border border-zinc-200 bg-zinc-50">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">
                        Jumlah Uang Dibayar Orang Ini ({paymentMethodLabel(selectedMethod)})
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 select-none">
                            Rp
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={inputDisplayValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder={remainingBalance.toLocaleString('id-ID')}
                            className="w-full h-11 pl-9 pr-3 rounded-xl border border-zinc-300 bg-white text-base font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddPaymentChunk}
                          disabled={!inputAmount || parseInt(inputAmount) <= 0}
                          className="h-11 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm"
                        >
                          <Plus size={16} />
                          <span>+ Tambah Pembayaran</span>
                        </button>
                      </div>
                    </div>

                    {selectedMethod === 'cash' && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSelectQuickAmount(remainingBalance)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
                        >
                          Pas ({formatRupiah(remainingBalance)})
                        </button>
                        {[20000, 50000, 100000, 200000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => handleSelectQuickAmount(amt)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-zinc-300 text-xs font-mono font-medium text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            {formatRupiah(amt)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Split Mode Collected Payments List */}
              {mode === 'split' && paymentsList.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-zinc-700">
                    Rincian Pembayaran Masuk ({paymentsList.length} tahap / orang):
                  </label>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {paymentsList.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200 bg-white text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-100 font-mono font-bold text-[11px] flex items-center justify-center text-zinc-700">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-zinc-800 capitalize">
                              {paymentMethodLabel(p.metode)}
                            </span>
                            {p.itemNames && (
                              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                                {p.itemNames.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-600">
                            {formatRupiah(p.jumlahDibayar)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentChunk(p)}
                            className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCompleteTransaction}
                  disabled={
                    loading ||
                    (mode === 'single' && selectedMethod === 'cash' && parseInt(inputAmount || '0') < total) ||
                    (mode === 'split' && !isFullyPaid)
                  }
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {loading ? (
                    <CircleNotch size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={18} weight="bold" />
                      <span>
                        {mode === 'single'
                          ? 'Konfirmasi Pembayaran Lunas'
                          : isFullyPaid
                          ? 'Selesaikan Transaksi (Lunas)'
                          : 'Selesaikan Transaksi'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: SUCCESS & RECEIPT PRINT ─── */}
          {step === 'success' && (
            <div className="p-5 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle size={36} weight="fill" className="text-emerald-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-zinc-900">Pembayaran Berhasil Lunas</h3>
                <p className="text-xs text-zinc-500">
                  {mode === 'split' && paymentsList.length > 1
                    ? `Split Payment ${paymentsList.length} tahap pembayaran berhasil diproses`
                    : 'Transaksi telah berhasil diproses'}
                </p>
                {completedTx?.offline && (
                  <p className="text-xs font-semibold text-amber-600 mt-1">Tersimpan offline — akan disinkronkan saat online</p>
                )}
              </div>

              {/* On-screen Struk Preview */}
              <div className="max-h-64 overflow-y-auto border border-zinc-200 rounded-xl p-2 bg-zinc-50 shadow-inner">
                <ThermalReceipt data={receiptData} />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 h-11 rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Printer size={18} className="text-zinc-600" />
                  <span>Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
