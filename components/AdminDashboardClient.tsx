"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {Users,UserCheck,Clock3,XCircle,Shuffle,ArrowRight} from "lucide-react";
import {StatusBadge} from "./StatusBadge";

type Stats={total:number;active:number;pending:number;rejected:number;mutationPending:number};
type MutationRow={_id:string;memberId?:{name:string;memberNo?:string;nik:string};requestType:string;targetLevel?:string;targetPosition?:string;reason:string;status:string;createdAt:string};

export function AdminDashboardClient(){
 const [s,setS]=useState<Stats|null>(null);
 const [mutations,setMutations]=useState<MutationRow[]>([]);
 const [mutationError,setMutationError]=useState("");
 const [mutationsLoading,setMutationsLoading]=useState(true);
 useEffect(()=>{
  let active=true;
  Promise.all([
   fetch("/api/stats").then(async response=>{if(!response.ok)throw Error("Statistik dashboard gagal dimuat.");return response.json()}),
   fetch("/api/mutations").then(async response=>{if(!response.ok)throw Error("Data pengajuan mutasi gagal dimuat.");return response.json()}),
  ]).then(([stats,rows])=>{
   if(!active)return;
   setS(stats);
   setMutations(rows);
  }).catch(error=>{
   if(active)setMutationError(error instanceof Error?error.message:"Data dashboard gagal dimuat.");
  }).finally(()=>{if(active)setMutationsLoading(false)});
  return()=>{active=false};
 },[]);
 const cards=[["Total Anggota",s?.total??0,Users],["Anggota Aktif",s?.active??0,UserCheck],["Menunggu Verifikasi",s?.pending??0,Clock3],["Ditolak",s?.rejected??0,XCircle]] as const;
 const latestMutations=mutations.slice(0,5);
 return <div>
  <div><h1 className="text-3xl font-black">Selamat datang kembali, Admin! 👋</h1><p className="mt-1 text-slate-500">Ringkasan data PRISMA yang tersimpan di MongoDB.</p></div>
  <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">{cards.map(([title,value,Icon])=><div className="card p-5" key={title}><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div><div className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon/></div></div></div>)}</div>
  <div className="mt-6 grid gap-6 lg:grid-cols-2">
   <div className="card p-6"><h2 className="text-lg font-black">Antrean Verifikasi</h2><p className="mt-2 text-sm text-slate-500">Terdapat <b>{s?.pending??0}</b> pendaftar yang memerlukan keputusan pengurus.</p><Link href="/pengurus/verifikasi" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600">Buka verifikasi <ArrowRight size={16}/></Link></div>
   <div className="card p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-black">Pengajuan Mutasi & Status</h2><p className="mt-2 text-sm text-slate-500"><b>{s?.mutationPending??0}</b> pengajuan menunggu pemeriksaan.</p></div><Link href="/pengurus/mutasi" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">Lihat semua <Shuffle size={16}/></Link></div>
    {mutationError?<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{mutationError}</p>:mutationsLoading?<p role="status" className="mt-4 text-sm text-slate-500">Memuat data pengajuan...</p>:latestMutations.length?<ul className="mt-4 divide-y divide-slate-100">{latestMutations.map(row=><li key={row._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{row.memberId?.name||"Anggota"}</p><p className="mt-1 text-xs text-slate-500">{row.requestType}{row.targetLevel||row.targetPosition?` · ${row.targetLevel||row.targetPosition}`:""}</p></div><StatusBadge status={row.status}/></li>)}</ul>:<p className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Belum ada pengajuan mutasi atau perubahan status.</p>}
   </div>
  </div>
 </div>
}
