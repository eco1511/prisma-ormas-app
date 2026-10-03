"use client";
import {useEffect,useState} from "react";
import {Search,Trash2,RefreshCw,Eye,Pencil,Plus,FileDown,Upload,Download} from "lucide-react";
import {useDialog} from "./DialogProvider";
import {StatusBadge} from "./StatusBadge";
import {MemberDetail} from "./MemberDetail";
import {MemberForm} from "./MemberForm";
import {MemberImport} from "./MemberImport";
import {regionLabel} from "@/lib/membership";
type M={photoUrl?:string;_id:string;memberNo?:string;name:string;nik:string;email:string;phone:string;level:string;position:string;status:string;membershipType?:string;branchType?:string;province?:string;city?:string};
type Filter={q:string;status:string};
export function MembersClient(){
 const {alert,confirm}=useDialog();
 const [rows,setRows]=useState<M[]>([]),[q,setQ]=useState(""),[status,setStatus]=useState(""),[filter,setFilter]=useState<Filter>({q:"",status:""}),[loading,setLoading]=useState(false),[exporting,setExporting]=useState("");
 const [selected,setSelected]=useState<string|null>(null),[editor,setEditor]=useState<{id?:string}|null>(null),[importOpen,setImportOpen]=useState(false);
 function params(value:Filter){const p=new URLSearchParams();if(value.q)p.set("q",value.q);if(value.status)p.set("status",value.status);return p;}
 async function load(value:Filter=filter){setLoading(true);try{const response=await fetch("/api/members?"+params(value),{cache:"no-store"});const data=await response.json();if(!response.ok)throw Error(data.message||"Gagal memuat anggota.");setRows(data);}catch(error){await alert((error as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{void load({q:"",status:""});},[]);
 function applyFilter(){const next={q,status};setFilter(next);void load(next);}
 async function del(id:string){if(!(await confirm("Hapus anggota ini beserta akun loginnya?")))return;try{const response=await fetch("/api/members/"+id,{method:"DELETE"});if(!response.ok)throw Error((await response.json()).message||"Gagal menghapus anggota.");await load();}catch(error){await alert((error as Error).message);}}
 async function download(format:"pdf"|"xlsx"){
  setExporting(format);
  try{const p=params(filter);p.set("format",format);const response=await fetch("/api/members/export?"+p,{cache:"no-store"});if(!response.ok)throw Error((await response.json()).message||"Ekspor gagal.");const blob=await response.blob();const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1]||"anggota-prisma."+format;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  catch(error){await alert((error as Error).message);}finally{setExporting("");}
 }
 return <div>
  <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-black">Database Anggota</h1><p className="mt-1 text-slate-500">Kelola data anggota, ekspor laporan, dan impor anggota dari Excel.</p></div><button className="btn-primary" onClick={()=>setEditor({})}><Plus size={17}/>Tambah Anggota</button></div>
  <div className="card mt-6 flex flex-wrap gap-3 p-4"><button className="btn-secondary" disabled={Boolean(exporting)} onClick={()=>download("pdf")}><FileDown size={17}/>{exporting==="pdf"?"Menyiapkan PDF...":"Ekspor PDF"}</button><button className="btn-secondary" disabled={Boolean(exporting)} onClick={()=>download("xlsx")}><Download size={17}/>{exporting==="xlsx"?"Menyiapkan Excel...":"Ekspor Excel"}</button><button className="btn-secondary" onClick={()=>setImportOpen(true)}><Upload size={17}/>Impor Excel</button><a href="/templates/format-import-anggota.xlsx" download className="btn-secondary"><Download size={17}/>Format Excel</a><p className="w-full text-xs text-slate-500">Ekspor mengikuti filter yang diterapkan dan mencakup semua hasil hingga 10.000 anggota. PDF berisi ringkasan, Excel berisi data lengkap.</p></div>
  <form onSubmit={event=>{event.preventDefault();applyFilter();}} className="mt-5 flex flex-wrap items-center gap-3"><div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-3.5 text-slate-400" size={17}/><input className="input pl-9" aria-label="Cari anggota" value={q} onChange={event=>setQ(event.target.value)} placeholder="Cari nama, NIK, nomor anggota..."/></div><select className="select w-auto" aria-label="Filter status anggota" value={status} onChange={event=>setStatus(event.target.value)}><option value="">Semua status</option><option value="active">Aktif</option><option value="pending">Pending</option><option value="rejected">Ditolak</option><option value="inactive">Tidak aktif</option></select><button className="btn-secondary" disabled={loading}><RefreshCw size={17}/>{loading?"Memuat...":"Terapkan Filter"}</button></form>
  <div className="card mt-5 overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Anggota","NIK","Jenjang / Jabatan","Wilayah","Status"].map(label=><th key={label} className="p-4">{label}</th>)}<th className="p-4 text-right">Aksi</th></tr></thead><tbody className="divide-y">{rows.map(member=><tr key={member._id} className="hover:bg-slate-50"><td className="p-4"><div className="flex items-center gap-3"><MemberPhoto name={member.name} photoUrl={member.photoUrl}/><div className="min-w-0"><b>{member.name}</b><div className="text-xs text-slate-400">{member.memberNo||"Nomor belum terbit"}</div></div></div></td><td className="p-4 font-mono text-xs">{member.nik}</td><td className="p-4">{member.level}<div className="text-xs text-slate-400">{member.position}</div></td><td className="p-4">{regionLabel(member)}</td><td className="p-4"><StatusBadge status={member.status}/></td><td className="p-4"><div className="flex justify-end gap-1"><button type="button" onClick={()=>setSelected(member._id)} aria-label={"Detail "+member.name} className="inline-flex items-center gap-1 rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Eye size={17}/>Detail</button><button type="button" onClick={()=>setEditor({id:member._id})} aria-label={"Edit "+member.name} className="inline-flex items-center gap-1 rounded-lg p-2 text-amber-700 hover:bg-amber-50"><Pencil size={17}/>Edit</button><button type="button" onClick={()=>del(member._id)} aria-label={"Hapus "+member.name} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={17}/></button></div></td></tr>)}{!rows.length&&<tr><td className="p-8 text-center text-slate-400" colSpan={6}>{loading?"Memuat data...":"Belum ada data sesuai filter."}</td></tr>}</tbody></table></div>
  {rows.length===500&&<p className="mt-3 text-xs text-slate-500">Tabel menampilkan 500 hasil terbaru. Persempit pencarian atau gunakan ekspor untuk melihat seluruh hasil.</p>}
  {selected&&<MemberDetail key={selected} id={selected} onClose={()=>setSelected(null)}/>}
  {editor&&<MemberForm key={editor.id||"new"} id={editor.id} onClose={()=>setEditor(null)} onSaved={()=>{void load();}}/>}
  {importOpen&&<MemberImport onClose={()=>setImportOpen(false)} onSaved={()=>{void load();}}/>}
 </div>;
}

function MemberPhoto({name,photoUrl}:{name:string;photoUrl?:string}) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[photoUrl]);
 return photoUrl&&!failed ? <img src={photoUrl} alt={`Foto ${name}`} loading="lazy" onError={()=>setFailed(true)} className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"/> : <div aria-label={`Foto ${name} belum tersedia`} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">{name.trim().split(/\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase()||"?"}</div>;
}