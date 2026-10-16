import { serverEnv } from "@/data/env/server";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const client = new Pool({
  connectionString: serverEnv.DATABASE_URL,
});

export const db = drizzle({
  client,
  schema,
});

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
