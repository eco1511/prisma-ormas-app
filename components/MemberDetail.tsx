"use client";
import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
type Detail = { [key: string]: string | undefined };
function date(value?: string) { return value ? new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" }) : "-"; }
function DocumentPreview({label,url}:{label:string;url:string}) {
  return <div className="mt-4 rounded-xl border border-slate-200 p-3"><h4 className="text-sm font-bold">{label}</h4>{url.toLowerCase().endsWith(".pdf")?<iframe title={label} src={url} className="mt-3 h-[32rem] w-full rounded-lg bg-slate-100"/>:<img src={url} alt={label} className="mt-3 max-h-[32rem] max-w-full rounded-lg object-contain"/>}<a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-blue-600">Buka {label} di tab baru</a></div>;
}
export function MemberDetail({ id, onClose, mutationDocumentUrl }: { id: string; onClose: () => void; mutationDocumentUrl?: string }) {
  const [member, setMember] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/members/" + id, { cache: "no-store", signal: controller.signal }).then(async r => { const data = await r.json(); if (!r.ok) throw Error(data.message || "Gagal memuat detail anggota."); setMember(data); }).catch(e => { if (e.name !== "AbortError") setError(e.message); });
    return () => controller.abort();
  }, [id]);
  return <Modal title="Detail Anggota" onClose={onClose}>{error ? <p role="alert" className="text-rose-600">{error}</p> : !member ? <p role="status" className="text-slate-500">Memuat detail anggota...</p> : <>
    <div className="mb-6 flex items-center gap-4">{member.photoUrl && <img src={member.photoUrl} alt={"Foto " + member.name} className="h-20 w-20 rounded-xl border border-slate-200 object-cover"/>}<div><h3 className="text-xl font-black">{member.name}</h3><p className="mb-2 text-sm text-slate-500">{member.memberNo || "Nomor anggota belum terbit"}</p><StatusBadge status={member.status || "pending"}/></div></div>
    <dl className="grid gap-4 text-sm sm:grid-cols-2">{[
      ["NIK", member.nik], ["Email", member.email], ["Telepon", member.phone], ["Jenis kelamin", member.gender], ["Tanggal lahir", date(member.birthDate)], ["Organisasi", member.organizationName], ["Jenis keanggotaan", member.membershipType], ["Kepengurusan", member.branchType], ["Jenjang", member.level], ["Jabatan", member.position], ["Provinsi", member.province], ["Kabupaten / Kota", member.city], ["Tanggal pendaftaran", date(member.createdAt)], ["Tanggal verifikasi", date(member.verifiedAt)],
    ].map(([label, value]) => <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold">{value || "-"}</dd></div>)}<div className="sm:col-span-2"><dt className="text-slate-500">Alamat</dt><dd className="mt-1 whitespace-pre-wrap font-semibold">{member.address || "-"}</dd></div><div className="sm:col-span-2"><dt className="text-slate-500">Catatan verifikasi</dt><dd className="mt-1 whitespace-pre-wrap">{member.verificationNotes || "-"}</dd></div></dl>
    <div className="mt-6 border-t border-slate-100 pt-4"><h3 className="font-bold">Dokumen Anggota</h3><div className="mt-3 flex flex-wrap gap-3">{[["Foto", member.photoUrl], ["KTP", member.ktpUrl], ["SK Kepengurusan", member.skUrl]].map(([label, url]) => url ? <a key={label} href={url} target="_blank" rel="noreferrer" className="btn-secondary">Lihat {label}</a> : <span key={label} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">{label} belum tersedia</span>)}</div>{member.skUrl&&<DocumentPreview label="SK Kepengurusan" url={member.skUrl}/ >}{mutationDocumentUrl&&<DocumentPreview label="Dokumen Pengajuan Mutasi & Status" url={mutationDocumentUrl}/>}</div>
  </>}</Modal>;
}
