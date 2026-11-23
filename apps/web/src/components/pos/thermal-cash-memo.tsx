"use client";

import { useRef } from "react";
import { CompletedThermalInvoice } from "@/lib/actions/pos-actions";
import {
  Printer,
  Share2,
  CheckCircle2,
  X,
  AlertTriangle,
  RotateCcw,
  Store,
  Phone,
  Calendar,
  User,
  ShoppingBag,
} from "lucide-react";

interface ThermalCashMemoProps {
  invoice: CompletedThermalInvoice;
  onClose: () => void;
  onNewSale: () => void;
}

export default function ThermalCashMemo({
  invoice,
  onClose,
  onNewSale,
}: ThermalCashMemoProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share message preparation
  const getWhatsAppShareUrl = () => {
    const phone = invoice.retailer.phone.replace(/[\s\-\+]/g, "").replace(/^88/, "");
    const dateStr = new Date(invoice.createdAt).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const lines = [
      `*${invoice.distributorName}*`,
      `ক্যাশ মেমো নং: ${invoice.invoiceNumber}`,
      `তারিখ: ${dateStr}`,
      `দোকান: ${invoice.retailer.shopName}`,
      `------------------------`,
      `চলতি বিল: ৳${invoice.totalAmount.toLocaleString()}`,
      invoice.previousDue > 0 ? `পূর্বের বাকি: ৳${invoice.previousDue.toLocaleString()}` : "",
      `সর্বমোট টাকা: ৳${invoice.grandTotal.toLocaleString()}`,
      `জমা দেওয়া হয়েছে: ৳${invoice.paidAmount.toLocaleString()} (${
        invoice.cashAmount > 0 && invoice.mfsAmount > 0
          ? `ক্যাশ: ৳${invoice.cashAmount}, ${invoice.mfsProvider || "MFS"}: ৳${invoice.mfsAmount}`
          : invoice.cashAmount > 0
            ? "ক্যাশ"
            : invoice.mfsProvider || "MFS"
      })`,
      `------------------------`,
      `*বর্তমান বকেয়া জের: ৳${invoice.dueAmount.toLocaleString()}*`,
      `ধন্যবাদ!`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/88${phone}?text=${encodeURIComponent(lines)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative my-auto animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 print:hidden">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              বিল সফলভাবে সম্পন্ন হয়েছে
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons (Print, WhatsApp, New Sale) (Hidden when printing) */}
        <div className="grid grid-cols-3 gap-2 mb-5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1C398E] text-white text-xs font-bold hover:bg-[#162d70] shadow-sm shadow-[#1C398E]/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট রসিদ</span>
          </button>

          <a
            href={getWhatsAppShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>হোয়াটসঅ্যাপ</span>
          </a>

          <button
            onClick={onNewSale}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>নতুন মেমো</span>
          </button>
        </div>

        {/* 80mm / 3-Inch Standard Bangladesh Thermal Cash Memo Content */}
        <div
          ref={printRef}
          className="thermal-receipt bg-white text-slate-900 font-mono text-[11px] leading-tight p-2 sm:p-3 border border-slate-200 rounded-xl print:border-none print:p-0 print:text-[10pt]"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h2 className="text-base font-black tracking-tight text-slate-900 font-sans">
              {invoice.distributorName}
            </h2>
            {invoice.receiptHeader && (
              <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                {invoice.receiptHeader}
              </p>
            )}
            <p className="text-[10px] text-slate-600 mt-0.5 font-sans">
              {invoice.depotAddress}
            </p>
            <p className="text-[10px] text-slate-700 font-semibold font-sans">
              মোবাইল: {invoice.depotPhone}
            </p>
            <div className="inline-block px-2 py-0.5 mt-1 border border-slate-800 rounded text-[9px] font-bold uppercase tracking-wider">
              ক্যাশ মেমো (Cash Memo)
            </div>
          </div>

          {/* Metadata */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px] font-sans">
            <div className="flex justify-between">
              <span className="text-slate-600">মেমো নং:</span>
              <span className="font-bold text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">তারিখ ও সময়:</span>
              <span>
                {new Date(invoice.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">দোকানের নাম:</span>
              <span className="font-bold text-slate-900">
                {invoice.retailer.shopName}
              </span>
            </div>
            {invoice.retailer.ownerName && (
              <div className="flex justify-between">
                <span className="text-slate-600">মালিক:</span>
                <span>{invoice.retailer.ownerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">মোবাইল:</span>
              <span>{invoice.retailer.phone}</span>
            </div>
            {invoice.retailer.beatName && (
              <div className="flex justify-between">
                <span className="text-slate-600">রুট / বিট:</span>
                <span>{invoice.retailer.beatName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">বিক্রয়কারী:</span>
              <span className="font-semibold">
                {invoice.createdByName} ({invoice.createdByRole})
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700">
                  <th className="py-1">পণ্য</th>
                  <th className="py-1 text-center">পরিমাণ</th>
                  <th className="py-1 text-right">দর</th>
                  <th className="py-1 text-right">টাকা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-[10px]">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1 pr-1 font-medium leading-tight">
                      {item.banglaName || item.productName}
                    </td>
                    <td className="py-1 text-center font-mono">
                      {item.cartonQty > 0 && `${item.cartonQty}C `}
                      {item.pieceQty > 0 && `${item.pieceQty}P`}
                      {item.cartonQty === 0 && item.pieceQty === 0 && `${item.totalPieces}P`}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {item.unitPricePerPiece.toFixed(2)}
                    </td>
                    <td className="py-1 text-right font-bold font-mono">
                      {item.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation & Dues Breakdown */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 font-sans text-[11px]">
            <div className="flex justify-between">
              <span>মোট আইটেম বিল:</span>
              <span className="font-mono">৳ {invoice.subtotal.toFixed(2)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>ছাড় / ডিসকাউন্ট:</span>
                <span className="font-mono">- ৳ {invoice.discount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
              <span>চলতি মেমো বিল:</span>
              <span className="font-mono">৳ {invoice.totalAmount.toFixed(2)}</span>
            </div>

            {invoice.previousDue > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>পূর্বের বাকি জের:</span>
                <span className="font-mono">+ ৳ {invoice.previousDue.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-slate-900 border-t border-slate-300 pt-1 text-xs">
              <span>সর্বমোট দেনা (Grand Total):</span>
              <span className="font-mono">৳ {invoice.grandTotal.toFixed(2)}</span>
            </div>

            {/* Paid breakdown */}
            <div className="border-t border-slate-200 pt-1 space-y-0.5">
              {invoice.cashAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>নগদ (Cash) জমা:</span>
                  <span className="font-mono">৳ {invoice.cashAmount.toFixed(2)}</span>
                </div>
              )}
              {invoice.mfsAmount > 0 && (
                <div className="flex justify-between text-blue-700">
                  <span>{invoice.mfsProvider || "MFS"} জমা:</span>
                  <span className="font-mono">৳ {invoice.mfsAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-emerald-800">
                <span>মোট পরিশোধ:</span>
                <span className="font-mono">৳ {invoice.paidAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Remaining Due */}
            <div className="border-t-2 border-slate-800 pt-1.5 flex justify-between font-black text-xs text-rose-700">
              <span>বর্তমান বকেয়া বাকি:</span>
              <span className="font-mono text-sm">৳ {invoice.dueAmount.toFixed(2)}</span>
            </div>

            {invoice.isOverCreditLimit && (
              <div className="mt-1 p-1 bg-rose-50 border border-rose-200 text-rose-700 text-[9px] font-bold rounded text-center">
                ⚠ সতর্কবার্তা: দোকানের বাকি সীমা (৳{invoice.creditLimit.toLocaleString()}) অতিক্রান্ত!
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[9px] text-slate-500 font-sans space-y-1">
            <p className="font-semibold text-slate-700">
              আমাদের সাথে ব্যবসার জন্য আন্তরিক ধন্যবাদ!
            </p>
            <p className="text-[8px] text-slate-400 font-mono">
              Powered by Distribo FMCG SaaS (distribo.app)
            </p>
          </div>
        </div>

        {/* Global Print Styles to enforce crisp 80mm thermal receipt output */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .thermal-receipt,
            .thermal-receipt * {
              visibility: visible;
            }
            .thermal-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              max-width: 80mm;
              padding: 0;
              margin: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
