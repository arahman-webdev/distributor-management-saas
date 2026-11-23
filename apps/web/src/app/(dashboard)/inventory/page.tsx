import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { requireTenantAccess } from "@distribo/auth";
import { getStockTransactionsAction } from "@/lib/actions/inventory-actions";
import InventoryView from "@/components/inventory/inventory-view";
import { redirect } from "next/navigation";

export default async function InventoryPage() {
  const session = await getCurrentSession();

  let distributorId: string;
  try {
    const authInfo = requireTenantAccess(session as any, ["OWNER", "MANAGER"]);
    distributorId = authInfo.distributorId;
  } catch {
    redirect("/dashboard");
  }

  // Fetch transactions and available products in parallel
  const [historyData, rawProducts] = await Promise.all([
    getStockTransactionsAction(),
    prisma.product.findMany({
      where: { distributorId },
      select: {
        id: true,
        name: true,
        banglaName: true,
        brand: true,
        category: true,
        uomPrimary: true,
        uomSub: true,
        conversionFactor: true,
        purchaseCost: true,
        wholesalePrice: true,
      },
      orderBy: [{ brand: "asc" }, { name: "asc" }],
    }),
  ]);

  const availableProducts = rawProducts.map((p) => ({
    id: p.id,
    name: p.name,
    banglaName: p.banglaName,
    brand: p.brand,
    category: p.category,
    uomPrimary: p.uomPrimary,
    uomSub: p.uomSub,
    conversionFactor: p.conversionFactor,
    purchaseCost: Number(p.purchaseCost),
    wholesalePrice: Number(p.wholesalePrice),
  }));

  return (
    <InventoryView
      initialTransactions={historyData.transactions}
      availableProducts={availableProducts}
      metrics={historyData.metrics}
    />
  );
}
