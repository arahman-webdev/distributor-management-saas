"use client";

import { useI18n } from "@/lib/i18n";
import { signOut } from "@distribo/auth/client";
import {
  Menu,
  Zap,
  Languages,
  LogOut,
  Search,
  Bell,
  Calendar,
  Shield,
} from "lucide-react";

interface TopbarProps {
  distributorName: string;
  userName: string;
  role: string;
  onOpenMobile: () => void;
  onOpenQuickAction: () => void;
}

export default function Topbar({
  distributorName,
  userName,
  role,
  onOpenMobile,
  onOpenQuickAction,
}: TopbarProps) {
  const { locale, toggleLocale, t } = useI18n();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const roleColor =
    role === "OWNER"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : role === "MANAGER"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  // Initials for avatar
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Formatted date string
  const todayFormatted = new Intl.DateTimeFormat(
    locale === "bn" ? "bn-BD" : "en-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(new Date());

  return (
    <header className="h-18 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shadow-xs">
      {/* Left: Mobile Trigger & Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div className="relative w-full hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              locale === "bn"
                ? "পণ্য, চালান বা দোকানদার খুঁজুন..."
                : "Search products, invoices, or retailers..."
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Date Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all hover:scale-102"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{t("quickActionBtn")}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-colors bg-white hover:bg-slate-50"
          title="Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-slate-500" />
          <span>{locale === "bn" ? "ENG" : "বাংলা"}</span>
        </button>

        {/* Notifications Icon */}
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors relative hidden sm:block">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white"></span>
        </button>

        {/* User Profile & Topbar Logout */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="flex items-center gap-2.5">
            {/* Avatar Circle */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>

            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 leading-tight">
                {userName}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border mt-0.5 ${roleColor}`}
              >
                <Shield className="w-2.5 h-2.5" />
                {role}
              </span>
            </div>
          </div>

          {/* Top-Right Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all font-semibold text-xs"
            title={locale === "bn" ? "লগআউট" : "Log Out"}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {locale === "bn" ? "লগআউট" : "Logout"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
