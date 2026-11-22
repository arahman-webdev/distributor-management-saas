"use server";

import { requireSuperAdmin } from "@distribo/auth";
import { prisma } from "@distribo/db";
import { getCurrentSession } from "./auth-actions";
import { revalidatePath } from "next/cache";

export async function listDistributorsAction() {
  const session = await getCurrentSession();
  requireSuperAdmin(session as any);

  const distributors = await prisma.distributor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          retailers: true,
          invoices: true,
        },
      },
      users: {
        where: { distributorRole: "OWNER" },
        select: { name: true, email: true, phone: true },
        take: 1,
      },
    },
  });

  return distributors.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    address: d.address,
    status: d.status,
    subscriptionPlan: d.subscriptionPlan,
    createdAt: d.createdAt.toISOString(),
    ownerName: d.users[0]?.name || "Unassigned",
    ownerEmail: d.users[0]?.email || "—",
    userCount: d._count.users,
    retailerCount: d._count.retailers,
    invoiceCount: d._count.invoices,
  }));
}

export async function updateDistributorStatusAction(
  distributorId: string,
  newStatus: "ACTIVE" | "SUSPENDED" | "DEACTIVATED",
  reason?: string
) {
  const session = await getCurrentSession();
  const admin = requireSuperAdmin(session as any);

  const target = await prisma.distributor.findUnique({
    where: { id: distributorId },
  });

  if (!target) {
    throw new Error("Distributor not found");
  }

  const previousStatus = target.status;

  await prisma.$transaction(async (tx) => {
    // 1. Update status
    await tx.distributor.update({
      where: { id: distributorId },
      data: { status: newStatus },
    });

    // 2. Record immutable audit log
    await tx.platformAuditLog.create({
      data: {
        userId: admin.id,
        distributorId: target.id,
        action: `DISTRIBUTOR_${newStatus}`,
        targetType: "DISTRIBUTOR",
        targetId: target.id,
        details: {
          previousStatus,
          newStatus,
          reason: reason || "Administrative action",
          adminEmail: admin.email,
        },
      },
    });
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateDistributorPlanAction(
  distributorId: string,
  newPlan: "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE"
) {
  const session = await getCurrentSession();
  const admin = requireSuperAdmin(session as any);

  const target = await prisma.distributor.findUnique({
    where: { id: distributorId },
  });

  if (!target) {
    throw new Error("Distributor not found");
  }

  const previousPlan = target.subscriptionPlan;

  await prisma.$transaction(async (tx) => {
    await tx.distributor.update({
      where: { id: distributorId },
      data: { subscriptionPlan: newPlan },
    });

    await tx.platformAuditLog.create({
      data: {
        userId: admin.id,
        distributorId: target.id,
        action: "DISTRIBUTOR_PLAN_CHANGED",
        targetType: "SUBSCRIPTION",
        targetId: target.id,
        details: {
          previousPlan,
          newPlan,
          adminEmail: admin.email,
        },
      },
    });
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function getPlatformAuditLogsAction(limit: number = 20) {
  const session = await getCurrentSession();
  requireSuperAdmin(session as any);

  const logs = await prisma.platformAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      distributor: { select: { name: true } },
    },
  });

  return logs.map((log) => ({
    id: log.id,
    adminName: log.user.name,
    adminEmail: log.user.email,
    distributorName: log.distributor?.name || "Global",
    action: log.action,
    targetType: log.targetType,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));
}
