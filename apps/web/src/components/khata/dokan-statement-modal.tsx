"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import {
  RetailerStatementResponse,
  getRetailerStatementAction,
} from "@/lib/actions/khata-actions";
import {
  Printer,
  Share2,
  X,
  Store,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Receipt,
  Wallet,
  AlertCircle,
} from "lucide-react";

interface DokanStatementModalProps {
  retailerId: string;
  onClose: () => void;
}

export default function DokanStatementModal({
  retailerId,
  onClose,
}: DokanStatementModalProps) {
  const [statement, setStatement] = useState<RetailerStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getRetailerStatementAction(retailerId);
      if (res.success) {
        setStatement(res);
      } else {
        setError(res.error || "লেজার স্টেটমেন্ট লোড করতে ব্যর্থ হয়েছে।");
      }
      setLoading(false);
    }
    load();
  }, [retailerId]);

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppStatementUrl = () => {
    if (!statement?.retailer || !statement.summary) return "#";
    const { retailer, summary } = statement;
    const cleanPhone = retailer.phone.replace(/[\s\-\+]/g, "").replace(/^88/, "");

    const lines = [
      `*${retailer.shopName} - বাকি খাতা স্টেটমেন্ট*`,
      `তারিখ: ${new Date().toLocaleDateString("bn-BD")}`,
      `মোবাইল: ${retailer.phone}`,
      `------------------------`,
      `প্রারম্ভিক বাকি: ৳${summary.openingBalance.toLocaleString()}`,
      `মোট চালান বিল (${summary.invoicesCount}টি): ৳${summary.totalBilled.toLocaleString()}`,
      `মোট টাকা জমা (${summary.paymentsCount}টি): ৳${summary.totalPaid.toLocaleString()}`,
      `------------------------`,
      `*বর্তমান বকেয়া জের: ৳${summary.currentDue.toLocaleString()}*`,
      `সর্বোচ্চ বাকি সীমা: ৳${retailer.creditLimit.toLocaleString()}`,
      `------------------------`,
      `হিসাব সংক্রান্ত কোনো প্রশ্ন থাকলে যোগাযোগ করুন। ধন্যবাদ!`,
    ].join("\n");

    return `https://wa.me/88${cleanPhone}?text=${encodeURIComponent(lines)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 relative my-8 animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#1C398E]" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                দোকানদার খাতা ও লেনদেন বিবরণী (Ledger Statement)
              </h3>
              <p className="text-[11px] text-slate-500">
                চালান বিল ও টাকা জমার ধারাবাহিক চলমান জের
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statement?.retailer && (
              <>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>

                <a
                  href={getWhatsAppStatementUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>হোয়াটসঅ্যাপ</span>
                </a>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="py-16 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#1C398E] mb-2" />
            <p className="font-semibold">লেজার খাতা প্রস্তুত হচ্ছে...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {statement?.retailer && statement.summary && statement.timeline && (
          <div ref={printRef} className="printable-statement space-y-4">
            {/* Dokan Info Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <h4 className="font-black text-slate-900 text-base leading-tight">
                  {statement.retailer.shopName}
                </h4>
                <p className="text-slate-500 text-xs flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-slate-700">
                    মালিক: {statement.retailer.ownerName || "নাম নেই"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {statement.retailer.phone}
                  </span>
                  {statement.retailer.beatName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {statement.retailer.beatName}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  বর্তমান বকেয়া জের
                </p>
                <p className="text-xl font-black text-rose-700 font-mono">
                  ৳ {statement.summary.currentDue.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  বাকি লিমিট: ৳{statement.retailer.creditLimit.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Summary 4-Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100/70 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  প্রারম্ভিক জের
                </span>
                <span className="font-bold text-slate-800 text-sm font-mono mt-0.5 block">
                  ৳ {statement.summary.openingBalance.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase block">
                  মোট চালান বিল (+)
                </span>
                <span className="font-bold text-blue-900 text-sm font-mono mt-0.5 block">
                  ৳ {statement.summary.totalBilled.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                  মোট জমা (-)
                </span>
                <span className="font-bold text-emerald-900 text-sm font-mono mt-0.5 block">
                  ৳ {statement.summary.totalPaid.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">
                  অবশিষ্ট দেনা
                </span>
                <span className="font-black text-rose-700 text-sm font-mono mt-0.5 block">
                  ৳ {statement.summary.currentDue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Timeline Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 px-3">তারিখ</th>
                    <th className="py-2.5 px-3">বিবরণ ও রেফারেন্স</th>
                    <th className="py-2.5 px-3 text-right text-blue-800">
                      বিল চালান (+)
                    </th>
                    <th className="py-2.5 px-3 text-right text-emerald-800">
                      টাকা জমা (-)
                    </th>
                    <th className="py-2.5 px-3 text-right text-slate-900">
                      বকেয়া জের
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {statement.timeline.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        entry.type === "OPENING_BALANCE"
                          ? "bg-slate-50/50 font-semibold text-slate-600 italic"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                        {new Date(entry.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">
                          {entry.referenceNumber}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {entry.description}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-blue-700">
                        {entry.debit > 0
                          ? `৳ ${entry.debit.toLocaleString()}`
                          : "-"}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                        {entry.credit > 0
                          ? `৳ ${entry.credit.toLocaleString()}`
                          : "-"}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                        ৳ {entry.runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Note */}
            <div className="text-center text-[10px] text-slate-400 font-mono pt-2">
              Distribo FMCG SaaS • Computer Generated Khata Statement
            </div>
          </div>
        )}

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-statement,
            .printable-statement * {
              visibility: visible;
            }
            .printable-statement {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 15mm;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
