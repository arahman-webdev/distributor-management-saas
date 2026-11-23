import { getCurrentSession } from "@/lib/actions/auth-actions";
import { requireTenantAccess } from "@distribo/auth";
import { getPOSInitDataAction } from "@/lib/actions/pos-actions";
import POSBillingView from "@/components/pos/pos-billing-view";
import { redirect } from "next/navigation";

export default async function POSPage() {
  const session = await getCurrentSession();

  try {
    requireTenantAccess(session as any, ["OWNER", "MANAGER", "SR"]);
  } catch {
    redirect("/login");
  }

  const res = await getPOSInitDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">
          পিওএস লোড করতে ব্যর্থ হয়েছে
        </h2>
        <p className="text-xs text-slate-500 mt-1">{res.error}</p>
      </div>
    );
  }

  return <POSBillingView initData={res.data} />;
}
