"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { getFilteredNavItems } from "@/lib/rbac-navigation";
import { signOut } from "@distribo/auth/client";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Store,
  BookOpen,
  Clock,
  Settings,
  X,
  LogOut,
  Sparkles,
  Shield,
  Crown,
  ArrowRight,
} from "lucide-react";

interface SidebarProps {
  role: string;
  distributorName: string;
  subscriptionPlan: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Store,
  BookOpen,
  Clock,
  Settings,
};

export default function Sidebar({
  role,
  distributorName,
  subscriptionPlan,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const navItems = getFilteredNavItems(role);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-slate-900 leading-tight">
                Distribo
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                FMCG
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] mt-0.5">
              {distributorName}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {locale === "bn" ? "ডিপো মেনু (Role: " + role + ")" : "Depot Menu (" + role + ")"}
        </div>
        {navItems.map((item) => {
          const Icon = iconMap[item.iconName] || LayoutDashboard;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all group ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-100/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                    : "text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block truncate text-sm leading-tight">
                  {t(item.labelKey)}
                </span>
                <span className="text-[11px] block truncate font-normal text-slate-400 mt-0.5">
                  {t(item.subtitleKey)}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Cards */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        {/* FlowTask-style Upgrade Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-md shadow-blue-500/15">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-amber-300">
              <Crown className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {subscriptionPlan}
            </span>
          </div>
          <h4 className="text-xs font-bold text-white tracking-tight">
            {locale === "bn" ? "ডিস্ট্রিবো এন্টারপ্রাইজ প্রো" : "Upgrade to Pro"}
          </h4>
          <p className="text-[11px] text-blue-100 mt-1 leading-snug">
            {locale === "bn"
              ? "আনলিমিটেড দোকানদার, এসএমএস রসিদ ও অটো ব্যাকআপ।"
              : "Get advanced features, unlimited stores, and more."}
          </p>
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>{locale === "bn" ? "প্ল্যান বিস্তারিত দেখুন" : "Upgrade Now"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Prominent Sidebar Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-bold transition-all shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>{locale === "bn" ? "লগআউট করুন (Log Out)" : "Log Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
