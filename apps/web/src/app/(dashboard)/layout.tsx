import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { ShieldAlert } from "lucide-react";
import LogoutButton from "./logout-button";
import DashboardShell from "@/components/layout/dashboard-shell";

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
    <DashboardShell
      distributorName={distributor.name}
      subscriptionPlan={distributor.subscriptionPlan}
      userName={user.name}
      role={user.distributorRole || "MANAGER"}
    >
      {children}
    </DashboardShell>
  );
}
