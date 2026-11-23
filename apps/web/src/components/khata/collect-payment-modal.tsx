"use client";

import { useState, useTransition } from "react";
import {
  SanitizedKhataRetailer,
  collectPaymentAction,
  MoneyReceiptVoucher,
} from "@/lib/actions/khata-actions";
import {
  Wallet,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Store,
  DollarSign,
} from "lucide-react";
import { roundCurrency } from "@/lib/calculations";

interface CollectPaymentModalProps {
  retailers: SanitizedKhataRetailer[];
  initialRetailerId?: string;
  onClose: () => void;
  onSuccess: (voucher: MoneyReceiptVoucher) => void;
}

const PAYMENT_METHODS = [
  { id: "CASH", label: "ক্যাশ (Cash)" },
  { id: "BKASH", label: "বিকাশ (bKash)" },
  { id: "NAGAD", label: "নগদ (Nagad)" },
  { id: "BANK", label: "ব্যাংক (Bank)" },
];

export default function CollectPaymentModal({
  retailers,
  initialRetailerId,
  onClose,
  onSuccess,
}: CollectPaymentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(
    initialRetailerId || retailers[0]?.id || ""
  );
  const [amountInput, setAmountInput] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "BKASH" | "NAGAD" | "BANK"
  >("CASH");
  const [notes, setNotes] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRetailer = retailers.find((r) => r.id === selectedRetailerId);

  const currentDue = selectedRetailer ? selectedRetailer.currentDue : 0;
  const numAmount = parseFloat(amountInput) || 0;
  const remainingDue = roundCurrency(currentDue - numAmount);

  // Quick Amount Handlers
  const handleSetFullPayment = () => {
    if (currentDue > 0) {
      setAmountInput(String(currentDue));
    }
  };

  const handleSetHalfPayment = () => {
    if (currentDue > 0) {
      setAmountInput(String(roundCurrency(currentDue / 2)));
    }
  };

  const handleSetPresetAmount = (val: number) => {
    setAmountInput(String(val));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedRetailerId) {
      setErrorMsg("দোকানদার নির্বাচন করুন।");
      return;
    }

    if (numAmount <= 0) {
      setErrorMsg("জমার পরিমাণ ০ টাকার বেশি হতে হবে।");
      return;
    }

    startTransition(async () => {
      const res = await collectPaymentAction({
        retailerId: selectedRetailerId,
        amount: numAmount,
        paymentMethod,
        notes: notes || undefined,
      });

      if (res.success && res.voucher) {
        onSuccess(res.voucher);
      } else {
        setErrorMsg(res.error || "টাকা জমা করতে ব্যর্থ হয়েছে।");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              বকেয়া টাকা আদায় (Payment Collection)
            </h3>
            <p className="text-xs text-slate-500">
              দোকানদার থেকে নগদ বা অনলাইনে টাকা গ্রহণ ও রশিদ প্রদান
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Retailer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              দোকানদার নির্বাচন করুন *
            </label>
            <select
              value={selectedRetailerId}
              onChange={(e) => {
                setSelectedRetailerId(e.target.value);
                setAmountInput("");
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 font-bold text-slate-800"
            >
              {retailers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.shopName} ({r.phone}) - বর্তমান বাকি: ৳{r.currentDue.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Current Due Banner */}
          {selectedRetailer && (
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-amber-700 uppercase">
                  বর্তমান মোট বাকি
                </p>
                <p className="text-lg font-black text-amber-900 font-mono">
                  ৳ {currentDue.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold text-slate-500">
                  বাকি লিমিট: ৳{selectedRetailer.creditLimit.toLocaleString()}
                </p>
                {selectedRetailer.beatName && (
                  <p className="text-[10px] text-slate-500 font-medium">
                    রুট: {selectedRetailer.beatName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Quick Amount Buttons */}
          {currentDue > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                দ্রুত টাকার পরিমাণ নির্বাচন:
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={handleSetFullPayment}
                  className="py-1 px-1.5 font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                >
                  সম্পূর্ণ (Full)
                </button>
                <button
                  type="button"
                  onClick={handleSetHalfPayment}
                  className="py-1 px-1.5 font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                >
                  অর্ধেক (50%)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetAmount(1000)}
                  className="py-1 px-1.5 font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  ৳১,০০০
                </button>
                <button
                  type="button"
                  onClick={() => handleSetPresetAmount(5000)}
                  className="py-1 px-1.5 font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  ৳৫,০০০
                </button>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              আদায়ের পরিমাণ (টাকা) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="10"
              placeholder="টাকার অংক লিখুন..."
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-full px-3 py-2 text-sm font-black text-emerald-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              পেমেন্ট মাধ্যম *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-1 text-center font-bold text-[11px] rounded-xl border transition-all ${
                    paymentMethod === m.id
                      ? "bg-[#1C398E] text-white border-[#1C398E] shadow-xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Trx ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              নোট / Trx ID / চেক নম্বর (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="যেমন: TrxID: 9X7D8... বা চেক নং"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30"
            />
          </div>

          {/* Remaining Balance Preview */}
          {numAmount > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600">
                জমা পরবর্তী নতুন বাকি:
              </span>
              <span
                className={`font-black font-mono text-sm ${
                  remainingDue <= 0 ? "text-emerald-600" : "text-amber-700"
                }`}
              >
                ৳ {remainingDue.toLocaleString()}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isPending || numAmount <= 0}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
            >
              {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>টাকা জমা ও রশিদ প্রিন্ট</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
