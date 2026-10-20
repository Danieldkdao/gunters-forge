"use server";

import { serverEnv } from "@/data/env/server";
import { UserRole } from "@/db/shared";
import { GENERAL_ERROR_MESSAGE } from "../constants";
import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Allow for easy access and testing with test accounts, credentials stay on the server
export const signInWithTestCredentials = async (role: UserRole) => {
  const credentialMap: Record<UserRole, { email: string; password: string }> = {
    admin: {
      email: serverEnv.TEST_ADMIN_EMAIL,
      password: serverEnv.TEST_ADMIN_PASSWORD,
    },
    user: {
      email: serverEnv.TEST_CUSTOMER_EMAIL,
      password: serverEnv.TEST_CUSTOMER_PASSWORD,
    },
  };

  const credentials = credentialMap[role];
  if (!credentials) {
    return {
      error: true as const,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  const data = await auth.api.signInEmail({
    body: {
      ...credentials,
      callbackURL: role === "admin" ? "/dashboard" : "/",
    },
    headers: await headers(),
  });

  if (data.redirect && data.url) {
    return redirect(data.url);
  }
  return {
    error: false as const,
    message: "Signed in successfully!",
    userId: data.user.id,
  };
};
