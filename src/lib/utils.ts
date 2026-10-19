import z from "zod";
import { GENERAL_ERROR_MESSAGE } from "./constants";

export { cn } from "cn";

export const isError = (error: unknown): error is Error =>
  error instanceof Error;

export const errorMessage = (error: unknown) =>
  isError(error) ? error.message : GENERAL_ERROR_MESSAGE;

export const generateSlug = (text: string) =>
  text.toLowerCase().replace(/\s+/g, "-");

export const isValidId = (id: string | string[]) => {
  const idSchema = z.uuid();
  if (Array.isArray(id)) {
    return id.length !== 0 && id.every((i) => idSchema.safeParse(i).success);
  }
  return idSchema.safeParse(id).success;
};

export const isValidDate = (date: unknown): date is Date =>
  date instanceof Date && !isNaN(date.getTime());

// Encode cursor data as safe base 64 url strings
export const writeCursor = (data: unknown) => {
  const jsonData = JSON.stringify(data);
  return Buffer.from(jsonData).toString("base64url");
};

// Normalize dates into ISO strings
export const normalizeData = (data: unknown) => {
  if (isValidDate(data)) return data.toISOString();

  return data;
};
