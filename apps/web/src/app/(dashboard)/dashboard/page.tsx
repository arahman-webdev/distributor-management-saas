import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { ShieldCheck, TrendingUp, Users, Package, Wallet, CheckCircle2 } from "lucide-react";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const user = session?.user as any;

  const distributor = await prisma.distributor.findUnique({
    where: { id: user?.distributorId },
    include: {
      _count: {
        select: {
          users: true,
          products: true,
          retailers: true,
          invoices: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Two-Tier RBAC Active ({user?.distributorRole})
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            স্বাগতম, {user?.name}!
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {distributor?.name} • প্ল্যান: <strong className="text-slate-700">{distributor?.subscriptionPlan}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
            <span>স্টাফ সংখ্যা (Users): </span>
            <strong className="text-slate-900">{distributor?._count.users} / {distributor?.maxUsers}</strong>
          </div>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold">আজকের বিক্রি (Sales)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">৳0.00</p>
          <span className="text-[11px] text-slate-400">Day 8 Invoicing Engine</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold">মার্কেট বাকি (Total Due)</span>
            <Wallet className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600">৳0.00</p>
          <span className="text-[11px] text-slate-400">Day 10 Baki Khata</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold">মোট দোকানদার (Retailers)</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{distributor?._count.retailers || 0}</p>
          <span className="text-[11px] text-slate-400">Day 6 Route Master</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold">পণ্য আইটেম (Products)</span>
            <Package className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{distributor?._count.products || 0}</p>
          <span className="text-[11px] text-slate-400">Day 4 Product Master</span>
        </div>
      </div>
    </div>
  );
}
