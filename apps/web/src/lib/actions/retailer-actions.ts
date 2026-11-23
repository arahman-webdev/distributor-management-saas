"use server";

import { getCurrentSession } from "@/lib/actions/auth-actions";
import { prisma } from "@distribo/db";
import { requireTenantAccess, AuthorizationError } from "@distribo/auth";
import {
  roundCurrency,
  isValidBdPhone,
  formatBdPhone,
  calculateCreditUtilization,
} from "@/lib/calculations";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------
// TYPES & INTERFACES
// -------------------------------------------------------------

export interface RetailerFilterParams {
  search?: string;
  beatId?: string;
  srId?: string;
  status?: "all" | "active" | "inactive";
}

export interface CreateRetailerInput {
  shopName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  beatId?: string | null;
  assignedSrId?: string | null;
  creditLimit?: number;
  openingBalance?: number;
}

export interface UpdateRetailerInput {
  shopName: string;
  ownerName?: string;
  phone: string;
  address?: string;
  beatId?: string | null;
  assignedSrId?: string | null;
  creditLimit?: number;
  isActive?: boolean;
}

export interface SanitizedRetailer {
  id: string;
  distributorId: string;
  shopName: string;
  ownerName: string | null;
  phone: string;
  address: string | null;
  creditLimit: number;
  openingBalance: number;
  currentDue: number;
  isActive: boolean;
  creditUtilization: number;
  beat: {
    id: string;
    name: string;
    dayOfWeek: string | null;
  } | null;
  assignedSr: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  invoicesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetailerDirectoryResponse {
  success: boolean;
  error?: string;
  role: string;
  retailers: SanitizedRetailer[];
  metrics: {
    totalRetailers: number;
    activeRetailers: number;
    totalMarketDue: number;
    totalCreditLimit: number;
    creditUtilization: number;
  };
}

export interface BeatItem {
  id: string;
  name: string;
  dayOfWeek: string | null;
  description: string | null;
  assignedSrId: string | null;
  assignedSr: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  retailersCount: number;
  totalDue: number;
  createdAt: Date;
}

export interface CreateBeatInput {
  name: string;
  dayOfWeek?: string;
  description?: string;
  assignedSrId?: string | null;
}

export interface UpdateBeatInput {
  name: string;
  dayOfWeek?: string;
  description?: string;
  assignedSrId?: string | null;
}

export interface StaffSROption {
  id: string;
  name: string;
  phone: string | null;
  distributorRole: string;
}

// -------------------------------------------------------------
// RETAILER SERVER ACTIONS
// -------------------------------------------------------------

/**
 * Fetch retailers for the tenant.
 * SECURITY: If authenticated user is an SR, strictly filter to retailers
 * where assignedSrId === sessionUser.id OR beat.assignedSrId === sessionUser.id.
 */
export async function getRetailersAction(
  filters?: RetailerFilterParams
): Promise<RetailerDirectoryResponse> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole || "SR";
  const isSR = role === "SR";

