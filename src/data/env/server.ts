import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.url().min(1),
    BETTER_AUTH_URL: z.url().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    MAILJET_API_KEY: z.string().min(1),
    MAILJET_API_SECRET: z.string().min(1),
    SENDER_EMAIL: z.email().min(1),
    TEST_ADMIN_EMAIL: z.email().min(1),
    TEST_ADMIN_PASSWORD: z.string().min(8),
    TEST_CUSTOMER_EMAIL: z.email().min(1),
    TEST_CUSTOMER_PASSWORD: z.string().min(8),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    APP_URL: z.url().min(1),
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: process.env,
});
