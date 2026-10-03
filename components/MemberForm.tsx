"use client";
import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Modal } from "./Modal";
import { MembershipFields } from "./MembershipFields";
import { StatusBadge } from "./StatusBadge";
export function MemberForm({id,onClose,onSaved}:{id?:string;onClose:()=>void;onSaved:()=>void}) {
 const [member,setMember]=useState<Record<string,any>|null>(null),[error,setError]=useState(""),[photoError,setPhotoError]=useState(""),[photoBusy,setPhotoBusy]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const read=async(url:string)=>{const response=await fetch(url,{cache:"no-store",signal:controller.signal});const data=await response.json();if(!response.ok)throw Error(data.message||"Gagal memuat data formulir.");return data;};
    const [settings,record]=await Promise.all([read("/api/settings"),id?read("/api/members/"+id):Promise.resolve({})]);
    setMember({...record,organizationName:String(settings.organizationName||"").trim()||"PRISMA"});
   }catch(error){if((error as Error).name!=="AbortError")setError((error as Error).message);}
  }
  void load();return()=>controller.abort();
 },[id]);
 async function save(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");
  try{const body=Object.fromEntries(new FormData(event.currentTarget));const response=await fetch("/api/members"+(id?"/"+id:""),{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw Error(data.message||"Gagal menyimpan anggota.");onSaved();onClose();}
  catch(error){setError((error as Error).message||"Koneksi gagal.");}finally{setBusy(false);}
 }
 async function savePhoto(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!id)return;
  const form=event.currentTarget;const file=new FormData(form).get("photo");
  if(!(file instanceof File)||file.size===0){setPhotoError("Pilih foto JPG atau PNG.");return;}
  if(file.size>5*1024*1024){setPhotoError("Ukuran foto maksimal 5 MB.");return;}
  setPhotoBusy(true);setPhotoError("");
  try{
   const response=await fetch(`/api/members/${id}/photo`,{method:"PATCH",body:new FormData(form)});const data=await response.json();
   if(!response.ok)throw Error(data.message||"Foto gagal diperbarui.");
   setMember(current=>current?{...current,photoUrl:data.photoUrl}:current);onSaved();form.reset();
  }catch(error){setPhotoError((error as Error).message||"Foto gagal diperbarui.");}
  finally{setPhotoBusy(false);}
 }
 return <Modal title={id?"Edit Anggota":"Tambah Anggota"} onClose={()=>{if(!busy)onClose();}}>
  {error&&<p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
  {!member?<p role="status" className="text-sm text-slate-500">{error?"Tutup dan buka kembali formulir untuk mencoba lagi.":"Memuat anggota dan organisasi admin..."}</p>:<>
   <div className="mb-5 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{id?<div className="flex flex-wrap items-center gap-2">Status: <StatusBadge status={member.status}/> <span>Perubahan status diproses melalui verifikasi atau mutasi.</span></div>:"Anggota baru berstatus Pending. Akun dan nomor anggota dibuat setelah verifikasi pengurus."}</div>
   {id&&<form onSubmit={savePhoto} className="mb-5 rounded-xl border border-slate-200 p-4"><h3 className="font-bold">Foto Anggota</h3>{photoError&&<p role="alert" className="mt-2 text-sm text-rose-700">{photoError}</p>}<div className="mt-3 flex flex-wrap items-center gap-4">{member.photoUrl?<img src={member.photoUrl} alt={`Foto ${member.name}`} className="h-20 w-20 rounded-xl border border-slate-200 object-cover"/>:<div className="grid h-20 w-20 place-items-center rounded-xl bg-slate-100 text-slate-400"><ImagePlus size={24}/></div>}<div className="min-w-0 flex-1"><label className="label" htmlFor="admin-member-photo">Pilih foto baru (JPG/PNG, maksimal 5 MB)</label><input id="admin-member-photo" name="photo" type="file" accept="image/jpeg,image/png" className="input" disabled={photoBusy||busy}/></div><button type="submit" className="btn-secondary" disabled={photoBusy||busy}><ImagePlus size={17}/>{photoBusy?"Menyimpan...":"Simpan Foto"}</button></div></form>}
   <form onSubmit={save}><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
    {[["Nama Lengkap","name","text",150],["NIK","nik","text",16],["Email","email","email",254],["Telepon / WhatsApp","phone","text",50]].map(([label,key,type,length])=><div key={String(key)}><label className="label" htmlFor={"member-"+key}>{label}</label><input id={"member-"+key} name={String(key)} type={String(type)} className="input" required maxLength={Number(length)} minLength={key==="nik"?16:undefined} pattern={key==="nik"?"[0-9]{16}":undefined} inputMode={key==="nik"?"numeric":undefined} defaultValue={member[String(key)]||""}/></div>)}
    <div><label className="label" htmlFor="member-gender">Jenis Kelamin</label><select id="member-gender" name="gender" className="select" defaultValue={member.gender||""}><option value="">Belum ditentukan</option><option>Laki-laki</option><option>Perempuan</option></select></div>
    <div><label className="label" htmlFor="member-birth">Tanggal Lahir</label><input id="member-birth" name="birthDate" className="input" type="date" max={new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Jakarta"})} defaultValue={member.birthDate?String(member.birthDate).slice(0,10):""}/></div>
    <MembershipFields initial={member}/>
    <div><label className="label" htmlFor="member-organization">Organisasi</label><input id="member-organization" name="organizationName" className="input cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-600" value={member.organizationName} disabled readOnly aria-describedby="member-organization-help"/><p id="member-organization-help" className="mt-1 text-xs text-slate-500">Otomatis mengikuti Pengaturan Organisasi admin.</p></div>
    <div className="sm:col-span-2"><label className="label" htmlFor="member-address">Alamat Lengkap</label><textarea id="member-address" name="address" className="input min-h-24" required maxLength={1000} defaultValue={member.address||""}/></div>
   </fieldset>
   <div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Batal</button><button className="btn-primary" disabled={busy}>{busy?"Menyimpan...":id?"Simpan Perubahan":"Tambah Anggota"}</button></div></form>
  </>}
 </Modal>;
}
