import regions from "@/data/regions.json";
export const POSITIONS = ["Ketua", "Sekretaris", "Bendahara", "Anggota"] as const;
export function validateMembership(v: Record<string, string>) {
  if (!["Pusat", "Cabang"].includes(v.membershipType)) throw new Error("Pilih Pusat atau Cabang.");
  if (!(POSITIONS as readonly string[]).includes(v.position)) throw new Error("Jabatan tidak valid.");
  if (v.membershipType === "Pusat") return {membershipType:"Pusat",branchType:"Pusat",level:"Pusat",province:"",city:"",provinceId:"",cityId:"",position:v.position};
  if (!["Provinsi","Kabupaten/Kota"].includes(v.branchType)) throw new Error("Pilih tingkat cabang.");
  const province = regions.provinces.find(p => p.id === v.provinceId);
  if (!province) throw new Error("Pilih provinsi yang valid.");
  const city = regions.regencies.find(c => c.id === v.cityId && c.provinceId === province.id);
  if (v.branchType === "Kabupaten/Kota" && !city) throw new Error("Pilih kabupaten/kota sesuai provinsi.");
  if (v.branchType === "Provinsi" && v.cityId) throw new Error("Cabang provinsi tidak boleh memiliki kabupaten/kota.");
  return {membershipType:"Cabang",branchType:v.branchType,level:v.branchType,province:province.name,provinceId:province.id,city:v.branchType==="Kabupaten/Kota"?city!.name:"",cityId:v.branchType==="Kabupaten/Kota"?city!.id:"",position:v.position};
}
export function membershipLabel(m: {membershipType?:string;branchType?:string}) {
  return m.membershipType || (m.branchType==="Pusat"?"Pusat":["Provinsi","Kabupaten/Kota"].includes(m.branchType||"")?"Cabang":"Belum ditentukan");
}
export function regionLabel(m: {membershipType?:string;branchType?:string;province?:string;city?:string}) {
  if (membershipLabel(m)==="Pusat") return "Nasional";
  return (m.branchType==="Provinsi"?m.province:[m.city,m.province].filter(Boolean).join(", ")) || "Belum ditentukan";
}
