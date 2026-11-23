"use client";

import { useState } from "react";
import { LanguageProvider } from "@/lib/i18n";
import Sidebar from "./sidebar";
import Topbar from "./topbar";
import QuickActionDrawer from "./quick-action-drawer";

interface DashboardShellProps {
  distributorName: string;
  subscriptionPlan: string;
  userName: string;
  role: string;
  children: React.ReactNode;
}

export default function DashboardShell({
  distributorName,
  subscriptionPlan,
  userName,
  role,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Responsive Sidebar (Desktop & Mobile Drawer) */}
        <Sidebar
          role={role}
          distributorName={distributorName}
          subscriptionPlan={subscriptionPlan}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Application Area (offset by sidebar width on desktop) */}
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
          <Topbar
            distributorName={distributorName}
            userName={userName}
            role={role}
            onOpenMobile={() => setMobileOpen(true)}
            onOpenQuickAction={() => setQuickActionOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Slide-out Quick Action Drawer */}
        <QuickActionDrawer
          role={role}
          isOpen={quickActionOpen}
          onClose={() => setQuickActionOpen(false)}
        />
      </div>
    </LanguageProvider>
  );
}
