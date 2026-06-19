import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const AD_BASE = "https://api.alldebrid.com/v4.1";

function getApiKey(req: NextRequest): string {
  const fromHeader = req.headers.get("x-ad-apikey");
  if (fromHeader) return fromHeader;
  const fromCookie = req.cookies.get("ad-apikey")?.value;
  if (fromCookie) return fromCookie;
  const fromQuery = req.nextUrl.searchParams.get("_apikey");
  if (fromQuery) return fromQuery;
  return "";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", error: { code: "NO_API_KEY", message: "API key not configured" } },
      { status: 401 },
    );
  }

  const adPath = "/" + path.join("/");
  const url = new URL(AD_BASE + adPath);

  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "_apikey") {
      url.searchParams.append(key, value);
    }
  });

  url.searchParams.set("agent", "undebrid/1.0");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { status: "error", error: { code: "PROXY_ERROR", message: String(e) } },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { status: "error", error: { code: "NO_API_KEY", message: "API key not configured" } },
      { status: 401 },
    );
  }

  const adPath = "/" + path.join("/");
  const url = new URL(AD_BASE + adPath);
  url.searchParams.set("agent", "undebrid/1.0");

  const contentType = req.headers.get("content-type") || "";

  try {
    let res: Response;
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      res = await fetch(url.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });
    } else {
      req.nextUrl.searchParams.forEach((value, key) => {
        if (key !== "_apikey") {
          url.searchParams.append(key, value);
        }
      });
      res = await fetch(url.toString(), {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { status: "error", error: { code: "PROXY_ERROR", message: String(e) } },
      { status: 502 },
    );
  }
}
