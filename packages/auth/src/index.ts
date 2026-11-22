import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@distribo/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      distributorId: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "MANAGER",
      },
      phone: {
        type: "string",
        required: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
