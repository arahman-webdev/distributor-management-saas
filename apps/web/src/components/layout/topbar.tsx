"use client";

import { useI18n } from "@/lib/i18n";
import { signOut } from "@distribo/auth/client";
import { Menu, Zap, Languages, LogOut, Shield } from "lucide-react";

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Left: Mobile Menu Trigger & Depot Name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs">
            {distributorName}
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:block">
            {t("tagline")}
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:shadow"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{t("quickActionBtn")}</span>
        </button>

        {/* Language Switcher */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-colors bg-slate-50"
          title="Switch language (বাংলা / English)"
        >
          <Languages className="w-3.5 h-3.5 text-slate-500" />
          <span>{locale === "bn" ? "ENG" : "বাংলা"}</span>
        </button>

        {/* User Info & Role Badge */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 block leading-tight">
              {userName}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${roleColor}`}
            >
              <Shield className="w-2.5 h-2.5" />
              {role}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title={t("logout")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
