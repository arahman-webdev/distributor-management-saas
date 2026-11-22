import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import Link from "next/link";
import { Store, ShoppingCart, Package, Users, BookOpen, Clock, AlertTriangle, ShieldAlert } from "lucide-react";
import LogoutButton from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  // Redirect platform super admin to admin portal
  if (user.platformRole === "SUPER_ADMIN") {
    redirect("/admin");
  }

  if (!user.distributorId) {
    redirect("/login");
  }

  const distributor = await prisma.distributor.findUnique({
    where: { id: user.distributorId },
    select: { id: true, name: true, status: true, subscriptionPlan: true },
  });

  if (!distributor) {
    redirect("/login");
  }

  // Handle Suspended or Deactivated Tenant Accounts
  if (distributor.status !== "ACTIVE") {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-amber-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-700 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            অ্যাকাউন্ট স্থগিত করা হয়েছে (Account Suspended)
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            আপনার ডিস্ট্রিবিউটর অ্যাকাউন্টটি প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর কর্তৃক সাময়িকভাবে স্থগিত রয়েছে।
            অনুগ্রহ করে প্ল্যাটফর্ম সাপোর্ট বা সাবস্ক্রিপশন হেল্পডেস্কে যোগাযোগ করুন।
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 mb-6">
            <p>Distributor: <strong>{distributor.name}</strong></p>
            <p className="mt-1">Status: <span className="font-semibold text-amber-600">{distributor.status}</span></p>
          </div>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">
                {distributor.name}
              </span>
              <span className="text-xs text-slate-500">
                FMCG Distribution Depot
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {user.distributorRole}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          <Link
            href="/dashboard"
            className="py-3 px-3.5 border-b-2 border-emerald-600 text-emerald-700 flex items-center gap-1.5 whitespace-nowrap"
          >
            ড্যাশবোর্ড (Dashboard)
          </Link>
          <span className="py-3 px-3.5 text-slate-400 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap">
            <ShoppingCart className="w-3.5 h-3.5" />
            বিক্রি / POS (Day 7)
          </span>
          <span className="py-3 px-3.5 text-slate-400 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap">
            <Package className="w-3.5 h-3.5" />
            পণ্য তালিকা (Day 4)
          </span>
          <span className="py-3 px-3.5 text-slate-400 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap">
            <Users className="w-3.5 h-3.5" />
            দোকানদার / রুট (Day 6)
          </span>
          <span className="py-3 px-3.5 text-slate-400 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5" />
            বাকি খাতা (Day 10)
          </span>
          <span className="py-3 px-3.5 text-slate-400 flex items-center gap-1.5 cursor-not-allowed whitespace-nowrap">
            <Clock className="w-3.5 h-3.5" />
            দৈনিক ক্লোজিং (Day 13)
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
