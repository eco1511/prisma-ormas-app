"use client";
import { useState } from "react";
import { Modal } from "./Modal";
type Preview={total:number;valid:number;invalid:number;rows:{row:number;name:string;position?:string;region?:string;error?:string}[]};
type Result={imported:number;skipped:number;message:string;errors:{row:number;name:string;message:string}[]};
export function MemberImport({onClose,onSaved}:{onClose:()=>void;onSaved:()=>void}) {
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<Preview|null>(null),[result,setResult]=useState<Result|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function upload(commit=false){
  if(!file)return;setBusy(true);setError("");
  try{const body=new FormData();body.set("file",file);const response=await fetch("/api/members/import"+(commit?"":"?preview=1"),{method:"POST",body});const data=await response.json();if(!response.ok)throw Error(data.message||"Impor gagal.");if(commit){setResult(data);setPreview(null);onSaved();}else setPreview(data);}
  catch(error){setError((error as Error).message||"Koneksi gagal.");}finally{setBusy(false);}
 }
 return <Modal title="Impor Anggota dari Excel" onClose={()=>{if(!busy)onClose();}}>
  <p className="text-sm leading-6 text-slate-600">Isi sheet Anggota mulai baris 2. Maksimal 1.000 baris dan 5 MB per file. NIK dan telepon harus berformat Text. Data baru masuk sebagai Pending untuk diverifikasi.</p>
  <a href="/templates/format-import-anggota.xlsx" download className="btn-secondary my-4">Unduh Format Excel</a>
  {!result&&<><label htmlFor="member-excel" className="label">File Excel (.xlsx)</label><input id="member-excel" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="input" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setPreview(null);setError("");}}/><button type="button" className="btn-secondary mt-3" disabled={!file||busy} onClick={()=>upload()}>{busy?"Memproses...":"Periksa File"}</button></>}
  {error&&<p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  {preview&&<section className="mt-5"><h3 className="font-bold">Pratinjau Impor</h3><p className="mt-1 text-sm text-slate-600">{preview.total} baris: {preview.valid} dapat diimpor, {preview.invalid} akan dilewati. Anggota yang sudah terdaftar tidak diubah.</p><div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr><th className="p-3">Baris</th><th className="p-3">Anggota</th><th className="p-3">Hasil Pemeriksaan</th></tr></thead><tbody className="divide-y">{preview.rows.map(row=><tr key={row.row}><td className="p-3">{row.row}</td><td className="p-3 font-semibold">{row.name||"-"}</td><td className={"p-3 "+(row.error?"text-rose-700":"text-emerald-700")}>{row.error||[row.position,row.region].filter(Boolean).join(" - ")}</td></tr>)}</tbody></table></div><button type="button" className="btn-primary mt-4" disabled={busy||!preview.valid} onClick={()=>upload(true)}>{busy?"Mengimpor...":"Impor "+preview.valid+" Anggota Valid"}</button></section>}
  {result&&<section className="mt-5"><p role="status" className="rounded-xl bg-blue-50 p-3 text-sm font-bold text-blue-800">{result.message}</p>{result.errors.length>0&&<div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200 p-3"><h3 className="text-sm font-bold">Baris yang Dilewati</h3><ul className="mt-2 space-y-2 text-xs text-rose-700">{result.errors.map(row=><li key={row.row}>Baris {row.row} ({row.name||"Tanpa nama"}): {row.message}</li>)}</ul></div>}</section>}
  <div className="mt-6 flex justify-end"><button className="btn-secondary" disabled={busy} onClick={onClose}>Tutup</button></div>
 </Modal>;
}
