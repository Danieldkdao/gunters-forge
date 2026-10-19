import z from "zod";
import { parseISO } from "date-fns";
import { isValidDate } from "./utils";

export const isoTimestampSchema = z.iso
  .datetime({ offset: true })
  .transform((val, ctx) => {
    const parsedDate = parseISO(val);
    if (isValidDate(parsedDate)) return parsedDate;

    ctx.addIssue({
      code: "custom",
      message: "Invalid timestamp.",
    });

    return z.NEVER;
  });

// Validate and parse the cursor depending on the schema passed in
export const createCursorPaginationSchema = <T extends z.ZodObject>(
  schema: T,
) =>
  z
    .base64url()
    .nullable()
    .transform((val, ctx) => {
      if (val === null) return null;
      try {
        const decodedString = Buffer.from(val, "base64url").toString("utf-8");

        const parsedJson = JSON.parse(decodedString);

        return schema.parse(parsedJson);
      } catch (error) {
        console.error(error);
        ctx.addIssue({
          code: "custom",
          message: "Invalid cursor.",
        });
        return z.NEVER;
      }
    });
