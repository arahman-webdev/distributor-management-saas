"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import {
  SanitizedRetailer,
  BeatItem,
  StaffSROption,
  createRetailerAction,
  updateRetailerAction,
  toggleRetailerStatusAction,
  createBeatAction,
  updateBeatAction,
} from "@/lib/actions/retailer-actions";
import {
  Store,
  MapPin,
  Phone,
  UserCheck,
  Search,
  Filter,
  Plus,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Calendar,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  User,
  Compass,
} from "lucide-react";
import { isValidBdPhone } from "@/lib/calculations";

interface RetailerDirectoryViewProps {
  initialRetailers: SanitizedRetailer[];
  initialBeats: BeatItem[];
  staffOptions: StaffSROption[];
  role: string;
  metrics: {
    totalRetailers: number;
    activeRetailers: number;
    totalMarketDue: number;
    totalCreditLimit: number;
    creditUtilization: number;
  };
}

const DAYS_OF_WEEK = [
  "শনিবার (Saturday)",
  "রবিবার (Sunday)",
  "সোমবার (Monday)",
  "মঙ্গলবার (Tuesday)",
  "বুধবার (Wednesday)",
  "বৃহস্পতিবার (Thursday)",
  "শুক্রবার (Friday)",
];

export default function RetailerDirectoryView({
  initialRetailers,
  initialBeats,
  staffOptions,
  role,
  metrics: initialMetrics,
}: RetailerDirectoryViewProps) {
  const { locale } = useI18n();
  const isBn = locale === "bn";
  const [isPending, startTransition] = useTransition();

  const isOwnerOrManager = role === "OWNER" || role === "MANAGER";

  // Data states
  const [retailers, setRetailers] = useState<SanitizedRetailer[]>(initialRetailers);
  const [beats, setBeats] = useState<BeatItem[]>(initialBeats);
  const [metrics, setMetrics] = useState(initialMetrics);

  // Active Tab: 'retailers' | 'beats'
  const [activeTab, setActiveTab] = useState<"retailers" | "beats">("retailers");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeatId, setSelectedBeatId] = useState("ALL");
  const [selectedSrId, setSelectedSrId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Notification banners
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Retailer Modal State
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState<SanitizedRetailer | null>(null);
  const [retailerForm, setRetailerForm] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    address: "",
    beatId: "",
    assignedSrId: "",
    creditLimit: "0",
    openingBalance: "0",
  });

  // Beat Modal State
  const [isBeatModalOpen, setIsBeatModalOpen] = useState(false);
  const [editingBeat, setEditingBeat] = useState<BeatItem | null>(null);
  const [beatForm, setBeatForm] = useState({
    name: "",
    dayOfWeek: "",
    description: "",
    assignedSrId: "",
  });

  // Helper to open create retailer modal
  const openCreateRetailerModal = () => {
    setEditingRetailer(null);
    setRetailerForm({
      shopName: "",
      ownerName: "",
      phone: "",
      address: "",
      beatId: beats[0]?.id || "",
      assignedSrId: "",
      creditLimit: "5000",
      openingBalance: "0",
    });
    setErrorMsg(null);
    setIsRetailerModalOpen(true);
  };

  // Helper to open edit retailer modal
  const openEditRetailerModal = (ret: SanitizedRetailer) => {
    setEditingRetailer(ret);
    setRetailerForm({
      shopName: ret.shopName,
      ownerName: ret.ownerName || "",
      phone: ret.phone,
      address: ret.address || "",
      beatId: ret.beat?.id || "",
      assignedSrId: ret.assignedSr?.id || "",
      creditLimit: String(ret.creditLimit),
      openingBalance: String(ret.openingBalance),
    });
    setErrorMsg(null);
    setIsRetailerModalOpen(true);
  };

  // Helper to open create beat modal
  const openCreateBeatModal = () => {
    setEditingBeat(null);
    setBeatForm({
      name: "",
      dayOfWeek: "রবিবার (Sunday)",
      description: "",
      assignedSrId: "",
    });
    setErrorMsg(null);
    setIsBeatModalOpen(true);
  };

  // Helper to open edit beat modal
  const openEditBeatModal = (beat: BeatItem) => {
    setEditingBeat(beat);
    setBeatForm({
      name: beat.name,
      dayOfWeek: beat.dayOfWeek || "রবিবার (Sunday)",
      description: beat.description || "",
      assignedSrId: beat.assignedSrId || "",
    });
    setErrorMsg(null);
    setIsBeatModalOpen(true);
  };

  // Filter retailers based on search, beat, SR and status
  const filteredRetailers = retailers.filter((r) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      r.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.phone.includes(searchTerm);

    const matchesBeat =
      selectedBeatId === "ALL" || (r.beat && r.beat.id === selectedBeatId);

    const matchesSr =
      selectedSrId === "ALL" ||
      (r.assignedSr && r.assignedSr.id === selectedSrId) ||
      (r.beat && beats.find((b) => b.id === r.beat?.id)?.assignedSrId === selectedSrId);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && r.isActive) ||
      (statusFilter === "INACTIVE" && !r.isActive);

    return matchesSearch && matchesBeat && matchesSr && matchesStatus;
  });

  // Handle Save Retailer (Create / Update)
  const handleSaveRetailer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!retailerForm.shopName.trim()) {
      setErrorMsg(isBn ? "দোকানের নাম আবশ্যক।" : "Shop name is required.");
      return;
    }

    if (!isValidBdPhone(retailerForm.phone)) {
      setErrorMsg(
        isBn
          ? "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।"
          : "Please enter a valid 11-digit Bangladeshi mobile number."
      );
      return;
    }

    startTransition(async () => {
      if (editingRetailer) {
        const res = await updateRetailerAction(editingRetailer.id, {
          shopName: retailerForm.shopName,
          ownerName: retailerForm.ownerName || undefined,
          phone: retailerForm.phone,
          address: retailerForm.address || undefined,
          beatId: retailerForm.beatId || null,
          assignedSrId: retailerForm.assignedSrId || null,
          creditLimit: parseFloat(retailerForm.creditLimit) || 0,
        });

        if (res.success) {
          const selectedBeat = beats.find((b) => b.id === retailerForm.beatId);
          const selectedStaff = staffOptions.find((s) => s.id === retailerForm.assignedSrId);

          setRetailers((prev) =>
            prev.map((r) =>
              r.id === editingRetailer.id
                ? {
                    ...r,
                    shopName: retailerForm.shopName.trim(),
                    ownerName: retailerForm.ownerName.trim() || null,
                    phone: retailerForm.phone.trim(),
                    address: retailerForm.address.trim() || null,
                    creditLimit: parseFloat(retailerForm.creditLimit) || 0,
                    beat: selectedBeat
                      ? { id: selectedBeat.id, name: selectedBeat.name, dayOfWeek: selectedBeat.dayOfWeek }
                      : null,
                    assignedSr: selectedStaff
                      ? { id: selectedStaff.id, name: selectedStaff.name, phone: selectedStaff.phone }
                      : null,
                  }
                : r
            )
          );
          setSuccessMsg(
            isBn
              ? `"${retailerForm.shopName}" দোকানের তথ্য সফলভাবে আপডেট হয়েছে!`
              : `Retailer "${retailerForm.shopName}" updated successfully!`
          );
          setIsRetailerModalOpen(false);
        } else {
          setErrorMsg(res.error || "আপডেট ব্যর্থ হয়েছে।");
        }
      } else {
        const res = await createRetailerAction({
          shopName: retailerForm.shopName,
          ownerName: retailerForm.ownerName || undefined,
          phone: retailerForm.phone,
          address: retailerForm.address || undefined,
          beatId: retailerForm.beatId || null,
          assignedSrId: retailerForm.assignedSrId || null,
          creditLimit: parseFloat(retailerForm.creditLimit) || 0,
          openingBalance: parseFloat(retailerForm.openingBalance) || 0,
        });

        if (res.success && res.retailerId) {
          const selectedBeat = beats.find((b) => b.id === retailerForm.beatId);
          const selectedStaff = staffOptions.find((s) => s.id === retailerForm.assignedSrId);
          const newDue = parseFloat(retailerForm.openingBalance) || 0;
          const newLimit = parseFloat(retailerForm.creditLimit) || 0;

          const newRetailerItem: SanitizedRetailer = {
            id: res.retailerId,
            distributorId: "",
            shopName: retailerForm.shopName.trim(),
            ownerName: retailerForm.ownerName.trim() || null,
            phone: retailerForm.phone.trim(),
            address: retailerForm.address.trim() || null,
            creditLimit: newLimit,
            openingBalance: newDue,
            currentDue: newDue,
            isActive: true,
            creditUtilization: newLimit > 0 ? (newDue / newLimit) * 100 : 0,
            beat: selectedBeat
              ? { id: selectedBeat.id, name: selectedBeat.name, dayOfWeek: selectedBeat.dayOfWeek }
              : null,
            assignedSr: selectedStaff
              ? { id: selectedStaff.id, name: selectedStaff.name, phone: selectedStaff.phone }
              : null,
            invoicesCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          setRetailers((prev) => [newRetailerItem, ...prev]);
          setMetrics((prev) => ({
            ...prev,
            totalRetailers: prev.totalRetailers + 1,
            activeRetailers: prev.activeRetailers + 1,
            totalMarketDue: prev.totalMarketDue + newDue,
            totalCreditLimit: prev.totalCreditLimit + newLimit,
          }));

          setSuccessMsg(
            isBn
              ? `"${retailerForm.shopName}" নতুন দোকানদার সফলভাবে যুক্ত হয়েছে!`
              : `Retailer "${retailerForm.shopName}" registered successfully!`
          );
          setIsRetailerModalOpen(false);
        } else {
          setErrorMsg(res.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
        }
      }
    });
  };

  // Handle Toggle Active/Inactive
  const handleToggleStatus = (id: string, currentStatus: boolean, shopName: string) => {
    if (!isOwnerOrManager) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await toggleRetailerStatusAction(id);
      if (res.success) {
        setRetailers((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: !currentStatus } : r))
        );
        setMetrics((prev) => ({
          ...prev,
          activeRetailers: currentStatus
            ? prev.activeRetailers - 1
            : prev.activeRetailers + 1,
        }));
        setSuccessMsg(
          isBn
            ? `"${shopName}" ${!currentStatus ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে।`
            : `"${shopName}" marked as ${!currentStatus ? "active" : "inactive"}.`
        );
      } else {
        setErrorMsg(res.error || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।");
      }
    });
  };

  // Handle Save Beat (Create / Update)
  const handleSaveBeat = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!beatForm.name.trim()) {
      setErrorMsg(isBn ? "রুটের নাম আবশ্যক।" : "Route/Beat name is required.");
      return;
    }

    startTransition(async () => {
      if (editingBeat) {
        const res = await updateBeatAction(editingBeat.id, {
          name: beatForm.name,
          dayOfWeek: beatForm.dayOfWeek || undefined,
          description: beatForm.description || undefined,
          assignedSrId: beatForm.assignedSrId || null,
        });

        if (res.success) {
          const selectedStaff = staffOptions.find((s) => s.id === beatForm.assignedSrId);
          setBeats((prev) =>
            prev.map((b) =>
              b.id === editingBeat.id
                ? {
                    ...b,
                    name: beatForm.name.trim(),
                    dayOfWeek: beatForm.dayOfWeek.trim() || null,
                    description: beatForm.description.trim() || null,
                    assignedSrId: beatForm.assignedSrId || null,
                    assignedSr: selectedStaff
                      ? { id: selectedStaff.id, name: selectedStaff.name, phone: selectedStaff.phone }
                      : null,
                  }
                : b
            )
          );
          setSuccessMsg(
            isBn
              ? `"${beatForm.name}" রুট সফলভাবে আপডেট হয়েছে!`
              : `Beat "${beatForm.name}" updated successfully!`
          );
          setIsBeatModalOpen(false);
        } else {
          setErrorMsg(res.error || "রুট আপডেট ব্যর্থ হয়েছে।");
        }
      } else {
        const res = await createBeatAction({
          name: beatForm.name,
          dayOfWeek: beatForm.dayOfWeek || undefined,
          description: beatForm.description || undefined,
          assignedSrId: beatForm.assignedSrId || null,
        });

        if (res.success && res.beatId) {
          const selectedStaff = staffOptions.find((s) => s.id === beatForm.assignedSrId);
          const newBeatItem: BeatItem = {
            id: res.beatId,
            name: beatForm.name.trim(),
            dayOfWeek: beatForm.dayOfWeek.trim() || null,
            description: beatForm.description.trim() || null,
            assignedSrId: beatForm.assignedSrId || null,
            assignedSr: selectedStaff
              ? { id: selectedStaff.id, name: selectedStaff.name, phone: selectedStaff.phone }
              : null,
            retailersCount: 0,
            totalDue: 0,
            createdAt: new Date(),
          };

          setBeats((prev) => [...prev, newBeatItem]);
          setSuccessMsg(
            isBn
              ? `"${beatForm.name}" নতুন রুট সফলভাবে তৈরি হয়েছে!`
              : `New route "${beatForm.name}" created successfully!`
          );
          setIsBeatModalOpen(false);
        } else {
          setErrorMsg(res.error || "রুট সংরক্ষণ ব্যর্থ হয়েছে।");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-500 hover:text-emerald-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {isBn ? "দোকানদার ডিরেক্টরি ও ডেলিভারি রুট" : "Retailer Directory & Delivery Routes"}
            </h1>
            <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20">
              {role === "SR" ? (isBn ? "ফিল্ড এসআর মোড" : "Field SR Mode") : (isBn ? "ওনার ভিউ" : "Distributor View")}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {role === "SR"
              ? isBn
                ? "আপনার জন্য নির্ধারিত রুট ও দোকানসমূহের তালিকা এবং বকেয়া তথ্য"
                : "Your assigned delivery routes, retailers and credit balance"
              : isBn
                ? "ডিপোর সকল মুদির দোকান, বাকি লিমিট ও সেলসম্যান (SR) অ্যাসাইনমেন্ট"
                : "All retail stores, credit limits and delivery beat schedules"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {isOwnerOrManager && (
            <>
              <button
                onClick={openCreateBeatModal}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-xs transition-all"
              >
                <Compass className="w-4 h-4 text-[#1C398E]" />
                <span>{isBn ? "+ নতুন রুট / বিট" : "+ Add Route"}</span>
              </button>

              <button
                onClick={openCreateRetailerModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1C398E] rounded-xl hover:bg-[#162d70] shadow-sm shadow-[#1C398E]/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? "+ নতুন দোকানদার যুক্ত করুন" : "+ Add Retailer"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top KPI Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Stores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "মোট দোকান সংখ্যা" : "Total Retailers"}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalRetailers}
            </h3>
            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
              {metrics.activeRetailers} {isBn ? "টি দোকান সক্রিয়" : "active stores"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1C398E] flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Market Baki */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "মোট মার্কেট বাকি" : "Total Market Due"}
            </p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">
              ৳ {metrics.totalMarketDue.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {isBn ? "মার্কেটে বকেয়া টাকা" : "Current outstanding"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Total Credit Limit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "অনুমোদিত বাকি সীমা" : "Total Credit Limit"}
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ৳ {metrics.totalCreditLimit.toLocaleString()}
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {isBn ? "সর্বোচ্চ দেনার ক্যাপ" : "Max credit exposure"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Credit Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isBn ? "বাকি লিমিট ব্যবহার" : "Credit Utilization"}
            </p>
            <h3
              className={`text-2xl font-black mt-1 ${
                metrics.creditUtilization > 90
                  ? "text-rose-600"
                  : metrics.creditUtilization > 70
                    ? "text-amber-600"
                    : "text-emerald-600"
              }`}
            >
              {metrics.creditUtilization}%
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {metrics.creditUtilization > 90
                ? isBn
                  ? "উচ্চ ঝুঁকিপূর্ণ সীমা"
                  : "High exposure alert"
                : isBn
                  ? "স্বাভাবিক সীমার মধ্যে"
                  : "Within healthy bounds"}
            </p>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              metrics.creditUtilization > 90
                ? "bg-rose-50 text-rose-600"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("retailers")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "retailers"
              ? "bg-[#1C398E] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Store className="w-4 h-4" />
          <span>{isBn ? "দোকানদার তালিকা" : "Retailers Directory"}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-md ${
              activeTab === "retailers"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {filteredRetailers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("beats")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "beats"
              ? "bg-[#1C398E] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{isBn ? "রুট ও বিট শিডিউল" : "Routes & Beats"}</span>
          <span
            className={`px-1.5 py-0.5 text-[10px] rounded-md ${
              activeTab === "beats"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {beats.length}
          </span>
        </button>
      </div>

      {/* TAB 1: RETAILERS DIRECTORY */}
      {activeTab === "retailers" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  isBn
                    ? "দোকানের নাম, মালিকের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                    : "Search by shop name, owner name or phone..."
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
              {/* Route Filter */}
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
                  <option value="ALL">{isBn ? "সকল অবস্থা (All)" : "All Status"}</option>
                  <option value="ACTIVE">{isBn ? "শুধুমাত্র সক্রিয়" : "Active Only"}</option>
                  <option value="INACTIVE">{isBn ? "শুধুমাত্র নিষ্ক্রিয়" : "Inactive Only"}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Retailers Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">{isBn ? "দোকান ও মালিক" : "Store & Owner"}</th>
                    <th className="py-3.5 px-4">{isBn ? "মোবাইল ও ঠিকানা" : "Contact & Area"}</th>
                    <th className="py-3.5 px-4">{isBn ? "ডেলিভারি রুট" : "Route / Beat"}</th>
                    <th className="py-3.5 px-4">{isBn ? "এসআর অ্যাসাইন" : "Assigned SR"}</th>
                    <th className="py-3.5 px-4 text-right">{isBn ? "বাকি লিমিট" : "Credit Limit"}</th>
                    <th className="py-3.5 px-4 text-right">{isBn ? "বর্তমান বকেয়া" : "Current Due"}</th>
                    <th className="py-3.5 px-4 text-center">{isBn ? "অবস্থা" : "Status"}</th>
                    {isOwnerOrManager && (
                      <th className="py-3.5 px-4 text-center">{isBn ? "অ্যাকশন" : "Action"}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRetailers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isOwnerOrManager ? 8 : 7}
                        className="py-12 text-center text-slate-400"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Store className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600">
                            {isBn ? "কোনো দোকান পাওয়া যায়নি" : "No retailers found"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isBn
                              ? "ফিল্টার পরিবর্তন করুন অথবা নতুন দোকানদার যুক্ত করুন"
                              : "Adjust your filter criteria or register a new store"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRetailers.map((r) => {
                      const isOverLimit = r.creditLimit > 0 && r.currentDue > r.creditLimit;
                      const isNearLimit =
                        r.creditLimit > 0 &&
                        r.currentDue > r.creditLimit * 0.8 &&
                        !isOverLimit;

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            !r.isActive ? "opacity-60 bg-slate-50/40" : ""
                          }`}
                        >
                          {/* Store Name & Owner */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#1C398E]/10 text-[#1C398E] font-bold flex items-center justify-center shrink-0">
                                {r.shopName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">
                                  {r.shopName}
                                </p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{r.ownerName || (isBn ? "নাম উল্লেখ নেই" : "N/A")}</span>
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Mobile & Address */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#1C398E]" />
                              <span>{r.phone}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                              {r.address || (isBn ? "ঠিকানা যোগ করা হয়নি" : "No address")}
                            </p>
                          </td>

                          {/* Beat */}
                          <td className="py-3.5 px-4">
                            {r.beat ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                <MapPin className="w-3 h-3 text-slate-500" />
                                {r.beat.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                {isBn ? "রুট বরাদ্দ নেই" : "Unassigned"}
                              </span>
                            )}
                          </td>

                          {/* Assigned SR */}
                          <td className="py-3.5 px-4">
                            {r.assignedSr ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1C398E] font-semibold text-[11px] border border-blue-100">
                                <UserCheck className="w-3 h-3" />
                                {r.assignedSr.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                {isBn ? "সরাসরি ওনার অধীন" : "Direct / Beat Default"}
                              </span>
                            )}
                          </td>

                          {/* Credit Limit */}
                          <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                            ৳ {r.creditLimit.toLocaleString()}
                          </td>

                          {/* Current Due */}
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`font-bold ${
                                isOverLimit
                                  ? "text-rose-600"
                                  : isNearLimit
                                    ? "text-amber-600"
                                    : r.currentDue > 0
                                      ? "text-slate-900"
                                      : "text-emerald-600"
                              }`}
                            >
                              ৳ {r.currentDue.toLocaleString()}
                            </span>
                            {isOverLimit && (
                              <p className="text-[10px] font-bold text-rose-500 flex items-center justify-end gap-0.5 mt-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>{isBn ? "লিমিট অতিক্রান্ত" : "Over Limit"}</span>
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            {isOwnerOrManager ? (
                              <button
                                onClick={() => handleToggleStatus(r.id, r.isActive, r.shopName)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                  r.isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200"
                                }`}
                                title={
                                  isBn
                                    ? "স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                                    : "Click to toggle status"
                                }
                              >
                                {r.isActive
                                  ? isBn
                                    ? "সক্রিয়"
                                    : "Active"
                                  : isBn
                                    ? "নিষ্ক্রিয়"
                                    : "Inactive"}
                              </button>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.isActive
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {r.isActive ? "Active" : "Inactive"}
                              </span>
                            )}
                          </td>

                          {/* Action (Edit) */}
                          {isOwnerOrManager && (
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => openEditRetailerModal(r)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-[#1C398E] hover:bg-blue-50 transition-colors"
                                title={isBn ? "দোকানদার এডিট করুন" : "Edit retailer"}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROUTES & BEATS */}
      {activeTab === "beats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beats.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
                <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800">
                  {isBn ? "কোনো ডেলিভারি রুট তৈরি করা হয়নি" : "No delivery routes configured"}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {isBn
                    ? "আপনার ডিপোর ফিল্ড এরিয়া অনুযায়ী রুট ও ডেলিভারি দিন নির্ধারণ করুন।"
                    : "Configure daily delivery beats and assign sales reps for streamlined dispatch."}
                </p>
                {isOwnerOrManager && (
                  <button
                    onClick={openCreateBeatModal}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#1C398E] rounded-xl hover:bg-[#162d70]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isBn ? "প্রথম রুট যুক্ত করুন" : "Add First Route"}</span>
                  </button>
                )}
              </div>
            ) : (
              beats.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-blue-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1C398E] flex items-center justify-center font-bold">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{b.dayOfWeek || (isBn ? "দিন নির্ধারিত নেই" : "Flexible Day")}</span>
                          </p>
                        </div>
                      </div>

                      {isOwnerOrManager && (
                        <button
                          onClick={() => openEditBeatModal(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#1C398E] hover:bg-slate-50"
                          title="Edit Route"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {b.description && (
                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {b.description}
                      </p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{isBn ? "দায়িত্বপ্রাপ্ত এসআর:" : "Assigned SR:"}</span>
                        {b.assignedSr ? (
                          <span className="font-bold text-[#1C398E] flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {b.assignedSr.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            {isBn ? "এসআর অ্যাসাইন নেই" : "Unassigned"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{isBn ? "মোট মুদির দোকান:" : "Retailer Count:"}</span>
                        <span className="font-bold text-slate-800">
                          {b.retailersCount} {isBn ? "টি" : "stores"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{isBn ? "রুটের মোট বকেয়া:" : "Beat Market Due:"}</span>
                        <span className="font-bold text-amber-600">
                          ৳ {b.totalDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setSelectedBeatId(b.id);
                        setActiveTab("retailers");
                      }}
                      className="text-xs font-bold text-[#1C398E] hover:underline flex items-center gap-1"
                    >
                      <span>{isBn ? "দোকানদারগুলো দেখুন →" : "View Retailers →"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT RETAILER */}
      {isRetailerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsRetailerModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#1C398E]/10 text-[#1C398E] flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRetailer
                    ? isBn
                      ? "দোকানদার তথ্য সম্পাদনা"
                      : "Edit Retailer"
                    : isBn
                      ? "নতুন দোকানদার যুক্ত করুন"
                      : "Register New Retailer"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? "দোকানের নাম, মোবাইল নম্বর ও বাকি লিমিট নির্ধারণ করুন"
                    : "Fill in shop details, mobile number and credit limit"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRetailer} className="space-y-4">
              {/* Shop Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "দোকানের নাম *" : "Shop Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={retailerForm.shopName}
                  onChange={(e) =>
                    setRetailerForm({ ...retailerForm, shopName: e.target.value })
                  }
                  placeholder={isBn ? "যেমন: মেসার্স রহিম স্টোর" : "e.g. Rahim General Store"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
                />
              </div>

              {/* Owner Name & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "মালিকের নাম" : "Owner Name"}
                  </label>
                  <input
                    type="text"
                    value={retailerForm.ownerName}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, ownerName: e.target.value })
                    }
                    placeholder={isBn ? "যেমন: মোঃ আব্দুর রহিম" : "e.g. Md. Abdur Rahim"}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "মোবাইল নম্বর (১১ ডিজিট) *" : "Mobile Phone (11 Digits) *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={retailerForm.phone}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, phone: e.target.value })
                    }
                    placeholder="01712345678"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "দোকানের ঠিকানা / বাজার" : "Store Address / Market"}
                </label>
                <input
                  type="text"
                  value={retailerForm.address}
                  onChange={(e) =>
                    setRetailerForm({ ...retailerForm, address: e.target.value })
                  }
                  placeholder={isBn ? "যেমন: মেইন রোড, রামপুরা বাজার" : "e.g. Main Road, Rampura"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
                />
              </div>

              {/* Route & Assigned SR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "ডেলিভারি রুট / বিট" : "Route / Beat"}
                  </label>
                  <select
                    value={retailerForm.beatId}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, beatId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white font-medium"
                  >
                    <option value="">{isBn ? "-- কোনো রুট নেই --" : "-- None --"}</option>
                    {beats.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.dayOfWeek || "Flexible"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "নির্দিষ্ট এসআর (SR)" : "Specific SR"}
                  </label>
                  <select
                    value={retailerForm.assignedSrId}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, assignedSrId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white font-medium"
                  >
                    <option value="">{isBn ? "রুটের ডিফল্ট এসআর" : "Beat Default SR"}</option>
                    {staffOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.distributorRole})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Credit Limit & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "বাকি লিমিট (টাকা)" : "Credit Limit (৳)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={retailerForm.creditLimit}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, creditLimit: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isBn ? "সর্বোচ্চ দেনার ক্যাপ" : "Max unpaid allowance"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isBn ? "প্রারম্ভিক বাকি (টাকা)" : "Opening Due (৳)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={!!editingRetailer}
                    value={retailerForm.openingBalance}
                    onChange={(e) =>
                      setRetailerForm({ ...retailerForm, openingBalance: e.target.value })
                    }
                    className={`w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 font-bold ${
                      editingRetailer ? "text-slate-400 bg-slate-100 cursor-not-allowed" : "text-amber-600"
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {editingRetailer
                      ? isBn
                        ? "লেজারে ইতোমধ্যে বিদ্যমান"
                        : "Fixed after initial creation"
                      : isBn
                        ? "সফটওয়্যারে যুক্তের পূর্বের দেনা"
                        : "Previous balance before Distribo"}
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRetailerModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#1C398E] rounded-xl hover:bg-[#162d70] disabled:opacity-50 shadow-xs"
                >
                  {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingRetailer
                      ? isBn
                        ? "আপডেট করুন"
                        : "Update Details"
                      : isBn
                        ? "দোকানদার সেভ করুন"
                        : "Save Retailer"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT BEAT */}
      {isBeatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsBeatModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1C398E] flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBeat
                    ? isBn
                      ? "রুট / বিট তথ্য পরিবর্তন"
                      : "Edit Delivery Route"
                    : isBn
                      ? "নতুন রুট / বিট তৈরি"
                      : "Create Delivery Route"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? "রুটের নাম, ডেলিভারি দিন ও দায়িত্বপ্রাপ্ত এসআর নির্ধারণ করুন"
                    : "Define route name, delivery day and assigned sales rep"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBeat} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "রুটের নাম *" : "Route Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={beatForm.name}
                  onChange={(e) => setBeatForm({ ...beatForm, name: e.target.value })}
                  placeholder={isBn ? "যেমন: রামপুরা মেইন রোড বা খিলগাঁও বিট" : "e.g. Rampura Main Road"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "ডেলিভারির দিন (Delivery Day)" : "Delivery Day"}
                </label>
                <select
                  value={beatForm.dayOfWeek}
                  onChange={(e) => setBeatForm({ ...beatForm, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white font-medium"
                >
                  <option value="">{isBn ? "প্রতিদিন / অনির্ধারিত" : "Daily / Flexible"}</option>
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "দায়িত্বপ্রাপ্ত এসআর (Assigned SR)" : "Assigned Sales Rep"}
                </label>
                <select
                  value={beatForm.assignedSrId}
                  onChange={(e) => setBeatForm({ ...beatForm, assignedSrId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white font-medium"
                >
                  <option value="">{isBn ? "-- কোনো এসআর নির্ধারিত নেই --" : "-- Unassigned --"}</option>
                  {staffOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.distributorRole})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? "এলাকার বিবরণ / নোট" : "Area Description / Notes"}
                </label>
                <textarea
                  rows={2}
                  value={beatForm.description}
                  onChange={(e) => setBeatForm({ ...beatForm, description: e.target.value })}
                  placeholder={isBn ? "যেমন: রামপুরা ব্রিজ থেকে খিলগাঁও ফ্লাইওভার পর্যন্ত দোকানসমূহ" : "Area landmarks, notes, etc."}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1C398E]/30 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBeatModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#1C398E] rounded-xl hover:bg-[#162d70] disabled:opacity-50 shadow-xs"
                >
                  {isPending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {editingBeat
                      ? isBn
                        ? "আপডেট করুন"
                        : "Update Beat"
                      : isBn
                        ? "রুট সেভ করুন"
                        : "Save Beat"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
