"use server";

import { auth } from "@distribo/auth";
import { prisma } from "@distribo/db";
import { getCurrentSession } from "@/lib/actions/auth-actions";
import { requireTenantOwner, AuthorizationError } from "@distribo/auth";
import { revalidatePath } from "next/cache";

export type StaffRole = "MANAGER" | "SR";

export interface CreateStaffInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: StaffRole;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  distributorRole: string | null;
  createdAt: Date;
  isCurrentUser: boolean;
  invoicesCount: number;
}

export interface StaffListResponse {
  success: boolean;
  error?: string;
  distributorName: string;
  subscriptionPlan: string;
  maxUsers: number;
  staff: StaffMember[];
  metrics: {
    totalUsers: number;
    managerCount: number;
    srCount: number;
    remainingSlots: number;
  };
}

/**
 * Retrieves all staff members belonging to the authenticated Owner's distributor depot.
 * STRICT SECURITY: Only the distributor OWNER can manage staff accounts.
 */
export async function getStaffAction(): Promise<StaffListResponse> {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantOwner(
    session as any
  );

  try {
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        maxUsers: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            distributorRole: true,
            createdAt: true,
            _count: {
              select: {
                invoicesCreated: true,
              },
            },
          },
          orderBy: [
            { distributorRole: "asc" }, // OWNER first, then MANAGER, then SR
            { createdAt: "asc" },
          ],
        },
      },
    });

    if (!distributor) {
      throw new Error("ডিস্ট্রিবিউটর অ্যাকাউন্ট পাওয়া যায়নি।");
    }

    let managerCount = 0;
    let srCount = 0;

    const staff: StaffMember[] = distributor.users.map((u) => {
      if (u.distributorRole === "MANAGER") managerCount++;
      if (u.distributorRole === "SR") srCount++;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        distributorRole: u.distributorRole,
        createdAt: u.createdAt,
        isCurrentUser: u.id === sessionUser.id,
        invoicesCount: u._count.invoicesCreated,
      };
    });

    const totalUsers = staff.length;
    const remainingSlots = Math.max(0, distributor.maxUsers - totalUsers);

    return {
      success: true,
      distributorName: distributor.name,
      subscriptionPlan: distributor.subscriptionPlan,
      maxUsers: distributor.maxUsers,
      staff,
      metrics: {
        totalUsers,
        managerCount,
        srCount,
        remainingSlots,
      },
    };
  } catch (err: any) {
    console.error("getStaffAction Error:", err);
    return {
      success: false,
      error: err.message || "স্টাফ তালিকা লোড করতে সমস্যা হয়েছে।",
      distributorName: "",
      subscriptionPlan: "STARTER",
      maxUsers: 5,
      staff: [],
      metrics: {
        totalUsers: 0,
        managerCount: 0,
        srCount: 0,
        remainingSlots: 0,
      },
    };
  }
}

/**
 * Creates an employee login account (MANAGER or SR) tied exclusively to the Owner's business.
 * STRICT SECURITY:
 * 1. Only OWNER can create employee accounts.
 * 2. Only "MANAGER" and "SR" roles can be assigned.
 * 3. Never grants "SUPER_ADMIN" or "OWNER" privileges.
 * 4. Strictly checks subscription plan maxUsers quota.
 */
