"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { getFilteredQuickActions } from "@/lib/rbac-navigation";
import {
  Receipt,
  Wallet,
  PackagePlus,
  Coffee,
  UserPlus,
  X,
  Zap,
} from "lucide-react";

interface QuickActionDrawerProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Receipt,
  Wallet,
  PackagePlus,
  Coffee,
  UserPlus,
};

export default function QuickActionDrawer({
  role,
  isOpen,
  onClose,
}: QuickActionDrawerProps) {
  const { t, locale } = useI18n();
  const quickActions = getFilteredQuickActions(role);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">{t("quickActionTitle")}</h2>
                <p className="text-xs text-slate-400">{t("quickActionDesc")}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action List */}
          <div className="flex-1 p-6 space-y-3 overflow-y-auto bg-slate-50/50">
            {quickActions.map((item) => {
              const Icon = iconMap[item.iconName] || Zap;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div
                    className={`p-3 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-105 ${item.colorClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {t(item.titleKey)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {t(item.descKey)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
            <span>
              {locale === "bn"
                ? "কীবোর্ড শর্টকাট: ESC চেপে বন্ধ করুন"
                : "Keyboard shortcut: Press ESC to close"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
