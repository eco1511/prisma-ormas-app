import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-this-please");
async function readRole(req: NextRequest) {
  const token = req.cookies.get("prisma_session")?.value; if (!token) return null;
  try { const { payload } = await jwtVerify(token, secret); return payload.role as string; } catch { return null; }
}
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl; const role = await readRole(req);
  if (pathname.startsWith("/anggota") && role !== "member") return NextResponse.redirect(new URL("/login/anggota", req.url));
  if (pathname.startsWith("/pengurus") && !["admin","superadmin"].includes(role || "")) return NextResponse.redirect(new URL("/login/pengurus", req.url));
  if (pathname.startsWith("/superadmin") && role !== "superadmin") return NextResponse.redirect(new URL("/login/pengurus", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/anggota/:path*", "/pengurus/:path*", "/superadmin/:path*"] };
