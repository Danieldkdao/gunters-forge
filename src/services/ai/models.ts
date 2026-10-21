import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@/data/env/server";

export const openrouter = createOpenRouter({
  apiKey: serverEnv.OPENROUTER_API_KEY,
});

export const forgePlannerModel = openrouter(serverEnv.OPENROUTER_MODEL);
