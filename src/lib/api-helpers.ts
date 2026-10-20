import { NextResponse } from "next/server";

export const errorResponse = (message: string, code: number) =>
  NextResponse.json({ error: true, message }, { status: code });
