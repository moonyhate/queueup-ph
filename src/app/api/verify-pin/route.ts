import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const correctPin = process.env.ORGANIZER_PIN;

  if (!correctPin) {
    return NextResponse.json(
      { ok: false, error: "ORGANIZER_PIN is not set on the server." },
      { status: 500 }
    );
  }

  const ok = typeof pin === "string" && pin.trim() === correctPin.trim();
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
