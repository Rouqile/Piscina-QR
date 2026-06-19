import { NextRequest, NextResponse } from "next/server";

const FORBIDDEN_REQ_HEADERS = [
  "host",
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
];

export async function GET(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return proxy(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return proxy(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return proxy(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { route: string[] } }
) {
  return proxy(request);
}

async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api/v1", "");
  const query = request.nextUrl.search;
  const backendUrl = `http://backend:8001/api/v1${path}${query}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!FORBIDDEN_REQ_HEADERS.includes(lower)) {
      headers.set(key, value);
    }
  });

  const body = ["POST", "PUT", "PATCH"].includes(request.method)
    ? await request.blob()
    : undefined;

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    body: body || null,
  });

  const resHeaders = new Headers();
  response.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower !== "content-encoding" && lower !== "transfer-encoding") {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: resHeaders,
  });
}
