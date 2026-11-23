"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import {
  SanitizedKhataRetailer,
  MoneyReceiptVoucher,
} from "@/lib/actions/khata-actions";
import { BeatItem, StaffSROption } from "@/lib/actions/retailer-actions";
import CollectPaymentModal from "@/components/khata/collect-payment-modal";
import MoneyReceiptModal from "@/components/khata/money-receipt-modal";
import DokanStatementModal from "@/components/khata/dokan-statement-modal";
import {
  BookOpen,
  Wallet,
  Search,
  Filter,
  Plus,
  CreditCard,
  Building,
  AlertTriangle,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  FileText,
  UserCheck,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  User,
  Clock,
  Store,
} from "lucide-react";

interface BakiKhataViewProps {
  initialRetailers: SanitizedKhataRetailer[];
  initialMetrics: {
    totalMarketDue: number;
    todayCollected: number;
    totalCreditLimit: number;
    overLimitCount: number;
    retailersWithDueCount: number;
    totalRetailersCount: number;
  };
  role: string;
  beats: BeatItem[];
  staffOptions: StaffSROption[];
}

export default function BakiKhataView({
  initialRetailers,
  initialMetrics,
  role,
  beats,
  staffOptions,
}: BakiKhataViewProps) {
  const { locale } = useI18n();
  const isBn = locale === "bn";

  const isOwnerOrManager = role === "OWNER" || role === "MANAGER";

  // Data states
  const [retailers, setRetailers] =
    useState<SanitizedKhataRetailer[]>(initialRetailers);
  const [metrics, setMetrics] = useState(initialMetrics);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeatId, setSelectedBeatId] = useState("ALL");
  const [selectedSrId, setSelectedSrId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "HAS_DUE" | "OVER_LIMIT" | "CLEARED"
  >("ALL");

  // Modal States
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [targetRetailerIdForPayment, setTargetRetailerIdForPayment] = useState<
    string | undefined
  >(undefined);

  const [activeVoucher, setActiveVoucher] =
    useState<MoneyReceiptVoucher | null>(null);

  const [activeStatementRetailerId, setActiveStatementRetailerId] =
    useState<string | null>(null);

  // Filtered Retailers
  const filteredRetailers = retailers.filter((r) => {
    const matchSearch =
      searchTerm.trim() === "" ||
      r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.phone.includes(searchTerm);

    const matchBeat =
      selectedBeatId === "ALL" ||
      (beats.find((b) => b.id === selectedBeatId)?.name === r.beatName);

    const matchSr =
      selectedSrId === "ALL" ||
      (staffOptions.find((s) => s.id === selectedSrId)?.name === r.assignedSrName);

    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "HAS_DUE" && r.currentDue > 0) ||
      (statusFilter === "OVER_LIMIT" && r.isOverLimit) ||
      (statusFilter === "CLEARED" && r.currentDue <= 0);

    return matchSearch && matchBeat && matchSr && matchStatus;
  });

  // Open collect payment modal for a specific retailer
  const handleOpenCollect = (retailerId?: string) => {
    setTargetRetailerIdForPayment(retailerId);
    setIsCollectModalOpen(true);
  };

  // Payment collection success handler
  const handlePaymentSuccess = (voucher: MoneyReceiptVoucher) => {
    setIsCollectModalOpen(false);
    setActiveVoucher(voucher);

    // Update local state
    setRetailers((prev) =>
      prev.map((r) =>
        r.id === voucher.retailer.id
          ? {
              ...r,
              currentDue: voucher.remainingDue,
              lastPaymentDate: new Date(),
              lastPaymentAmount: voucher.paidAmount,
              isOverLimit:
                r.creditLimit > 0 && voucher.remainingDue > r.creditLimit,
            }
          : r
      )
    );

    setMetrics((prev) => ({
      ...prev,
      totalMarketDue: Math.max(0, prev.totalMarketDue - voucher.paidAmount),
      todayCollected: prev.todayCollected + voucher.paidAmount,
    }));
  };

  return (
    <div className="space-y-5">
      {/* Page Title & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {isBn ? "বাকি খাতা ও বকেয়া আদায়" : "Credit Ledger & Collections"}
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20">
              {role === "SR" ? (isBn ? "এসআর রুট খাতা" : "SR Khata") : (isBn ? "ডিপো বাকি খাতা" : "Depot Khata")}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isBn
              ? "দোকানদারদের বাকির হিসাব, বকেয়া কালেকশন ও মানি রিসিট (MR) ভাউচার"
              : "Market receivables, cash recovery & official Money Receipt vouchers"}
          </p>
        </div>

        {/* Global Collect Button */}
        <div>
          <button
            onClick={() => handleOpenCollect()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Wallet className="w-4 h-4" />
            <span>{isBn ? "+ টাকা জমা গ্রহণ করুন" : "+ Collect Payment"}</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Market Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "মোট মার্কেট বাকি" : "Total Market Due"}
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">
              ৳ {metrics.totalMarketDue.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics.retailersWithDueCount} {isBn ? "টি দোকানে বকেয়া রয়েছে" : "stores with due"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Today's Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "আজকের মোট আদায়" : "Today's Recovery"}
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              ৳ {metrics.todayCollected.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {isBn ? "ক্যাশ ও অনলাইন রিসিভ" : "Cash & MFS recovery"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Approved Credit Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "অনুমোদিত বাকি সীমা" : "Total Credit Limit"}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              ৳ {metrics.totalCreditLimit.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {isBn ? "নির্ধারিত ক্রেডিট ক্যাপ" : "Authorized exposure"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1C398E] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Over-limit High Risk Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "লিমিট অতিক্রান্ত দোকান" : "Over-Limit Stores"}
            </p>
            <h3
              className={`text-2xl font-black mt-1 ${
                metrics.overLimitCount > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {metrics.overLimitCount} {isBn ? "টি" : "shops"}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics.overLimitCount > 0
                ? isBn
                  ? "আদায় জরুরি (High Risk)"
                  : "Urgent recovery"
                : isBn
                  ? "সব দোকান সীমার মধ্যে"
                  : "All within limits"}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              metrics.overLimitCount > 0
                ? "bg-amber-50 text-amber-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isBn
                ? "দোকানের নাম, মালিক বা মোবাইল দিয়ে খুঁজুন..."
                : "Search by shop name, owner or phone..."
            }
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Beat Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedBeatId}
              onChange={(e) => setSelectedBeatId(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">{isBn ? "সকল রুট (All Routes)" : "All Routes"}</option>
              {beats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* SR Filter (Visible for Owner/Manager) */}
          {isOwnerOrManager && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedSrId}
                onChange={(e) => setSelectedSrId(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none"
              >
                <option value="ALL">{isBn ? "সকল এসআর (All SRs)" : "All SRs"}</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.distributorRole})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">{isBn ? "সকল দোকান" : "All Stores"}</option>
              <option value="HAS_DUE">{isBn ? "শুধুমাত্র বাকি রয়েছে" : "With Due Only"}</option>
              <option value="OVER_LIMIT">{isBn ? "লিমিট পার হওয়া দোকান" : "Over Credit Limit"}</option>
              <option value="CLEARED">{isBn ? "পরিশোধিত / বাকি নেই" : "Cleared Balance"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Retailers Khata Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">{isBn ? "দোকান ও মোবাইল" : "Store & Contact"}</th>
                <th className="py-3.5 px-4">{isBn ? "রুট ও এসআর" : "Route & SR"}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? "বাকি লিমিট" : "Credit Limit"}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? "বর্তমান বাকি" : "Current Due"}</th>
                <th className="py-3.5 px-4 text-center">{isBn ? "সর্বশেষ জমা" : "Last Payment"}</th>
                <th className="py-3.5 px-4 text-right">{isBn ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRetailers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">
                      {isBn ? "কোনো দোকানের বাকি রেকর্ড পাওয়া যায়নি" : "No credit records found"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isBn
                        ? "ফিল্টার পরিবর্তন করুন অথবা নতুন দোকানদার যুক্ত করুন"
                        : "Adjust filter criteria to view more records"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRetailers.map((r) => {
                  const isOverLimit = r.creditLimit > 0 && r.currentDue > r.creditLimit;
                  const hasDue = r.currentDue > 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Shop Name & Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#1C398E]/10 text-[#1C398E] font-bold flex items-center justify-center shrink-0">
                            {r.shopName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">
                              {r.shopName}
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{r.phone}</span>
                              {r.ownerName && <span>• {r.ownerName}</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Beat & SR */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{r.beatName || (isBn ? "অনির্ধারিত রুট" : "No beat")}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {r.assignedSrName ? `SR: ${r.assignedSrName}` : (isBn ? "ওনার সরাসরি" : "Direct")}
                        </p>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 font-mono">
                        ৳ {r.creditLimit.toLocaleString()}
                      </td>

                      {/* Current Due */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-black font-mono text-sm ${
                            isOverLimit
                              ? "text-rose-600"
                              : hasDue
                                ? "text-amber-700"
                                : "text-emerald-600"
                          }`}
                        >
                          ৳ {r.currentDue.toLocaleString()}
                        </span>
                        {isOverLimit && (
                          <span className="block text-[10px] font-bold text-rose-500 mt-0.5">
                            ⚠ {isBn ? "লিমিট পার" : "Over Limit"}
                          </span>
                        )}
                        {!hasDue && (
                          <span className="block text-[10px] font-semibold text-emerald-600 mt-0.5">
                            ✓ {isBn ? "পরিশোধিত" : "Cleared"}
                          </span>
                        )}
                      </td>

                      {/* Last Payment Info */}
                      <td className="py-3.5 px-4 text-center">
                        {r.lastPaymentDate ? (
                          <div>
                            <span className="font-bold text-emerald-700 font-mono text-[11px]">
                              ৳ {r.lastPaymentAmount?.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                              {new Date(r.lastPaymentDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {isBn ? "কোনো জমা নেই" : "No payment"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Collect Payment Button */}
                          <button
                            onClick={() => handleOpenCollect(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all"
                            title="টাকা জমা নিন"
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>{isBn ? "জমা নিন" : "Collect"}</span>
                          </button>

                          {/* View Statement Button */}
                          <button
                            onClick={() => setActiveStatementRetailerId(r.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#1C398E] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all"
                            title="দোকানের বিস্তারিত লেজার দেখুন"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isBn ? "স্টেটমেন্ট" : "Statement"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {isCollectModalOpen && (
        <CollectPaymentModal
          retailers={retailers}
          initialRetailerId={targetRetailerIdForPayment}
          onClose={() => setIsCollectModalOpen(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Money Receipt (MR) Voucher Modal */}
      {activeVoucher && (
        <MoneyReceiptModal
          voucher={activeVoucher}
          onClose={() => setActiveVoucher(null)}
          onNewCollection={() => {
            setActiveVoucher(null);
            handleOpenCollect();
          }}
        />
      )}

      {/* Dokan Ledger Statement Modal */}
      {activeStatementRetailerId && (
        <DokanStatementModal
          retailerId={activeStatementRetailerId}
          onClose={() => setActiveStatementRetailerId(null)}
        />
      )}
    </div>
  );
}
