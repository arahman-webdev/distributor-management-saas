"use server";

import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { requireTenantAccess } from "@distribo/auth";
import {
  roundCurrency,
  calculateCreditUtilization,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// TYPES & INTERFACES
// -------------------------------------------------------------

export interface KhataFilterParams {
  beatId?: string;
  srId?: string;
  search?: string;
  status?: "all" | "overlimit" | "has_due" | "cleared";
}

export interface SanitizedKhataRetailer {
  id: string;
  shopName: string;
  ownerName: string | null;
  phone: string;
  address: string | null;
  creditLimit: number;
  openingBalance: number;
  currentDue: number;
  creditUtilization: number;
  isOverLimit: boolean;
  beatName: string | null;
  assignedSrName: string | null;
  invoicesCount: number;
  paymentsCount: number;
  lastPaymentDate: Date | null;
  lastPaymentAmount: number | null;
  lastInvoiceDate: Date | null;
}

export interface KhataOverviewResponse {
  success: boolean;
  error?: string;
  role: string;
  retailers: SanitizedKhataRetailer[];
  metrics: {
    totalMarketDue: number;
    todayCollected: number;
    totalCreditLimit: number;
    overLimitCount: number;
    retailersWithDueCount: number;
    totalRetailersCount: number;
  };
}

export interface CollectPaymentInput {
  retailerId: string;
  amount: number;
  paymentMethod: "CASH" | "BKASH" | "NAGAD" | "BANK";
  notes?: string;
}

export interface MoneyReceiptVoucher {
  id: string;
  mrNumber: string;
  createdAt: Date;
  amount: number;
  paymentMethod: string;
  notes: string | null;

  // Retailer Details
  retailer: {
    id: string;
    shopName: string;
    ownerName: string | null;
    phone: string;
    address: string | null;
    beatName: string | null;
  };

  // Financial Context
  previousDue: number;
  paidAmount: number;
  remainingDue: number;

  // Collector Info
  collectorName: string;
  collectorRole: string;

  // Depot Info
  distributorName: string;
  depotPhone: string;
  depotAddress: string;
  receiptHeader: string | null;
}

export interface LedgerTimelineEntry {
  id: string;
  date: Date;
  type: "OPENING_BALANCE" | "INVOICE" | "PAYMENT";
  referenceNumber: string; // e.g. "INV-2026-0001", "MR-2026-0001"
  description: string;
  debit: number; // Bill added to due
  credit: number; // Payment deducted from due
  runningBalance: number;
  method?: string;
}

export interface RetailerStatementResponse {
  success: boolean;
  error?: string;
  retailer?: {
    id: string;
    shopName: string;
    ownerName: string | null;
    phone: string;
    address: string | null;
    creditLimit: number;
    openingBalance: number;
    currentDue: number;
    beatName: string | null;
  };
  summary?: {
    openingBalance: number;
    totalBilled: number;
    totalPaid: number;
    currentDue: number;
    invoicesCount: number;
    paymentsCount: number;
  };
  timeline?: LedgerTimelineEntry[];
}

// -------------------------------------------------------------
// BAKI KHATA DIRECTORY & METRICS
// -------------------------------------------------------------

/**
 * Retrieves the market credit ledger (Baki Khata).
 * SR is strictly scoped to assigned retailers/routes; Owner & Manager see all depot accounts.
 */
export async function getBakiKhataAction(
  filters?: KhataFilterParams
): Promise<KhataOverviewResponse> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  try {
    const where: any = {
      distributorId,
      isActive: true,
    };

    // Role-based scope enforcement
    if (isSR) {
      where.OR = [
        { assignedSrId: sessionUser.id },
        { beat: { assignedSrId: sessionUser.id } },
      ];
    } else {
      if (filters?.srId && filters.srId !== "all") {
        where.OR = [
          { assignedSrId: filters.srId },
          { beat: { assignedSrId: filters.srId } },
        ];
      }
    }

    // Filter by Beat
    if (filters?.beatId && filters.beatId !== "all") {
      where.beatId = filters.beatId;
    }

    // Status Filters
    if (filters?.status === "overlimit") {
      where.AND = [
        { creditLimit: { gt: 0 } },
        { currentDue: { gt: prisma.retailer.fields.creditLimit } },
      ];
    } else if (filters?.status === "has_due") {
      where.currentDue = { gt: 0 };
    } else if (filters?.status === "cleared") {
      where.currentDue = { lte: 0 };
    }

    // Search query
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      const searchConditions = [
        { shopName: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Today's Date Range (00:00:00 to 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [retailers, todayPayments, allRetailersForMetrics] =
      await Promise.all([
        prisma.retailer.findMany({
          where,
          include: {
            beat: { select: { name: true } },
            assignedSr: { select: { name: true } },
            _count: {
              select: {
                invoices: true,
                payments: true,
              },
            },
            payments: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                createdAt: true,
                amount: true,
              },
            },
            invoices: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                createdAt: true,
              },
            },
          },
          orderBy: [{ currentDue: "desc" }, { shopName: "asc" }],
        }),

        // Today's collection total across distributor
        prisma.paymentTransaction.findMany({
          where: {
            distributorId,
            createdAt: { gte: todayStart },
            ...(isSR ? { createdById: sessionUser.id } : {}),
          },
          select: {
            amount: true,
          },
        }),

        // Overall tenant metrics
        prisma.retailer.findMany({
          where: isSR ? where : { distributorId, isActive: true },
          select: {
            creditLimit: true,
            currentDue: true,
          },
        }),
      ]);

    // Compute Metrics
    let totalMarketDue = 0;
    let totalCreditLimit = 0;
    let overLimitCount = 0;
    let retailersWithDueCount = 0;

    for (const r of allRetailersForMetrics) {
      const due = Number(r.currentDue || 0);
      const limit = Number(r.creditLimit || 0);

      totalMarketDue += due;
      totalCreditLimit += limit;
      if (due > 0) retailersWithDueCount++;
      if (limit > 0 && due > limit) overLimitCount++;
    }

    let todayCollected = 0;
    for (const p of todayPayments) {
      todayCollected += Number(p.amount || 0);
    }

    totalMarketDue = roundCurrency(totalMarketDue);
    todayCollected = roundCurrency(todayCollected);
    totalCreditLimit = roundCurrency(totalCreditLimit);

    const sanitizedRetailers: SanitizedKhataRetailer[] = retailers.map((r) => {
      const due = Number(r.currentDue || 0);
      const limit = Number(r.creditLimit || 0);
      const isOverLimit = limit > 0 && due > limit;

      return {
        id: r.id,
        shopName: r.shopName,
        ownerName: r.ownerName,
        phone: r.phone,
        address: r.address,
        creditLimit: limit,
        openingBalance: Number(r.openingBalance || 0),
        currentDue: due,
        creditUtilization: calculateCreditUtilization(due, limit),
        isOverLimit,
        beatName: r.beat?.name || null,
        assignedSrName: r.assignedSr?.name || null,
        invoicesCount: r._count.invoices,
        paymentsCount: r._count.payments,
        lastPaymentDate: r.payments[0]?.createdAt || null,
        lastPaymentAmount: r.payments[0]?.amount
          ? Number(r.payments[0].amount)
          : null,
        lastInvoiceDate: r.invoices[0]?.createdAt || null,
      };
    });

    return {
      success: true,
      role,
      retailers: sanitizedRetailers,
      metrics: {
        totalMarketDue,
        todayCollected,
        totalCreditLimit,
        overLimitCount,
        retailersWithDueCount,
        totalRetailersCount: allRetailersForMetrics.length,
      },
    };
  } catch (err: any) {
    console.error("getBakiKhataAction Error:", err);
    return {
      success: false,
      error: err.message || "বাকি খাতা লোড করতে ব্যর্থ হয়েছে।",
      role,
      retailers: [],
      metrics: {
        totalMarketDue: 0,
        todayCollected: 0,
        totalCreditLimit: 0,
        overLimitCount: 0,
        retailersWithDueCount: 0,
        totalRetailersCount: 0,
      },
    };
  }
}

