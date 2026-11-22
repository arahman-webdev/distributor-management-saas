import { prisma } from "@distribo/db";
import { auth } from "./index.ts";

async function bootstrapSuperAdmin() {
  const secret = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;
  if (!secret || secret.length < 16) {
    console.error(
      "\n❌ Security Error: SUPER_ADMIN_BOOTSTRAP_SECRET must be set in environment and be at least 16 characters long.\n"
    );
    process.exit(1);
  }

  const email = process.env.ADMIN_EMAIL || "admin@distribo.app";
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Platform Super Admin";

  if (!password || password.length < 8) {
    console.error(
      "\n❌ Validation Error: ADMIN_PASSWORD must be provided and be at least 8 characters long.\n"
    );
    process.exit(1);
  }

  console.log(`\n🔐 Bootstrapping Platform SUPER_ADMIN for: ${email}...`);

  try {
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user and credentials account via Better Auth
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });

      if (!result || !result.user) {
        throw new Error("Failed to create user via authentication engine");
      }

      user = await prisma.user.update({
        where: { id: result.user.id },
        data: {
          platformRole: "SUPER_ADMIN",
          distributorRole: null,
          distributorId: null,
        },
      });
      console.log("✅ Super Admin user account created successfully.");
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          platformRole: "SUPER_ADMIN",
          distributorRole: null,
          distributorId: null,
        },
      });
      console.log("✅ Existing user elevated to Platform SUPER_ADMIN.");
    }

    // Record immutable audit log
    await prisma.platformAuditLog.create({
      data: {
        userId: user.id,
        action: "SUPER_ADMIN_BOOTSTRAPPED",
        targetType: "USER",
        targetId: user.id,
        details: {
          email: user.email,
          timestamp: new Date().toISOString(),
          mechanism: "SECURE_CLI_BOOTSTRAP",
        },
      },
    });

    console.log(`\n🎉 Platform SUPER_ADMIN ready:`);
    console.log(`   ID:            ${user.id}`);
    console.log(`   Email:         ${user.email}`);
    console.log(`   Platform Role: ${user.platformRole}`);
    console.log(`   Audit Log:     Recorded\n`);
  } catch (error: any) {
    console.error("❌ Failed to bootstrap Super Admin:", error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

bootstrapSuperAdmin();
