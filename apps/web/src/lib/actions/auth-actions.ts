"use server";

import { auth } from "@distribo/auth";
import { prisma } from "@distribo/db";
import { headers } from "next/headers";

export interface RegisterDistributorInput {
  distributorName: string;
  ownerName: string;
  phone: string;
  address: string;
  email: string;
  password: string;
}

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectUrl?: string;
}

/**
 * Registers a new independent distributor business on the platform.
 * Automatically assigns the creator the OWNER role for their new business.
 * Strictly prevents platformRole assignment.
 */
export async function registerDistributorAction(
  input: RegisterDistributorInput
): Promise<AuthActionResult> {
  const { distributorName, ownerName, phone, address, email, password } = input;

  if (!distributorName?.trim() || !ownerName?.trim() || !email?.trim() || !password) {
    return { success: false, error: "সকল প্রয়োজনীয় তথ্য পূরণ করুন (All fields are required)" };
  }

  if (password.length < 8) {
    return { success: false, error: "পাসওয়ার্ড ন্যূনতম ৮ অক্ষরের হতে হবে (Password must be at least 8 characters)" };
  }

  try {
    // 1. Check if email already registered
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return { success: false, error: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে (Email already registered)" };
    }

    // 2. Create the Distributor tenant
    const distributor = await prisma.distributor.create({
      data: {
        name: distributorName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        status: "ACTIVE",
        subscriptionPlan: "STARTER",
      },
    });

    // 3. Register user through Better Auth credential engine
    const authResult = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: ownerName.trim(),
      },
    });

    if (!authResult?.user?.id) {
      // Rollback distributor if user creation fails
      await prisma.distributor.delete({ where: { id: distributor.id } });
      return { success: false, error: "অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে (Failed to create account)" };
    }

    // 4. Bind user exclusively as OWNER of this distributor; force platformRole to null
    await prisma.user.update({
      where: { id: authResult.user.id },
      data: {
        distributorId: distributor.id,
        distributorRole: "OWNER",
        platformRole: null, // Strict security guarantee
        phone: phone.trim(),
      },
    });

    return {
      success: true,
      redirectUrl: "/dashboard",
    };
  } catch (err: any) {
    console.error("Distributor Registration Error:", err);
    return {
      success: false,
      error: err.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে (Registration failed)",
    };
  }
}

/**
 * Validates user credentials and directs to the appropriate portal (Platform Admin vs. Distributor Depot).
 */
export async function getCurrentSession() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  return session;
}
