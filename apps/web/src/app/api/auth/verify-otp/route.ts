import { NextRequest, NextResponse } from "next/server";
import { verifyOtpSchema } from "@judgehub/schemas";
import { verifyOtp } from "@/lib/auth";
import { createSessionToken, getSessionCookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: "VALIDATION_ERROR", message: "Invalid verification input", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const sessionPayload = await verifyOtp(parsed.data.email, parsed.data.code, { ip, userAgent });

    if (!sessionPayload) {
      return NextResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid or expired passcode" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(sessionPayload);
    const response = NextResponse.json({ success: true, user: sessionPayload });

    const cookieOpts = getSessionCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ code: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