// -------------------------------------------------------------
// PAYMENT COLLECTION & MR VOUCHER
// -------------------------------------------------------------

/**
 * Records a customer payment collection (due recovery) from a retailer.
 * Generates an official Money Receipt (MR-YYYY-XXXX), updates retailer currentDue,
 * and returns printable MR Voucher details.
 */
export async function collectPaymentAction(
  input: CollectPaymentInput
): Promise<{
  success: boolean;
  error?: string;
  voucher?: MoneyReceiptVoucher;
}> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  const safeAmount = roundCurrency(Number(input.amount) || 0);
  if (safeAmount <= 0) {
    return { success: false, error: "আদায়ের পরিমাণ ০ টাকার বেশি হতে হবে।" };
  }

  try {
    // 1. Fetch Retailer & verify access
    const retailer = await prisma.retailer.findFirst({
      where: {
        id: input.retailerId,
        distributorId,
        isActive: true,
      },
      include: {
        beat: { select: { name: true, assignedSrId: true } },
      },
    });

    if (!retailer) {
      return { success: false, error: "দোকানদার পাওয়া যায়নি।" };
    }

    if (isSR) {
      const isDirectlyAssigned = retailer.assignedSrId === sessionUser.id;
      const isBeatAssigned = retailer.beat?.assignedSrId === sessionUser.id;
      if (!isDirectlyAssigned && !isBeatAssigned) {
        return {
          success: false,
          error: "আপনি শুধুমাত্র আপনার নির্ধারিত দোকানের টাকা গ্রহণ করতে পারবেন।",
        };
      }
    }

    // 2. Generate sequential MR Number
    const year = new Date().getFullYear();
    const mrPrefix = `MR-${year}-`;

    const [latestMr, distributor] = await Promise.all([
      prisma.paymentTransaction.findFirst({
        where: { distributorId, mrNumber: { startsWith: mrPrefix } },
        orderBy: { mrNumber: "desc" },
        select: { mrNumber: true },
      }),
      prisma.distributor.findUnique({
        where: { id: distributorId },
        select: {
          name: true,
          phone: true,
          address: true,
          receiptHeader: true,
        },
      }),
    ]);

    let nextSeq = 1;
    if (latestMr?.mrNumber) {
      const parts = latestMr.mrNumber.split("-");
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextSeq = num + 1;
    }
    const mrNumber = `${mrPrefix}${String(nextSeq).padStart(4, "0")}`;

    const previousDue = roundCurrency(Number(retailer.currentDue));
    const newDue = roundCurrency(previousDue - safeAmount);

    // 3. Atomic Database Update
    const payment = await prisma.$transaction(async (tx) => {
      // Create Payment Transaction
      const pt = await tx.paymentTransaction.create({
        data: {
          distributorId,
          retailerId: retailer.id,
          mrNumber,
          amount: safeAmount,
          paymentMethod: input.paymentMethod,
          notes: input.notes?.trim() || null,
          createdById: sessionUser.id,
        },
      });

      // Update Retailer Current Due
      await tx.retailer.update({
        where: { id: retailer.id },
        data: {
          currentDue: newDue,
        },
      });

      return pt;
    });

    revalidatePath("/khata");
    revalidatePath("/retailers");
    revalidatePath("/pos");
    revalidatePath("/dashboard");
    revalidatePath("/closing");

    const voucher: MoneyReceiptVoucher = {
      id: payment.id,
      mrNumber: payment.mrNumber,
      createdAt: payment.createdAt,
      amount: safeAmount,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
      retailer: {
        id: retailer.id,
        shopName: retailer.shopName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        beatName: retailer.beat?.name || null,
      },
      previousDue,
      paidAmount: safeAmount,
      remainingDue: newDue,
      collectorName: sessionUser.name,
      collectorRole: role,
      distributorName: distributor?.name || "ডিস্ট্রিবিউটর",
      depotPhone: distributor?.phone || "",
      depotAddress: distributor?.address || "",
      receiptHeader: distributor?.receiptHeader || null,
    };

    return {
      success: true,
      voucher,
    };
  } catch (err: any) {
    console.error("collectPaymentAction Error:", err);
    return {
      success: false,
      error: err.message || "টাকা জমা সংরক্ষণ করতে ব্যর্থ হয়েছে।",
    };
  }
}

