import { getStaffAction } from "@/lib/actions/staff-actions";
import StaffManagementView from "@/components/settings/staff-management-view";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const data = await getStaffAction();

  if (!data.success && data.error?.includes("Access denied")) {
    redirect("/dashboard");
  }

  return (
    <StaffManagementView
      distributorName={data.distributorName}
      subscriptionPlan={data.subscriptionPlan}
      maxUsers={data.maxUsers}
      initialStaff={data.staff}
      metrics={data.metrics}
    />
  );
}
