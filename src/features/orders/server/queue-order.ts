import { sql } from "drizzle-orm";
import { OrderTable } from "@/db/schema";

// Keep work in progress first, then sort by rank or order number
export const queuePriority = sql`case when ${OrderTable.status} = 'in_progress' then 0 else 1 end`;
export const queueRank = sql`coalesce(${OrderTable.queueRank}, ${OrderTable.orderNumber})`;
export const queueOrder = sql`${queuePriority}, ${queueRank}, ${OrderTable.queuedAt} nulls last,
  ${OrderTable.createdAt}, ${OrderTable.id}`;
