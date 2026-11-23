"use client";

import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n";
import {
  StaffMember,
  StaffRole,
  createStaffAction,
  removeStaffAction,
} from "@/lib/actions/staff-actions";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  Key,
  Mail,
  Phone,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Check,
} from "lucide-react";

interface StaffManagementViewProps {
  distributorName: string;
  subscriptionPlan: string;
  maxUsers: number;
  initialStaff: StaffMember[];
  metrics: {
    totalUsers: number;
    managerCount: number;
    srCount: number;
    remainingSlots: number;
  };
}

export default function StaffManagementView({
  distributorName,
  subscriptionPlan,
  maxUsers,
  initialStaff,
  metrics,
}: StaffManagementViewProps) {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<StaffMember | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "SR" as StaffRole,
  });

  const filteredStaff = initialStaff.filter((m) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.phone && m.phone.includes(searchTerm));

    const matchesRole =
      roleFilter === "ALL" || m.distributorRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await createStaffAction({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      if (!res.success) {
        setErrorMsg(res.error || "কর্মী তৈরি ব্যর্থ হয়েছে।");
      } else {
        setSuccessMsg(
          locale === "bn"
            ? `${formData.name} সফলভাবে ${formData.role} হিসেবে যুক্ত হয়েছেন! তিনি এখন লগইন করতে পারবেন।`
            : `${formData.name} was successfully registered as ${formData.role}! They can now log in.`
        );
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          password: "",
          role: "SR",
        });
      }
    });
  };

  const handleDeleteConfirm = () => {
    if (!deletingUser) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await removeStaffAction(deletingUser.id);
      if (!res.success) {
        setErrorMsg(res.error || "কর্মী মুছতে সমস্যা হয়েছে।");
      } else {
        setSuccessMsg(
          locale === "bn"
            ? `${deletingUser.name} কে সফলভাবে সরানো হয়েছে।`
            : `${deletingUser.name} has been removed successfully.`
        );
        setDeletingUser(null);
      }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#1C398E]/10 text-[#1C398E] border border-[#1C398E]/20 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Owner Exclusive Portal
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {distributorName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {locale === "bn"
              ? "সেটিংস ও কর্মচারী ব্যবস্থাপনা"
              : "Staff & Settings"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {locale === "bn"
              ? "আপনার ডিপোর ম্যানেজার ও ফিল্ড এসআর (SR) এর লগইন অ্যাকাউন্ট তৈরি ও নিয়ন্ত্রণ করুন।"
              : "Create and manage login accounts for your Managers and Field Sales Representatives."}
          </p>
        </div>

        {/* Add Employee Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          disabled={metrics.remainingSlots === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 transition-all hover:scale-102 disabled:opacity-50 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{locale === "bn" ? "নতুন কর্মী যুক্ত করুন" : "Add Employee"}</span>
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users & Quota */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-[#1C398E]/10 text-[#1C398E] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                metrics.remainingSlots === 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {metrics.remainingSlots === 0 ? "Full Quota" : `${metrics.remainingSlots} Slots Left`}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "মোট ইউজার কোটা" : "Staff Quota"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.totalUsers} / {maxUsers}
            </p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#1C398E] h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (metrics.totalUsers / maxUsers) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Godown Managers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Operations
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "গোডাউন ম্যানেজার" : "Godown Managers"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.managerCount} জন
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "স্টক ও ক্লোজিং দায়িত্ব" : "Inventory & Reconciliation"}
            </p>
          </div>
        </div>

        {/* Metric 3: Field SRs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Sales Rep
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "ফিল্ড সেলস রিপ্রেজেন্টেটিভ" : "Field SRs"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics.srCount} জন
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "রুট মেমো ও বকেয়া কালেকশন" : "Orders & Dues Collection"}
            </p>
          </div>
        </div>

        {/* Metric 4: Subscription Plan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Active Tier
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "বর্তমান প্ল্যান" : "Subscription Plan"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {subscriptionPlan}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "bn" ? "ক্লাউড সিঙ্ক চালু রয়েছে" : "Cloud Sync Active"}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              locale === "bn"
                ? "নাম, ইমেইল বা মোবাইল দিয়ে খুঁজুন..."
                : "Search by staff name, email, or phone..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1C398E] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1C398E]"
          >
            <option value="ALL">
              {locale === "bn" ? "সকল পদবী" : "All Roles"}
            </option>
            <option value="OWNER">Owner (মালিক)</option>
            <option value="MANAGER">Manager (ম্যানেজার)</option>
            <option value="SR">SR (ফিল্ড এসআর)</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">{locale === "bn" ? "কর্মচারী তথ্য" : "Employee"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "মোবাইল নম্বর" : "Mobile Phone"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "পদবী ও অনুমতি" : "Role & Access"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "মেমো সংখ্যা" : "Invoices Created"}</th>
                <th className="py-3.5 px-4">{locale === "bn" ? "যোগদানের তারিখ" : "Joined"}</th>
                <th className="py-3.5 px-4 text-center">{locale === "bn" ? "অ্যাকশন" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">
                      {locale === "bn"
                        ? "কোনো কর্মী পাওয়া যায়নি।"
                        : "No staff members found matching criteria."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((m) => {
                  const initials = m.name
                    ? m.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "U";

                  const roleBadge =
                    m.distributorRole === "OWNER" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-extrabold border border-purple-200">
                        <Shield className="w-3 h-3" />
                        OWNER (মালিক)
                      </span>
                    ) : m.distributorRole === "MANAGER" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1C398E]/10 text-[#1C398E] font-extrabold border border-[#1C398E]/20">
                        <Building2 className="w-3 h-3" />
                        MANAGER (ম্যানেজার)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200">
                        <UserPlus className="w-3 h-3" />
                        SR (ফিল্ড ডেলিভারি)
                      </span>
                    );

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1C398E] to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 leading-tight">
                                {m.name}
                              </span>
                              {m.isCurrentUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {m.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {m.phone || "—"}
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 text-center">{roleBadge}</td>

                      {/* Invoices Count */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {m.invoicesCount}
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                        {new Date(m.createdAt).toLocaleDateString(
                          locale === "bn" ? "bn-BD" : "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {!m.isCurrentUser && m.distributorRole !== "OWNER" && (
                          <button
                            onClick={() => setDeletingUser(m)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Employee */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {locale === "bn"
                    ? "নতুন কর্মী নিয়োগ ও লগইন অ্যাকাউন্ট"
                    : "Add Employee Account"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "bn"
                    ? "ম্যানেজার বা এসআর নির্বাচন করে তাদের নিজস্ব লগইন পাসওয়ার্ড দিন।"
                    : "Create an individual employee login tied to your distributor depot."}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Role Selection Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  কর্মচারীর পদবী (Role) নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* SR Card */}
                  <div
                    onClick={() => setFormData({ ...formData, role: "SR" })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.role === "SR"
                        ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">
                        ফিল্ড এসআর (SR)
                      </span>
                      {formData.role === "SR" && (
                        <Check className="w-4 h-4 text-emerald-600 stroke-3" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      দোকানদার ভিজিট, চালান ডেলিভারি ও বকেয়া কালেকশন। ক্রয়মূল্য সম্পূর্ণ গোপন থাকবে।
                    </p>
                  </div>

                  {/* Manager Card */}
                  <div
                    onClick={() => setFormData({ ...formData, role: "MANAGER" })}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      formData.role === "MANAGER"
                        ? "border-[#1C398E] bg-[#1C398E]/5 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-slate-900">
                        গোডাউন ম্যানেজার
                      </span>
                      {formData.role === "MANAGER" && (
                        <Check className="w-4 h-4 text-[#1C398E] stroke-3" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      দৈনিক গোডাউন স্টক চালান ইনওয়ার্ড, প্রোডাক্ট মাস্টার ও ক্যাশ ক্লোজিং।
                    </p>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    কর্মীর পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Md. Rafiq Islam"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="e.g. 01712345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  লগইন ইমেইল এড্রেস *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="e.g. rafiq@yourdepot.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  কর্মী এই ইমেইল ব্যবহার করে সাইটে লগইন করবেন।
                </span>
              </div>

              {/* Initial Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  লগইন পাসওয়ার্ড (ন্যূনতম ৮ অক্ষর) *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#1C398E] focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#1C398E] hover:bg-[#162C70] text-white text-xs font-bold shadow-md shadow-[#1C398E]/25 disabled:opacity-50"
                >
                  {isPending ? "তৈরি হচ্ছে..." : "অ্যাকাউন্ট তৈরি করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-2">
              কর্মী সরানোর সতর্কতা
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <strong>{deletingUser.name}</strong> ({deletingUser.distributorRole}) এর অ্যাকাউন্ট মুছে ফেলতে চান?
              তিনি আর সিস্টেমে লগইন করতে পারবেন না।
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
              >
                বাতিল
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-600/30 disabled:opacity-50"
              >
                {isPending ? "সরানো হচ্ছে..." : "হ্যাঁ, মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
