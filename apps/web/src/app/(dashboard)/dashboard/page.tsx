import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import DashboardView from "@/components/dashboard/dashboard-view";

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
    <DashboardView
      userName={user?.name || "User"}
      distributorName={distributor?.name || "Depot"}
      subscriptionPlan={distributor?.subscriptionPlan || "STARTER"}
      role={user?.distributorRole || "OWNER"}
      counts={{
        users: distributor?._count.users || 1,
        products: distributor?._count.products || 0,
        retailers: distributor?._count.retailers || 0,
        invoices: distributor?._count.invoices || 0,
      }}
    />
  );
}