export async function createStaffAction(input: CreateStaffInput) {
  const session = await getCurrentSession();
  const { distributorId } = requireTenantOwner(session as any);

  // Validate Role
  if (input.role !== "MANAGER" && input.role !== "SR") {
    return {
      success: false,
      error: "শুধুমাত্র ম্যানেজার (MANAGER) বা এসআর (SR) পদবী তৈরি করা যাবে।",
    };
  }

  // Validate Fields
  if (!input.name?.trim()) {
    return { success: false, error: "কর্মীর নাম আবশ্যক (Name is required)" };
  }
  if (!input.phone?.trim()) {
    return { success: false, error: "মোবাইল নম্বর আবশ্যক (Phone is required)" };
  }
  if (!input.email?.trim() || !input.email.includes("@")) {
    return { success: false, error: "সঠিক ইমেইল এড্রেস প্রদান করুন (Valid email is required)" };
  }
  if (!input.password || input.password.length < 8) {
    return {
      success: false,
      error: "পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে (Password must be at least 8 characters)",
    };
  }

  const cleanEmail = input.email.toLowerCase().trim();

  try {
    // 1. Check if email already registered across platform
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return {
        success: false,
        error: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য ইমেইল ব্যবহার করুন।",
      };
    }

    // 2. Check distributor maxUsers subscription limit
    const distributor = await prisma.distributor.findUnique({
      where: { id: distributorId },
      select: {
        maxUsers: true,
        _count: { select: { users: true } },
      },
    });

    if (!distributor) {
      return { success: false, error: "ডিস্ট্রিবিউটর তথ্য পাওয়া যায়নি।" };
    }

    if (distributor._count.users >= distributor.maxUsers) {
      return {
        success: false,
        error: `আপনার বর্তমান প্ল্যানে সর্বোচ্চ ${distributor.maxUsers} জন ইউজার তৈরি করা সম্ভব। নতুন কর্মী যুক্ত করতে প্ল্যান আপগ্রেড করুন।`,
      };
    }

    // 3. Register credentials account via Better Auth engine
    const authResult = await auth.api.signUpEmail({
      body: {
        email: cleanEmail,
        password: input.password,
        name: input.name.trim(),
      },
    });

    if (!authResult?.user?.id) {
      return {
        success: false,
        error: "কর্মচারী অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।",
      };
    }

    // 4. Bind newly created user to this distributor with target role
    const newUser = await prisma.user.update({
      where: { id: authResult.user.id },
      data: {
        distributorId,
        distributorRole: input.role,
        platformRole: null, // Strict guarantee: no platform permissions
        phone: input.phone.trim(),
      },
    });

    // 5. Invalidate any auto-created sessions for this new employee so they must log in themselves
    await prisma.session.deleteMany({
      where: { userId: authResult.user.id },
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return {
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.distributorRole,
      },
    };
  } catch (err: any) {
    console.error("createStaffAction Error:", err);
    return {
      success: false,
      error: err.message || "কর্মচারী তৈরিতে ত্রুটি হয়েছে।",
    };
  }
}

/**
 * Removes an employee account from the distributor depot.
 * STRICT SECURITY:
 * 1. Owner cannot remove themselves.
 * 2. Cannot remove a user who has recorded invoices or cash closings (protects financial audit trail).
 */
export async function removeStaffAction(targetUserId: string) {
  const session = await getCurrentSession();
  const { distributorId, user: sessionUser } = requireTenantOwner(
    session as any
  );

  if (targetUserId === sessionUser.id) {
    return {
      success: false,
      error: "আপনি নিজের ওনার অ্যাকাউন্ট মুছে ফেলতে পারবেন না।",
    };
  }

  try {
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, distributorId },
      include: {
        _count: {
          select: {
            invoicesCreated: true,
            paymentsCollected: true,
            closingsCompleted: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { success: false, error: "কর্মী খুঁজে পাওয়া যায়নি।" };
    }

    // Check financial audit history
    const totalTransactions =
      targetUser._count.invoicesCreated +
      targetUser._count.paymentsCollected +
      targetUser._count.closingsCompleted;

    if (totalTransactions > 0) {
      return {
        success: false,
        error: `এই কর্মী ইতিমধ্যে ${totalTransactions}টি ইনভয়েস/লেনদেন সম্পন্ন করেছেন। অডিট সুরক্ষার জন্য অ্যাকাউন্ট মুছে ফেলা সম্ভব নয়।`,
      };
    }

    // Revoke all sessions and remove user
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId: targetUserId } });
      await tx.account.deleteMany({ where: { userId: targetUserId } });
      await tx.user.delete({ where: { id: targetUserId } });
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (err: any) {
    console.error("removeStaffAction Error:", err);
    return {
      success: false,
      error: err.message || "কর্মী সরাতে সমস্যা হয়েছে।",
    };
  }
}
