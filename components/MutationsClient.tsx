"use client";
import {useDialog} from "./DialogProvider";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {CheckCircle2,Eye,XCircle} from "lucide-react";
import {StatusBadge} from "./StatusBadge";
import {MemberDetail} from "./MemberDetail";

type Row={
 _id:string;
 memberId?:{
  _id:string;
  name:string;
  memberNo?:string;
  nik:string;
  email?:string;
  phone?:string;
  level?:string;
  position?:string;
  membershipType?:string;
  branchType?:string;
  province?:string;
  city?:string;
 };
 requestType:string;
 targetLevel?:string;
 targetPosition?:string;
 reason:string;
 documentUrl?:string;
 status:string;
 createdAt:string;
};

export function MutationsClient(){
 const {alert,prompt}=useDialog();
 const router=useRouter();
 const [rows,setRows]=useState<Row[]>([]);
 const [selectedDetail,setSelectedDetail]=useState<{memberId:string;documentUrl?:string}|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 async function load(){
  setError("");
  try{
   const response=await fetch("/api/mutations",{cache:"no-store"});
   const data=await response.json();
   if(!response.ok)throw Error(data.message||"Gagal memuat pengajuan.");
   setRows(data);
  }catch(error){setError((error as Error).message||"Gagal memuat pengajuan.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{void load()},[]);
 async function review(id:string,status:"approved"|"rejected"){
  const reviewNotes=await prompt(status==="rejected"?"Alasan penolakan (dikirim ke email pemohon)":"Catatan pemeriksaan");
  if(reviewNotes===null)return;
  try{
   const response=await fetch("/api/mutations/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status,reviewNotes})});
   const data=await response.json();
   if(response.status===401){
    await alert("Sesi login admin telah berakhir. Silakan login kembali, lalu ulangi keputusan pengajuan.");
    router.replace("/login/pengurus");
    router.refresh();
    return;
   }
   if(!response.ok)throw Error(data.message||"Keputusan gagal disimpan.");
   if(data.message)await alert(data.message);
   await load();
  }catch(error){await alert((error as Error).message||"Keputusan gagal disimpan.");}
 }
 return <div>
  <h1 className="text-3xl font-black">Pengajuan Mutasi & Status</h1>
  <p className="mt-1 text-slate-500">Kelola perubahan status dan jenjang anggota.</p>
  {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  <div className="card mt-6 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Detail Anggota</th><th className="p-4">Pengajuan</th><th className="p-4">Tujuan</th><th className="p-4">Alasan</th><th className="p-4">Status</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody className="divide-y">{rows.map(row=><tr key={row._id}>
   <td className="min-w-64 p-4"><b>{row.memberId?.name||"Anggota"}</b>{row.memberId?._id&&<button type="button" onClick={()=>setSelectedDetail({memberId:row.memberId!._id,documentUrl:row.documentUrl})} className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"><Eye size={14}/>Lihat detail lengkap</button>}</td>
   <td className="p-4">{row.requestType}</td><td className="p-4">{row.targetLevel||row.targetPosition||"-"}</td><td className="max-w-xs p-4 text-slate-600">{row.reason}</td><td className="p-4"><StatusBadge status={row.status}/></td><td className="p-4 text-right">{row.status==="pending"&&<div className="flex justify-end gap-2"><button aria-label="Setujui pengajuan" onClick={()=>review(row._id,"approved")} className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={18}/></button><button aria-label="Tolak pengajuan" onClick={()=>review(row._id,"rejected")} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><XCircle size={18}/></button></div>}</td>
  </tr>)}{!rows.length&&<tr><td colSpan={6} className="p-8 text-center text-slate-400">{loading?"Memuat pengajuan...":"Belum ada pengajuan."}</td></tr>}</tbody></table></div>
  {selectedDetail&&<MemberDetail id={selectedDetail.memberId} mutationDocumentUrl={selectedDetail.documentUrl} onClose={()=>setSelectedDetail(null)}/>}
 </div>
}
