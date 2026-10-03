"use client";
import { useDialog } from "./DialogProvider";
import { useEffect, useState } from "react";
import { IdCard, Send } from "lucide-react";
import { MemberCard } from "./MemberCard";
import { StatusBadge } from "./StatusBadge";

export function MemberDashboardClient() {
  const { alert } = useDialog();
  const [m, setM] = useState<any>(null);
  const [mut, setMut] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const [profile, mutations] = await Promise.all([
      fetch("/api/profile", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/mutations").then((response) => response.json()),
    ]);
    setM(profile);
    setMut(mutations);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const response = await fetch("/api/mutations", {
      method: "POST",
      body: new FormData(form),
    });
    const data = await response.json();
    if (response.ok) {
      setMsg("Pengajuan berhasil dikirim.");
      form.reset();
      void load();
    } else {
      await alert(data.message);
    }
  }

  if (!m) return <div>Memuat dashboard...</div>;

  return (
    <div>
      <h1 className="text-3xl font-black">Selamat datang kembali, {m.name}</h1>
      <p className="mt-1 text-slate-500">Status keanggotaan dan pengajuan Anda.</p>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">E-KTA Digital</h2>
              <p className="text-sm text-slate-500">Kartu tersedia setelah status aktif.</p>
            </div>
            <IdCard className="text-blue-600" />
          </div>
          <MemberCard member={m} />
        </section>
        <section className="card p-6">
          <h2 className="text-xl font-black">Pengajuan Status Baru</h2>
          <p className="mt-1 text-sm text-slate-500">Ajukan mutasi, jabatan, nonaktif, atau aktif kembali.</p>
          {msg && <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{msg}</div>}
          <form onSubmit={submit} className="mt-5 space-y-4">
            <select name="requestType" className="select" required>
              <option value="">Pilih jenis pengajuan</option>
              <option>Mutasi</option>
              <option>Perubahan Jabatan</option>
              <option>Nonaktif</option>
              <option>Aktif Kembali</option>
            </select>
            <input name="targetLevel" className="input" placeholder="Jenjang tujuan (jika ada)" />
            <select name="targetPosition" className="select">
              <option value="">Jabatan tujuan (jika ada)</option>
              <option>Ketua</option>
              <option>Sekretaris</option>
              <option>Bendahara</option>
              <option>Anggota</option>
            </select>
            <textarea name="reason" className="input min-h-24" placeholder="Alasan atau nomor SK pengangkatan..." required />
            <input name="document" type="file" className="input" />
            <button className="btn-primary w-full"><Send size={17} />Kirim Pengajuan</button>
          </form>
        </section>
      </div>
      <section className="card mt-6 overflow-x-auto">
        <div className="p-5">
          <h2 className="text-xl font-black">Riwayat Pengajuan</h2>
        </div>
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-4">Jenis</th>
              <th className="p-4">Tujuan</th>
              <th className="p-4">Alasan</th>
              <th className="p-4">Dokumen Pengajuan Mutasi & Status</th>
              <th className="p-4">Status</th>
              <th className="p-4">Keterangan Ditolak</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {mut.map((x) => (
              <tr key={x._id}>
                <td className="p-4 font-semibold">{x.requestType}</td>
                <td className="p-4">{x.targetLevel || x.targetPosition || "-"}</td>
                <td className="p-4">{x.reason}</td>
                <td className="p-4">
                  {x.documentUrl
                    ? <a href={x.documentUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-800">Lihat dokumen</a>
                    : <span className="text-slate-400">Dokumen tidak dilampirkan</span>}
                </td>
                <td className="p-4"><StatusBadge status={x.status} /></td>
                <td className="max-w-xs whitespace-pre-wrap p-4 text-rose-700">
                  {x.status === "rejected" ? x.reviewNotes || "Tidak ada keterangan." : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
