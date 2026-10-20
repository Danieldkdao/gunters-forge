import { createAuthClient } from "better-auth/client";
import { emailOTPClient, adminClient } from "better-auth/client/plugins";
import { roleOptions } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    emailOTPClient(),
    adminClient({
      ...roleOptions,
    }),
  ],
});
