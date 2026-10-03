import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type SessionRole = "member" | "admin" | "superadmin";
export type SessionPayload = { userId: string; role: SessionRole; name: string; memberId?: string };

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "development-secret-change-this-please");

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySessionToken(token?: string | null): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get("prisma_session")?.value);
}
