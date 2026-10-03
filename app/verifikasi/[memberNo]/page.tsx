import {notFound} from "next/navigation";
import {connectMongoDB} from "@/lib/mongodb";
import {Member} from "@/models/Member";
import {Setting} from "@/models/Setting";
import {membershipLabel,regionLabel} from "@/lib/membership";
import {StatusBadge} from "@/components/StatusBadge";
export const dynamic="force-dynamic";
export default async function Verify({params}:{params:Promise<{memberNo:string}>}){
 const {memberNo}=await params;await connectMongoDB();
 const m=await Member.findOne({memberNo}).select("name memberNo status position membershipType branchType province city organizationName").lean() as any;
 if(!m)notFound();
 const settings=await Setting.findOne({key:"main"}).select("organizationName").lean<{organizationName?:string}>();
 const organizationName=settings?.organizationName?.trim()||m.organizationName?.trim()||"PRISMA";
 return <main className="min-h-screen bg-slate-100 px-5 py-16"><section className="card mx-auto max-w-lg overflow-hidden"><div className="bg-slate-900 p-7 text-white"><p className="break-words text-xs tracking-widest text-cyan-300">{organizationName} &bull; VERIFIKASI DIGITAL</p><h1 className="mt-3 text-2xl font-black">Verifikasi Keanggotaan</h1><p className="mt-2 text-sm text-slate-300">Status terkini berdasarkan database anggota.</p></div><dl className="space-y-5 p-7">{[["Nama organisasi",organizationName],["Nama anggota",m.name],["Nomor anggota",m.memberNo],["Jabatan",m.position?.trim()||"Anggota"],["Pusat / Cabang",membershipLabel(m)],["Nama daerah",regionLabel(m)]].map(([label,value])=><div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}<div><dt className="mb-2 text-xs text-slate-500">Status anggota</dt><dd><StatusBadge status={m.status}/></dd></div></dl></section></main>
}
