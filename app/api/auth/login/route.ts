import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Member } from "@/models/Member";
import { createSessionToken } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { identifier, password, portal } = await req.json();
    if (!identifier || !password) return NextResponse.json({ message: "Identitas dan kata sandi wajib diisi." }, { status: 400 });
    await connectMongoDB();
    const query = portal === "member" ? { nik: String(identifier).trim() } : { email: String(identifier).toLowerCase().trim() };
    const user = await User.findOne(query);
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: "Identitas atau kata sandi tidak sesuai." }, { status: 401 });
    }
    if (portal === "member" && user.role !== "member") return NextResponse.json({ message: "Gunakan portal pengurus." }, { status: 403 });
    if (portal === "admin" && !["admin","superadmin"].includes(user.role)) return NextResponse.json({ message: "Akun tidak memiliki akses pengurus." }, { status: 403 });
    if(user.role==='member'&&!(await Member.exists({_id:user.memberId,status:'active'})))return NextResponse.json({message:"Akun anggota belum aktif. Pendaftaran harus disetujui pengurus sebelum dapat login."},{status:403});
    user.lastLogin = new Date(); await user.save();
    const token = await createSessionToken({ userId: user._id.toString(), role: user.role, name: user.name, memberId: user.memberId?.toString() });
    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set("prisma_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
    await writeAudit({ actorId: user._id.toString(), action: "LOGIN", entity: "User", entityId: user._id.toString() });
    return res;
  } catch (e) {
    console.error(e); return NextResponse.json({ message: "Gagal login." }, { status: 500 });
  }
}
