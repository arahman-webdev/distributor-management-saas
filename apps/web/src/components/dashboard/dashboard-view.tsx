"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
  Truck,
  Package,
  ArrowUpRight,
  MoreVertical,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface DashboardViewProps {
  userName: string;
  distributorName: string;
  subscriptionPlan: string;
  role: string;
  counts: {
    users: number;
    products: number;
    retailers: number;
    invoices: number;
  };
}

export default function DashboardView({
  userName,
  distributorName,
  subscriptionPlan,
  role,
  counts,
}: DashboardViewProps) {
  const { locale, t } = useI18n();
  const [activeDateTab, setActiveDateTab] = useState<number>(2); // Wednesday (14th in reference style)
  const [selectedActivityRange, setSelectedActivityRange] = useState("Last 7 days");

  // Format greeting
  const greeting =
    locale === "bn"
      ? `শুভ সকাল, ${userName}! 👋`
      : `Good morning, ${userName}! 👋`;

  const subGreeting =
    locale === "bn"
      ? "আপনার ডিপোর আজকের ডেলিভারি ও বিক্রির লাইভ সারাংশ।"
      : "Here's what's happening with your distributor operations today.";

  // Week days for "This Week" widget
  const weekDays = [
    { day: "Mon", date: 12 },
    { day: "Tue", date: 13 },
    { day: "Wed", date: 14, active: true },
    { day: "Thu", date: 15 },
    { day: "Fri", date: 16 },
    { day: "Sat", date: 17 },
    { day: "Sun", date: 18 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Date Filter Bar (Exact FlowTask Greeting) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {greeting}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{subGreeting}</p>
        </div>

        {/* Date Range Selector Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs font-semibold text-slate-700 hover:border-slate-300 cursor-pointer transition-all">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>
              {locale === "bn"
                ? "০১ মে, ২০২৬ - ৩১ মে, ২০২৬"
                : "May 1, 2026 - May 31, 2026"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Row 1: 4 Key Metric / KPI Cards (Matching FlowTask 4 Colored Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Blue - Active Projects / Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="w-3 h-3" />
              25%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "আজকের মেমো / বিক্রি" : "Active Invoices"}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {locale === "bn" ? "৳৪৮,৫২০" : "৳48,520"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {locale === "bn" ? "গত মাসের তুলনায় ↑" : "vs last month"}
            </p>
          </div>
        </div>

        {/* Card 2: Green - Tasks Completed / Cash Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="w-3 h-3" />
              18%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "নগদ ক্যাশ জমা" : "Cash Collected"}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {locale === "bn" ? "৳৩৬,২০০" : "৳36,200"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {locale === "bn" ? "ড্রয়ারে নগদ জমা" : "vs last month"}
            </p>
          </div>
        </div>

        {/* Card 3: Orange - Pending Tasks / Market Baki */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <TrendingDown className="w-3 h-3" />
              12%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "মার্কেট বাকি (বকেয়া)" : "Pending Market Due"}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {locale === "bn" ? "৳১২,৩২০" : "৳12,320"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {locale === "bn" ? "বকেয়া আদায় চলমান" : "vs last month"}
            </p>
          </div>
        </div>

        {/* Card 4: Purple - Team Members / Staff */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              ↑ 0%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "bn" ? "ডিপো ও ফিল্ড স্টাফ" : "Team Members"}
            </p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {counts.users > 0 ? counts.users : 8}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {locale === "bn" ? "সক্রিয় কর্মচারী" : "Active this month"}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: 3 Columns (Project Progress, Tasks Overview Donut, This Week Beat Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Fast-Moving Products ("Project Progress" in FlowTask) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {locale === "bn" ? "টপ বিক্রিত পণ্য (Fast-Moving)" : "Project Progress"}
              </h3>
              <Link
                href="/products"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{locale === "bn" ? "সব দেখুন" : "View All"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Item 1 */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800">
                    {locale === "bn" ? "প্রাণ চিনিগুড়া চাল ১ কেজি" : "Website Redesign"}
                  </span>
                  <span className="text-slate-500 font-bold">78%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: "78%" }}
                  />
                </div>
              </div>

              {/* Item 2 */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800">
                    {locale === "bn" ? "রাঁধুনী সরিষার তেল ৫০০মিলি" : "Mobile App Development"}
                  </span>
                  <span className="text-slate-500 font-bold">62%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: "62%" }}
                  />
                </div>
              </div>

              {/* Item 3 */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800">
                    {locale === "bn" ? "বম্বে সুইটস পটেটো ক্র্যাকার্স" : "CRM Integration"}
                  </span>
                  <span className="text-slate-500 font-bold">45%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>

              {/* Item 4 */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-800">
                    {locale === "bn" ? "লাক্স বিউটি সাবান ১০০ গ্রাম" : "Marketing Campaign"}
                  </span>
                  <span className="text-slate-500 font-bold">90%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: "90%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Collection Overview ("Tasks Overview" Donut Chart in FlowTask) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              {locale === "bn" ? "আজকের পেমেন্ট রেশিও" : "Tasks Overview"}
            </h3>

            {/* Donut Chart Visualization */}
            <div className="flex items-center justify-center my-3 relative">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="text-slate-100"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Segment 1: Cash (75%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="text-blue-600"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="59.69"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Segment 2: Baki (20%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="text-amber-500"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="191"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              {/* Inner Center Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  248
                </span>
                <span className="text-[11px] font-semibold text-slate-400 mt-1">
                  {locale === "bn" ? "মোট মেমো" : "Total Tasks"}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-around text-xs mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-slate-500">{locale === "bn" ? "ক্যাশ" : "Completed"}</span>
                <strong className="text-slate-800">186</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-500">{locale === "bn" ? "বাকি" : "In Progress"}</span>
                <strong className="text-slate-800">48</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="text-slate-500">{locale === "bn" ? "অপেক্ষমাণ" : "To Do"}</span>
                <strong className="text-slate-800">14</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: This Week Beat Schedule ("This Week" Calendar in FlowTask) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {locale === "bn" ? "আজকের রুট ও শিডিউল" : "This Week"}
              </h3>
              <Link
                href="/retailers"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{locale === "bn" ? "ক্যালেন্ডার" : "View Calendar"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Horizontal Days Strip */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 border-b border-slate-100">
              {weekDays.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDateTab(idx)}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                    idx === activeDateTab
                      ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-500/20"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[10px] uppercase font-semibold">{item.day}</span>
                  <span className="text-xs font-bold mt-0.5">{item.date}</span>
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="mt-4 space-y-3">
              {/* Event 1 */}
              <div className="flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {locale === "bn" ? "মিরপুর-১০ ও কাজীপাড়া রুট" : "Design Review"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">10:00 AM - 11:00 AM</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    KU
                  </div>
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    RA
                  </div>
                </div>
              </div>

              {/* Event 2 */}
              <div className="flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {locale === "bn" ? "শেওড়াপাড়া বাজার ডেলিভারি" : "Sprint Planning"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">1:00 PM - 2:00 PM</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    MT
                  </div>
                </div>
              </div>

              {/* Event 3 */}
              <div className="flex items-start justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {locale === "bn" ? "সন্ধ্যা ক্যাশ ক্লোজিং মিটিং" : "Client Feedback"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">3:00 PM - 4:00 PM</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    SH
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    +2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 2 Columns (Team Members List & Tasks Activity Stacked Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Col 1: Team Members (2 Columns wide on LG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {locale === "bn" ? "ডিপো ও ফিল্ড টিম" : "Team Members"}
              </h3>
              <Link
                href="/settings"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>{locale === "bn" ? "সব দেখুন" : "View All"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {/* Member 1 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    KU
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      করিম উল্লাহ (Karim Ullah)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Senior Sales Rep (SR)
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>

              {/* Member 2 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    MT
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      মোঃ তারেক (Md. Tareq)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sales Representative
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>

              {/* Member 3 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                    RA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      রফিক আহমেদ (Rafiq Ahmed)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Delivery Van Driver
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  In Delivery
                </span>
              </div>

              {/* Member 4 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    SH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      সাঈদ হাসান (Sayed Hasan)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Godown Manager
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Online
                </span>
              </div>

              {/* Member 5 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                    JU
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      জামান উদ্দিন (Jamman)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Junior Assistant
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  Away
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Tasks Activity Stacked Bar Chart (3 Columns wide on LG) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {locale === "bn" ? "দৈনিক বিক্রি ও ক্যাশ আদায়" : "Tasks Activity"}
              </h3>
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 cursor-pointer">
                <span>{selectedActivityRange}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Stacked Bars Chart */}
            <div className="h-48 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
              {/* Day Mon */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[20%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[30%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[35%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Mon</span>
              </div>

              {/* Day Tue */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[25%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[35%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[25%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Tue</span>
              </div>

              {/* Day Wed */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[15%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[25%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[50%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Wed</span>
              </div>

              {/* Day Thu */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[20%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[30%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[40%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Thu</span>
              </div>

              {/* Day Fri */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[30%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[25%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[35%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Fri</span>
              </div>

              {/* Day Sat */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[15%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[20%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[45%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Sat</span>
              </div>

              {/* Day Sun */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[28px] flex flex-col gap-1 items-center justify-end h-full">
                  <div className="w-full bg-blue-100 rounded-t h-[25%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-400 h-[30%] transition-all group-hover:opacity-80" />
                  <div className="w-full bg-blue-600 rounded-b h-[35%] transition-all group-hover:opacity-80" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">Sun</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs mt-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-600" />
                <span className="text-slate-600">
                  {locale === "bn" ? "ক্যাশ বিক্রি (Cash)" : "Completed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-400" />
                <span className="text-slate-600">
                  {locale === "bn" ? "বকেয়া আদায় (Recovery)" : "In Progress"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-100" />
                <span className="text-slate-600">
                  {locale === "bn" ? "নতুন মেমো (Created)" : "Created"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: FMCG Delivery & Memo Pipeline ("Kanban Board" in FlowTask) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-blue-600 font-bold">
              <span className="w-2 h-4 bg-blue-600 rounded-xs" />
              <span className="w-2 h-4 bg-blue-400 rounded-xs" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {locale === "bn" ? "ডেলিভারি ও মেমো পাইপলাইন (Kanban Board)" : "Kanban Board"}
            </h3>
          </div>
          <Link
            href="/pos"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>{locale === "bn" ? "পুরো বোর্ড দেখুন" : "View Full Board"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: To Do */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700">
                  {locale === "bn" ? "নতুন অর্ডার (To Do)" : "To Do"}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  4
                </span>
              </div>

              <div className="space-y-3">
                {/* Task Card 1 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "মেমো #১০৮১ - হাজী জেনারেল" : "Create project roadmap"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳৪,৫০০ • ৩ কার্টন বিস্কুট" : "Depot Road Dispatch"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                      High
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 16
                    </span>
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                      KU
                    </div>
                  </div>
                </div>

                {/* Task Card 2 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "মেমো #১০৮৪ - ভাই ভাই এন্টারপ্রাইজ" : "Design landing page"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳২,৩০০ • ১ কার্টন তেল" : "Depot Road Dispatch"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                      Medium
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 18
                    </span>
                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                      MT
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 text-xs font-bold flex items-center justify-center gap-1 hover:bg-white transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "মেমো যুক্ত করুন" : "Add Task"}</span>
            </button>
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-900">
                  {locale === "bn" ? "ভ্যানে লোডিং (In Progress)" : "In Progress"}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  3
                </span>
              </div>

              <div className="space-y-3">
                {/* Task Card 1 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "চালান #৫১২ - জনতা স্টোর" : "API integration"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳৮,৯০০ • ভ্যান #১ লোডিং" : "Depot Road Dispatch"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                      High
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 15
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                      RA
                    </div>
                  </div>
                </div>

                {/* Task Card 2 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "চালান #৫১৫ - সততা ভ্যারাইটিজ" : "Mobile app UI"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳৩,৭৫০ • ভ্যান #১ লোডিং" : "Depot Road Dispatch"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                      Medium
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 17
                    </span>
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                      KU
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-2 rounded-xl border border-dashed border-blue-200 hover:border-blue-300 text-blue-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-white transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "চালান যুক্ত করুন" : "Add Task"}</span>
            </button>
          </div>

          {/* Column 3: Review / On Route */}
          <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-amber-900">
                  {locale === "bn" ? "ফিল্ডে ডেলিভারিতে (Review)" : "Review"}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  2
                </span>
              </div>

              <div className="space-y-3">
                {/* Task Card 1 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "মেমো #১০৭২ - নিউ মদিনা ডিপার্টমেন্টাল" : "User testing"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳৬,৪০০ • মিরপুর বিটে পৌঁছাচ্ছে" : "Shewrapara Beat"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                      Medium
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 16
                    </span>
                    <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center">
                      MT
                    </div>
                  </div>
                </div>

                {/* Task Card 2 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow">
                  <p className="text-xs font-bold text-slate-900">
                    {locale === "bn" ? "মেমো #১০৭৫ - গ্রীন গ্রোসারি" : "Performance optimization"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {locale === "bn" ? "৳১,৮৫০ • কাজীপাড়ায় আনলোড" : "Kazipara Beat"}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                      High
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> May 18
                    </span>
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                      RA
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-2 rounded-xl border border-dashed border-amber-200 hover:border-amber-300 text-amber-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-white transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "ট্র্যাকিং যুক্ত করুন" : "Add Task"}</span>
            </button>
          </div>

          {/* Column 4: Done / Settled */}
          <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-900">
                  {locale === "bn" ? "ডেলিভারি সম্পন্ন (Done)" : "Done"}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  3
                </span>
              </div>

              <div className="space-y-3">
                {/* Task Card 1 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {locale === "bn" ? "মেমো #১০৬৭ - আল-আমিন" : "Brand guidelines"}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    {locale === "bn" ? "৳১১,২০০ নগদ ক্যাশ আদায়" : "Completed on time"}
                  </p>
                  <p className="text-[10px] text-slate-400 pl-6 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> May 12
                  </p>
                </div>

                {/* Task Card 2 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {locale === "bn" ? "মেমো #১০৬৯ - বরকত ট্রেডার্স" : "Database setup"}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    {locale === "bn" ? "৳৫,৬০০ ক্যাশ ড্রয়ারে জমা" : "Completed on time"}
                  </p>
                  <p className="text-[10px] text-slate-400 pl-6 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> May 14
                  </p>
                </div>

                {/* Task Card 3 */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs space-y-2 hover:shadow-xs transition-shadow">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {locale === "bn" ? "মেমো #১০৭০ - সোনারগাঁও" : "Initial wireframes"}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-6">
                    {locale === "bn" ? "৳৭,৪০০ পরিশোধিত" : "Completed on time"}
                  </p>
                  <p className="text-[10px] text-slate-400 pl-6 flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3" /> May 13
                  </p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-2 rounded-xl border border-dashed border-emerald-200 hover:border-emerald-300 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-white transition-all">
              <Plus className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "হিস্ট্রি দেখুন" : "Add Task"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
