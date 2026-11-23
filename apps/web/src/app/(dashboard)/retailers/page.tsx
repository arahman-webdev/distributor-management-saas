import { getCurrentSession } from "@/lib/actions/auth-actions";
import { requireTenantAccess } from "@distribo/auth";
import {
  getRetailersAction,
  getBeatsAction,
  getStaffSROptionsAction,
} from "@/lib/actions/retailer-actions";
import RetailerDirectoryView from "@/components/retailers/retailer-directory-view";
import { redirect } from "next/navigation";

export default async function RetailersPage() {
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

  // Fetch retailers, beats, and staff options concurrently
  const [retailersRes, beatsRes, staffRes] = await Promise.all([
    getRetailersAction(),
    getBeatsAction(),
    getStaffSROptionsAction(),
  ]);

  return (
    <RetailerDirectoryView
      initialRetailers={retailersRes.retailers}
      initialBeats={beatsRes.beats}
      staffOptions={staffRes.staff}
      role={role}
      metrics={retailersRes.metrics}
    />
  );
}
