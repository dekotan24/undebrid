import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ad-apikey", apiKey, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("ad-apikey");
  return res;
}
