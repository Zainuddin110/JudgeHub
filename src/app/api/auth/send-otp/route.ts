import { NextRequest, NextResponse } from "next/server";
import { sendOtpSchema } from "@/schemas";
import { sendOtp } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid email", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await sendOtp(parsed.data.email);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
