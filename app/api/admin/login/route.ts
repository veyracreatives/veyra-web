import { NextResponse } from "next/server";
import {
  checkCredentials,
  loginThrottled,
  recordFailedAttempt,
  clearAttempts,
  startSession,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const throttle = loginThrottled();
  if (throttle.blocked) {
    return NextResponse.json(
      { ok: false, error: `Too many attempts. Try again in ${throttle.retryInMinutes} minute(s).` },
      { status: 429 }
    );
  }

  let user = "";
  let password = "";
  try {
    const body = await request.json();
    user = typeof body?.user === "string" ? body.user : "";
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  if (!user || !password) {
    return NextResponse.json({ ok: false, error: "Enter both the ID and the password." }, { status: 400 });
  }

  if (!checkCredentials(user, password)) {
    recordFailedAttempt();
    return NextResponse.json({ ok: false, error: "Incorrect ID or password." }, { status: 401 });
  }

  clearAttempts();
  await startSession();
  return NextResponse.json({ ok: true });
}
