import { db } from "@/db/db";
import { auth } from "./auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";
import { Permissions } from "./permissions";

// Resolve the current session and fetch user to maintain role typing
export const getCurrentUser = async (otherHeaders?: Headers) => {
  const session = await auth.api.getSession({
    headers: otherHeaders ?? (await headers()),
  });

  return {
    userId: session?.user.id ?? null,
    user: session?.user
      ? ((await db.query.user.findFirst({
          where: eq(user.id, session.user.id),
        })) ?? null)
      : null,
    session: session?.session ?? null,
  };
};

export const userHasPermission = async (
  permissions: Permissions,
  options: { headers?: Headers } = {},
) => {
  const { userId, user } = await getCurrentUser(options.headers);
  if (!userId || !user)
    return {
      hasPermission: false,
      user: null,
    };

  const { success } = await auth.api.userHasPermission({
    body: {
      userId,
      role: user.role,
      permissions,
    },
    headers: options.headers && (await headers()),
  });

  return {
    hasPermission: success,
    user,
  };
};
