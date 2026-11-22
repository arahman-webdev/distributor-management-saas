import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { toNextJsHandler } from "better-auth/next-js";
import { prisma } from "@distribo/db";

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "distribo-default-secret-key-minimum-32-chars-long",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      platformRole: {
        type: "string",
        required: false,
        input: false, // Strictly prevented from public input during signup
      },
      distributorRole: {
        type: "string",
        required: false,
        input: false, // Strictly managed by verified server-side invitations & tenant registration
      },
      distributorId: {
        type: "string",
        required: false,
        input: false, // Tenant scoping key
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
});

export const authHandler = toNextJsHandler(auth);
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
export * from "./guards";
