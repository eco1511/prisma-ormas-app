import { validateMembership } from "./membership";
export function validateMemberInput(input: Record<string, unknown>) {
  const text = (key: string, max = 254) => { const value = String(input[key] ?? "").trim(); if(value.length > max) throw Error(key + " terlalu panjang."); return value; };
  const name = text("name",150), nik = text("nik",16), email = text("email").toLowerCase(), phone = text("phone",50), address = text("address",1000);
  if (!name || !nik || !email || !phone || !address) throw Error("Nama, NIK, email, telepon, dan alamat wajib diisi.");
  if (!/^\d{16}$/.test(nik)) throw Error("NIK harus terdiri dari tepat 16 angka.");
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(email)) throw Error("Alamat email tidak valid.");
  const gender = text("gender",20);
  if (!["", "Laki-laki", "Perempuan"].includes(gender)) throw Error("Jenis kelamin tidak valid.");
  const birth = text("birthDate",24);
  let birthDate: Date | null = null;
  if (birth) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) throw Error("Tanggal lahir harus memakai format YYYY-MM-DD.");
    birthDate = new Date(birth + "T00:00:00.000Z");
    if (!Number.isFinite(birthDate.getTime()) || birthDate.toISOString().slice(0,10) !== birth || birth > new Date().toISOString().slice(0,10)) throw Error("Tanggal lahir tidak valid.");
  }
  const membership = validateMembership(Object.fromEntries(["membershipType","branchType","provinceId","cityId","position"].map(key=>[key,text(key,100)])));
  return { name, nik, email, phone, address, gender, birthDate, organizationName: text("organizationName",150) || "PRISMA", ...membership };
}
export function memberFilter(url: URL) {
  const q = (url.searchParams.get("q") || "").slice(0,150).trim();
  const status = url.searchParams.get("status") || "", level = url.searchParams.get("level") || "";
  const filter: Record<string,unknown> = {};
  if(q) { const literal=q.replace(/[.*+?^$\{\}()|[\]\\]/g,"\\$&"); filter.$or=["name","nik","memberNo"].map(key=>({[key]:{$regex:literal,$options:"i"}})); }
  if(status)filter.status=status;
  if(level)filter.level=level;
  return filter;
}
