import { createEnv } from "@t3-oss/env-nextjs";

export const clientEnv = createEnv({
  client: {},
  emptyStringAsUndefined: true,
  runtimeEnv: {},
});