// -------------------------------------------------------------
// DOKAN STATEMENT (LEDGER KHATA)
// -------------------------------------------------------------

/**
 * Fetches the chronological Khata statement for an individual retailer.
 * Computes live running balance across opening balance, invoices (debits), and payments (credits).
 */
export async function getRetailerStatementAction(
  retailerId: string
): Promise<RetailerStatementResponse> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any,
    ["OWNER", "MANAGER", "SR"]
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  try {
    const retailer = await prisma.retailer.findFirst({
      where: { id: retailerId, distributorId },
      include: {
        beat: { select: { name: true, assignedSrId: true } },
        invoices: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        payments: {
          select: {
            id: true,
            mrNumber: true,
            amount: true,
            paymentMethod: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!retailer) {
      return { success: false, error: "দোকানদার পাওয়া যায়নি।" };
    }

    if (isSR) {
      const isDirectlyAssigned = retailer.assignedSrId === sessionUser.id;
      const isBeatAssigned = retailer.beat?.assignedSrId === sessionUser.id;
      if (!isDirectlyAssigned && !isBeatAssigned) {
        return {
          success: false,
          error: "আপনি শুধুমাত্র আপনার নির্ধারিত দোকানের লেজার দেখতে পারবেন।",
        };
      }
    }

    const openingBalance = roundCurrency(Number(retailer.openingBalance || 0));
    let runningBalance = openingBalance;

    // Merge invoices and payments into a chronological stream
    type RawEntry =
      | { type: "INVOICE"; data: (typeof retailer.invoices)[0] }
      | { type: "PAYMENT"; data: (typeof retailer.payments)[0] };

    const rawStream: RawEntry[] = [
      ...retailer.invoices.map((inv) => ({ type: "INVOICE" as const, data: inv })),
      ...retailer.payments.map((p) => ({ type: "PAYMENT" as const, data: p })),
    ];

    rawStream.sort(
      (a, b) =>
        new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime()
    );

    let totalBilled = 0;
    let totalPaid = 0;

    const timeline: LedgerTimelineEntry[] = [];

    // 1. Initial Opening Balance entry
    timeline.push({
      id: `open-${retailer.id}`,
      date: retailer.createdAt,
      type: "OPENING_BALANCE",
      referenceNumber: "প্রারম্ভিক জের",
      description: "সফটওয়্যারে শুরুর পূর্বের বাকি / বকেয়া জের",
      debit: openingBalance,
      credit: 0,
      runningBalance: openingBalance,
    });

    // 2. Chronological entries
    for (const item of rawStream) {
      if (item.type === "INVOICE") {
        const inv = item.data;
        const billAmount = roundCurrency(Number(inv.totalAmount));
        totalBilled += billAmount;
        runningBalance = roundCurrency(runningBalance + billAmount);

        timeline.push({
          id: inv.id,
          date: inv.createdAt,
          type: "INVOICE",
          referenceNumber: inv.invoiceNumber,
          description: `চালান বিক্রি (বিল)`,
          debit: billAmount,
          credit: 0,
          runningBalance,
        });
      } else {
        const p = item.data;
        const payAmount = roundCurrency(Number(p.amount));
        totalPaid += payAmount;
        runningBalance = roundCurrency(runningBalance - payAmount);

        timeline.push({
          id: p.id,
          date: p.createdAt,
          type: "PAYMENT",
          referenceNumber: p.mrNumber,
          description: `টাকা জমা (${p.paymentMethod})${p.notes ? ` - ${p.notes}` : ""}`,
          debit: 0,
          credit: payAmount,
          runningBalance,
          method: p.paymentMethod,
        });
      }
    }

    totalBilled = roundCurrency(totalBilled);
    totalPaid = roundCurrency(totalPaid);

    return {
      success: true,
      retailer: {
        id: retailer.id,
        shopName: retailer.shopName,
        ownerName: retailer.ownerName,
        phone: retailer.phone,
        address: retailer.address,
        creditLimit: Number(retailer.creditLimit),
        openingBalance,
        currentDue: Number(retailer.currentDue),
        beatName: retailer.beat?.name || null,
      },
      summary: {
        openingBalance,
        totalBilled,
        totalPaid,
        currentDue: Number(retailer.currentDue),
        invoicesCount: retailer.invoices.length,
        paymentsCount: retailer.payments.length,
      },
      timeline,
    };
  } catch (err: any) {
    console.error("getRetailerStatementAction Error:", err);
    return {
      success: false,
      error: err.message || "দোকানের লেজার বিবরণী লোড করতে সমস্যা হয়েছে।",
    };
  }
}
