import { getCurrentSession } from "@/lib/actions/auth-actions";
import { requireTenantAccess } from "@distribo/auth";
import { getBakiKhataAction } from "@/lib/actions/khata-actions";
import {
  getBeatsAction,
  getStaffSROptionsAction,
} from "@/lib/actions/retailer-actions";
import BakiKhataView from "@/components/khata/baki-khata-view";
import { redirect } from "next/navigation";

export default async function KhataPage() {
  const session = await getCurrentSession();

  let role = "SR";
  try {
    const authInfo = requireTenantAccess(session as any, [
      "OWNER",
      "MANAGER",
      "SR",
    ]);
    role = authInfo.user.distributorRole || "SR";
  } catch {
    redirect("/login");
  }

  // Fetch Khata directory, beats and staff options concurrently
  const [khataRes, beatsRes, staffRes] = await Promise.all([
    getBakiKhataAction(),
    getBeatsAction(),
    getStaffSROptionsAction(),
  ]);

  return (
    <BakiKhataView
      initialRetailers={khataRes.retailers}
      initialMetrics={khataRes.metrics}
      role={role}
      beats={beatsRes.beats}
      staffOptions={staffRes.staff}
    />
  );
}