  try {
    const where: any = {
      distributorId,
    };

    // Role-based scope enforcement: SR sees only assigned shops/routes
    if (isSR) {
      where.OR = [
        { assignedSrId: sessionUser.id },
        { beat: { assignedSrId: sessionUser.id } },
      ];
    } else {
      // Owner/Manager can filter by SR
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

    // Filter by Active/Inactive
    if (filters?.status === "active") {
      where.isActive = true;
    } else if (filters?.status === "inactive") {
      where.isActive = false;
    }

    // Search query
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      const searchCondition = [
        { shopName: { contains: q, mode: "insensitive" } },
        { ownerName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchCondition },
        ];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    const [retailers, allDistributorRetailers] = await Promise.all([
      prisma.retailer.findMany({
        where,
        include: {
          beat: {
            select: {
              id: true,
              name: true,
              dayOfWeek: true,
            },
          },
          assignedSr: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              invoices: true,
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { shopName: "asc" }],
      }),
      // Query to compute overall metrics
      prisma.retailer.findMany({
        where: isSR ? where : { distributorId },
        select: {
          isActive: true,
          currentDue: true,
          creditLimit: true,
        },
      }),
    ]);

    let totalMarketDue = 0;
    let totalCreditLimit = 0;
    let activeRetailers = 0;

    for (const r of allDistributorRetailers) {
      if (r.isActive) activeRetailers++;
      totalMarketDue += Number(r.currentDue || 0);
      totalCreditLimit += Number(r.creditLimit || 0);
    }

    totalMarketDue = roundCurrency(totalMarketDue);
    totalCreditLimit = roundCurrency(totalCreditLimit);
    const creditUtilization = calculateCreditUtilization(
      totalMarketDue,
      totalCreditLimit
    );

    const sanitizedRetailers: SanitizedRetailer[] = retailers.map((r) => {
      const curDue = Number(r.currentDue || 0);
      const credLim = Number(r.creditLimit || 0);
      return {
        id: r.id,
        distributorId: r.distributorId,
        shopName: r.shopName,
        ownerName: r.ownerName,
        phone: r.phone,
        address: r.address,
        creditLimit: credLim,
        openingBalance: Number(r.openingBalance || 0),
        currentDue: curDue,
        isActive: r.isActive,
        creditUtilization: calculateCreditUtilization(curDue, credLim),
        beat: r.beat,
        assignedSr: r.assignedSr,
        invoicesCount: r._count.invoices,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      success: true,
      role,
      retailers: sanitizedRetailers,
      metrics: {
        totalRetailers: allDistributorRetailers.length,
        activeRetailers,
        totalMarketDue,
        totalCreditLimit,
        creditUtilization,
      },
    };
  } catch (err: any) {
    console.error("getRetailersAction Error:", err);
    return {
      success: false,
      error: err.message || "দোকানদার তালিকা লোড করতে সমস্যা হয়েছে।",
      role,
      retailers: [],
      metrics: {
        totalRetailers: 0,
        activeRetailers: 0,
        totalMarketDue: 0,
        totalCreditLimit: 0,
        creditUtilization: 0,
      },
    };
  }
}

/**
 * Creates a new retailer (Dokan).
 * OWNER and MANAGER only.
 */
export async function createRetailerAction(input: CreateRetailerInput) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole;
  if (role !== "OWNER" && role !== "MANAGER") {
    return {
      success: false,
      error: "নতুন দোকানদার যুক্ত করার অনুমতি শুধুমাত্র ওনার এবং ম্যানেজারের রয়েছে।",
    };
  }

  // Input Validation
  if (!input.shopName?.trim()) {
    return { success: false, error: "দোকানের নাম আবশ্যক (Shop name is required)" };
  }

  const rawPhone = input.phone?.trim() || "";
  if (!isValidBdPhone(rawPhone)) {
    return {
      success: false,
      error:
        "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678, 018..., 019...)",
    };
  }
  const cleanPhone = formatBdPhone(rawPhone);

  // Check phone uniqueness within tenant
  const existing = await prisma.retailer.findFirst({
    where: {
      distributorId,
      phone: cleanPhone,
    },
  });

  if (existing) {
    return {
      success: false,
      error: `এই মোবাইল নম্বরে ইতিমধ্যে একটি দোকান রয়েছে: "${existing.shopName}"`,
    };
  }

  // Validate Beat if provided
  if (input.beatId) {
    const beat = await prisma.beat.findFirst({
      where: { id: input.beatId, distributorId },
    });
    if (!beat) {
      return { success: false, error: "নির্বাচিত রুট/বিট পাওয়া যায়নি।" };
    }
  }

  // Validate Assigned SR if provided
  if (input.assignedSrId) {
    const sr = await prisma.user.findFirst({
      where: {
        id: input.assignedSrId,
        distributorId,
        distributorRole: { in: ["SR", "MANAGER"] },
      },
    });
    if (!sr) {
      return { success: false, error: "নির্বাচিত সেলস রিপ্রেজেন্টেটিভ (SR) পাওয়া যায়নি।" };
    }
  }

  const safeOpeningBalance = Math.max(
    0,
    roundCurrency(Number(input.openingBalance) || 0)
  );
  const safeCreditLimit = Math.max(
    0,
    roundCurrency(Number(input.creditLimit) || 0)
  );

  try {
    const retailer = await prisma.retailer.create({
      data: {
        distributorId,
        shopName: input.shopName.trim(),
        ownerName: input.ownerName?.trim() || null,
        phone: cleanPhone,
        address: input.address?.trim() || null,
        beatId: input.beatId || null,
        assignedSrId: input.assignedSrId || null,
        creditLimit: safeCreditLimit,
        openingBalance: safeOpeningBalance,
        currentDue: safeOpeningBalance,
        isActive: true,
      },
      include: {
        beat: { select: { id: true, name: true } },
        assignedSr: { select: { id: true, name: true } },
      },
    });

    revalidatePath("/retailers");
    revalidatePath("/khata");
    revalidatePath("/dashboard");

    return {
      success: true,
      retailerId: retailer.id,
      shopName: retailer.shopName,
    };
  } catch (err: any) {
    console.error("createRetailerAction Error:", err);
    return {
      success: false,
      error: err.message || "দোকানদার সংরক্ষণ করতে ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Updates an existing retailer.
 * OWNER and MANAGER only.
 */
export async function updateRetailerAction(
  id: string,
  input: UpdateRetailerInput
) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole;
  if (role !== "OWNER" && role !== "MANAGER") {
    return {
      success: false,
      error: "দোকানদার তথ্য পরিবর্তনের অনুমতি শুধুমাত্র ওনার এবং ম্যানেজারের রয়েছে।",
    };
  }

  if (!input.shopName?.trim()) {
    return { success: false, error: "দোকানের নাম আবশ্যক (Shop name is required)" };
  }

  const rawPhone = input.phone?.trim() || "";
  if (!isValidBdPhone(rawPhone)) {
    return {
      success: false,
      error:
        "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678, 018..., 019...)",
    };
  }
  const cleanPhone = formatBdPhone(rawPhone);

  try {
    // Verify retailer belongs to distributor
    const current = await prisma.retailer.findFirst({
      where: { id, distributorId },
    });

    if (!current) {
      return { success: false, error: "দোকানদার পাওয়া যায়নি।" };
    }

    // Check duplicate phone if phone changed
    if (current.phone !== cleanPhone) {
      const duplicate = await prisma.retailer.findFirst({
        where: {
          distributorId,
          phone: cleanPhone,
          id: { not: id },
        },
      });
      if (duplicate) {
        return {
          success: false,
          error: `এই মোবাইল নম্বরে ইতিমধ্যে একটি দোকান রয়েছে: "${duplicate.shopName}"`,
        };
      }
    }

    // Validate Beat if provided
    if (input.beatId) {
      const beat = await prisma.beat.findFirst({
        where: { id: input.beatId, distributorId },
      });
      if (!beat) {
        return { success: false, error: "নির্বাচিত রুট/বিট পাওয়া যায়নি।" };
      }
    }

    // Validate Assigned SR if provided
    if (input.assignedSrId) {
      const sr = await prisma.user.findFirst({
        where: {
          id: input.assignedSrId,
          distributorId,
          distributorRole: { in: ["SR", "MANAGER"] },
        },
      });
      if (!sr) {
        return { success: false, error: "নির্বাচিত সেলস রিপ্রেজেন্টেটিভ (SR) পাওয়া যায়নি।" };
      }
    }

    const safeCreditLimit =
      input.creditLimit !== undefined
        ? Math.max(0, roundCurrency(Number(input.creditLimit) || 0))
        : undefined;

    await prisma.retailer.update({
      where: { id },
      data: {
        shopName: input.shopName.trim(),
        ownerName: input.ownerName?.trim() || null,
        phone: cleanPhone,
        address: input.address?.trim() || null,
        beatId: input.beatId === undefined ? undefined : input.beatId || null,
        assignedSrId:
          input.assignedSrId === undefined ? undefined : input.assignedSrId || null,
        creditLimit: safeCreditLimit,
        isActive: input.isActive !== undefined ? input.isActive : undefined,
      },
    });

    revalidatePath("/retailers");
    revalidatePath("/khata");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("updateRetailerAction Error:", err);
    return {
      success: false,
      error: err.message || "দোকানদার তথ্য আপডেট করতে ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Toggles retailer active / inactive status.
 */
export async function toggleRetailerStatusAction(id: string) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole;
  if (role !== "OWNER" && role !== "MANAGER") {
    return {
      success: false,
      error: "দোকানের অবস্থা পরিবর্তনের অনুমতি আপনার নেই।",
    };
  }

  try {
    const retailer = await prisma.retailer.findFirst({
      where: { id, distributorId },
      select: { id: true, isActive: true },
    });

    if (!retailer) {
      return { success: false, error: "দোকানদার পাওয়া যায়নি।" };
    }

    await prisma.retailer.update({
      where: { id },
      data: { isActive: !retailer.isActive },
    });

    revalidatePath("/retailers");
    return { success: true, isActive: !retailer.isActive };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।",
    };
  }
}

// -------------------------------------------------------------
// BEATS / ROUTES SERVER ACTIONS
// -------------------------------------------------------------

/**
 * Retrieves all delivery beats/routes with retailer count and assigned SR.
 */
export async function getBeatsAction(): Promise<{
  success: boolean;
  error?: string;
  beats: BeatItem[];
}> {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantAccess(session as any);

  try {
    const beats = await prisma.beat.findMany({
      where: { distributorId },
      include: {
        assignedSr: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        retailers: {
          select: {
            id: true,
            currentDue: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const beatItems: BeatItem[] = beats.map((b) => {
      let totalDue = 0;
      for (const r of b.retailers) {
        totalDue += Number(r.currentDue || 0);
      }
      return {
        id: b.id,
        name: b.name,
        dayOfWeek: b.dayOfWeek,
        description: b.description,
        assignedSrId: b.assignedSrId,
        assignedSr: b.assignedSr,
        retailersCount: b.retailers.length,
        totalDue: roundCurrency(totalDue),
        createdAt: b.createdAt,
      };
    });

    return { success: true, beats: beatItems };
  } catch (err: any) {
    console.error("getBeatsAction Error:", err);
    return {
      success: false,
      error: err.message || "রুট তালিকা লোড করতে সমস্যা হয়েছে।",
      beats: [],
    };
  }
}

/**
 * Creates a new delivery beat / route.
 * OWNER and MANAGER only.
 */
export async function createBeatAction(input: CreateBeatInput) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole;
  if (role !== "OWNER" && role !== "MANAGER") {
    return {
      success: false,
      error: "নতুন রুট তৈরির অনুমতি শুধুমাত্র ওনার এবং ম্যানেজারের রয়েছে।",
    };
  }

  if (!input.name?.trim()) {
    return { success: false, error: "রুটের নাম আবশ্যক (Beat name is required)" };
  }

  // Check unique beat name
  const existing = await prisma.beat.findFirst({
    where: {
      distributorId,
      name: { equals: input.name.trim(), mode: "insensitive" },
    },
  });

  if (existing) {
    return {
      success: false,
      error: `"${input.name}" নামে একটি রুট ইতিমধ্যে রয়েছে।`,
    };
  }

  // Validate SR if provided
  if (input.assignedSrId) {
    const sr = await prisma.user.findFirst({
      where: {
        id: input.assignedSrId,
        distributorId,
        distributorRole: { in: ["SR", "MANAGER"] },
      },
    });
    if (!sr) {
      return { success: false, error: "নির্বাচিত সেলস রিপ্রেজেন্টেটিভ (SR) পাওয়া যায়নি।" };
    }
  }

  try {
    const beat = await prisma.beat.create({
      data: {
        distributorId,
        name: input.name.trim(),
        dayOfWeek: input.dayOfWeek?.trim() || null,
        description: input.description?.trim() || null,
        assignedSrId: input.assignedSrId || null,
      },
    });

    revalidatePath("/retailers");
    return { success: true, beatId: beat.id };
  } catch (err: any) {
    console.error("createBeatAction Error:", err);
    return {
      success: false,
      error: err.message || "রুট তৈরি করতে ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Updates an existing beat / route.
 */
export async function updateBeatAction(id: string, input: UpdateBeatInput) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantAccess(
    session as any
  );

  const role = sessionUser.distributorRole;
  if (role !== "OWNER" && role !== "MANAGER") {
    return {
      success: false,
      error: "রুট তথ্য পরিবর্তনের অনুমতি শুধুমাত্র ওনার এবং ম্যানেজারের রয়েছে।",
    };
  }

  if (!input.name?.trim()) {
    return { success: false, error: "রুটের নাম আবশ্যক (Beat name is required)" };
  }

  try {
    const beat = await prisma.beat.findFirst({
      where: { id, distributorId },
    });

    if (!beat) {
      return { success: false, error: "রুট পাওয়া যায়নি।" };
    }

    // Name uniqueness check if changed
    if (beat.name.toLowerCase() !== input.name.trim().toLowerCase()) {
      const duplicate = await prisma.beat.findFirst({
        where: {
          distributorId,
          name: { equals: input.name.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });
      if (duplicate) {
        return {
          success: false,
          error: `"${input.name}" নামে একটি রুট ইতিমধ্যে রয়েছে।`,
        };
      }
    }

    // Validate SR if provided
    if (input.assignedSrId) {
      const sr = await prisma.user.findFirst({
        where: {
          id: input.assignedSrId,
          distributorId,
          distributorRole: { in: ["SR", "MANAGER"] },
        },
      });
      if (!sr) {
        return { success: false, error: "নির্বাচিত সেলস রিপ্রেজেন্টেটিভ (SR) পাওয়া যায়নি।" };
      }
    }

    await prisma.beat.update({
      where: { id },
      data: {
        name: input.name.trim(),
        dayOfWeek: input.dayOfWeek?.trim() || null,
        description: input.description?.trim() || null,
        assignedSrId:
          input.assignedSrId === undefined ? undefined : input.assignedSrId || null,
      },
    });

    revalidatePath("/retailers");
    return { success: true };
  } catch (err: any) {
    console.error("updateBeatAction Error:", err);
    return {
      success: false,
      error: err.message || "রুট তথ্য আপডেট করতে ব্যর্থ হয়েছে।",
    };
  }
}

/**
 * Retrieves SR and Manager staff list for assignment dropdowns.
 */
export async function getStaffSROptionsAction(): Promise<{
  success: boolean;
  staff: StaffSROption[];
}> {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantAccess(session as any);

  try {
    const users = await prisma.user.findMany({
      where: {
        distributorId,
        distributorRole: { in: ["SR", "MANAGER"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        distributorRole: true,
      },
      orderBy: [{ distributorRole: "desc" }, { name: "asc" }],
    });

    return {
      success: true,
      staff: users.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        distributorRole: u.distributorRole || "SR",
      })),
    };
  } catch (err: any) {
    return { success: false, staff: [] };
  }
}
