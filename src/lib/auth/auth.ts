import { serverEnv } from "@/data/env/server";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins/email-otp";
import { admin } from "better-auth/plugins/admin";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/db";
import { sendVerificationOtp } from "@/services/mailjet/emails/verification-emails";

export const auth = betterAuth({
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
    sendOnSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP(data) {
        await sendVerificationOtp(data);
      },
    }),
    admin(),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
});

export type User = typeof auth.$Infer.Session.user;
