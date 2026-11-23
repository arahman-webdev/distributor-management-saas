"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { getFilteredNavItems } from "@/lib/rbac-navigation";
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
  ShieldCheck,
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/40">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
              Distribo
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
              {distributorName}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {locale === "bn" ? "ডিপো মেনু" : "Depot Menu"}
        </div>
        {navItems.map((item) => {
          const Icon = iconMap[item.iconName] || LayoutDashboard;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className="block truncate">{t(item.labelKey)}</span>
                <span
                  className={`text-[10px] block truncate font-normal ${
                    isActive ? "text-emerald-100" : "text-slate-500"
                  }`}
                >
                  {t(item.subtitleKey)}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] mb-2">
          <span className="text-slate-500">Plan:</span>
          <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            {subscriptionPlan}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role: <strong className="text-slate-300">{role}</strong></span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 shadow-lg">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer with Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-over panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
