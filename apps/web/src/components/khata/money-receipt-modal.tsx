"use client";

import { useRef } from "react";
import { MoneyReceiptVoucher } from "@/lib/actions/khata-actions";
import {
  Printer,
  Share2,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  Phone,
  RotateCcw,
} from "lucide-react";

interface MoneyReceiptModalProps {
  voucher: MoneyReceiptVoucher;
  onClose: () => void;
  onNewCollection?: () => void;
}

export default function MoneyReceiptModal({
  voucher,
  onClose,
  onNewCollection,
}: MoneyReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppShareUrl = () => {
    const cleanPhone = voucher.retailer.phone
      .replace(/[\s\-\+]/g, "")
      .replace(/^88/, "");

    const dateStr = new Date(voucher.createdAt).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const lines = [
      `*${voucher.distributorName}*`,
      `টাকা জমার রশিদ (Money Receipt)`,
      `রশিদ নং: ${voucher.mrNumber}`,
      `তারিখ: ${dateStr}`,
      `দোকান: ${voucher.retailer.shopName}`,
      `------------------------`,
      `আদায়কৃত টাকা: ৳${voucher.amount.toLocaleString()} (${voucher.paymentMethod})`,
      voucher.notes ? `নোট/রেফারেন্স: ${voucher.notes}` : "",
      `পূর্বের বাকি ছিল: ৳${voucher.previousDue.toLocaleString()}`,
      `*বর্তমান বকেয়া জের: ৳${voucher.remainingDue.toLocaleString()}*`,
      `আদায়কারী: ${voucher.collectorName}`,
      `------------------------`,
      `ধন্যবাদ!`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(lines)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 relative my-auto animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">
              টাকা জমা সফল হয়েছে
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons (Print, WhatsApp) (Hidden when printing) */}
        <div className="grid grid-cols-2 gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1C398E] text-white text-xs font-bold hover:bg-[#162d70] shadow-sm shadow-[#1C398E]/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট ভাউচার</span>
          </button>

          <a
            href={getWhatsAppShareUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>হোয়াটসঅ্যাপ</span>
          </a>
        </div>

        {/* 80mm / 3-Inch Standard Thermal Money Receipt Content */}
        <div
          ref={printRef}
          className="thermal-mr bg-white text-slate-900 font-mono text-[11px] leading-tight p-2 sm:p-3 border border-slate-200 rounded-xl print:border-none print:p-0 print:text-[10pt]"
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400">
            <h2 className="text-sm font-black tracking-tight text-slate-900 font-sans">
              {voucher.distributorName}
            </h2>
            {voucher.receiptHeader && (
              <p className="text-[10px] text-slate-600 font-sans mt-0.5">
                {voucher.receiptHeader}
              </p>
            )}
            <p className="text-[9px] text-slate-600 mt-0.5 font-sans">
              {voucher.depotAddress}
            </p>
            <p className="text-[9px] text-slate-700 font-semibold font-sans">
              ফোন: {voucher.depotPhone}
            </p>
            <div className="inline-block px-2 py-0.5 mt-1 border border-slate-800 rounded text-[9px] font-bold uppercase tracking-wider">
              টাকা জমার রশিদ (Money Receipt)
            </div>
          </div>

          {/* Details */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px] font-sans">
            <div className="flex justify-between">
              <span className="text-slate-600">রশিদ নং:</span>
              <span className="font-bold text-slate-900 font-mono">
                {voucher.mrNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">তারিখ ও সময়:</span>
              <span>
                {new Date(voucher.createdAt).toLocaleString("en-GB", {
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
                {voucher.retailer.shopName}
              </span>
            </div>
            {voucher.retailer.ownerName && (
              <div className="flex justify-between">
                <span className="text-slate-600">মালিক:</span>
                <span>{voucher.retailer.ownerName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">মোবাইল:</span>
              <span>{voucher.retailer.phone}</span>
            </div>
            {voucher.retailer.beatName && (
              <div className="flex justify-between">
                <span className="text-slate-600">রুট / বিট:</span>
                <span>{voucher.retailer.beatName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">আদায়কারী:</span>
              <span className="font-semibold">
                {voucher.collectorName} ({voucher.collectorRole})
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="py-3 border-b border-dashed border-slate-400 text-center bg-slate-50/70 my-1 rounded-lg">
            <p className="text-[10px] uppercase font-bold text-slate-500">
              জমার পরিমাণ ({voucher.paymentMethod})
            </p>
            <p className="text-xl font-black text-emerald-700 font-mono mt-0.5">
              ৳ {voucher.amount.toLocaleString()}
            </p>
            {voucher.notes && (
              <p className="text-[10px] text-slate-600 mt-0.5 font-sans">
                নোট: {voucher.notes}
              </p>
            )}
          </div>

          {/* Dues Status */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-1 font-sans text-[10px]">
            <div className="flex justify-between text-slate-600">
              <span>পূর্বে মোট বাকি ছিল:</span>
              <span className="font-mono">৳ {voucher.previousDue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>আজকের জমা:</span>
              <span className="font-mono">- ৳ {voucher.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1 text-xs">
              <span>বর্তমান বকেয়া জের:</span>
              <span className="font-mono text-sm text-rose-700">
                ৳ {voucher.remainingDue.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-2 text-[9px] text-slate-500 font-sans space-y-0.5">
            <p className="font-semibold text-slate-700">টাকা বুঝে পেলাম</p>
            <p className="text-[8px] text-slate-400 font-mono">
              Distribo FMCG SaaS (distribo.app)
            </p>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .thermal-mr,
            .thermal-mr * {
              visibility: visible;
            }
            .thermal-mr {
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
