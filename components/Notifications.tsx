"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, UserPlus, Shuffle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
type Item = { id: string; title: string; message: string; name: string; position: string; region: string; href: string; createdAt: string; read: boolean };
type Feed = { items: Item[]; unread: number; snapshot: string };
export function Notifications() {
  const router = useRouter();
  const requestVersion = useRef(0);
  const marking = useRef(false);
  const [open, setOpen] = useState(false);
  const [feed, setFeed] = useState<Feed>({ items: [], unread: 0, snapshot: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (marking.current) return;
    const version = ++requestVersion.current;
    setLoading(true);
    try { const response = await fetch("/api/notifications", { cache: "no-store", signal }); const data = await response.json(); if (!response.ok) throw Error(data.message || "Gagal memuat notifikasi."); if (version === requestVersion.current) { setFeed(data); setError(""); } }
    catch (e) { if (version === requestVersion.current && (e as Error).name !== "AbortError") setError((e as Error).message); }
    finally { if (!signal?.aborted && version === requestVersion.current) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const interval = setInterval(() => { if (document.visibilityState === "visible") void load(controller.signal); }, 30000);
    const refresh = () => { if (document.visibilityState === "visible") void load(controller.signal); };
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);
  async function markRead(item?: Item) {
    if (marking.current) return;
    marking.current = true;
    ++requestVersion.current;
    setBusy(true);
    try { const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item ? { id: item.id } : { snapshot: feed.snapshot }) }); if (!response.ok) throw Error((await response.json()).message || "Gagal menandai notifikasi."); setFeed(current => ({ ...current, items: item ? current.items.filter(entry => entry.id !== item.id) : [], unread: item ? Math.max(0, current.unread - 1) : 0 })); if (item) { setOpen(false); router.push(item.href); } }
    catch (e) { setError((e as Error).message); }
    finally { marking.current = false; setBusy(false); setLoading(false); void load(); }
  }
  return <><button type="button" aria-label={"Notifikasi, " + feed.unread + " belum dibaca"} onClick={() => { setOpen(true); void load(); }} className="relative rounded-xl p-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Bell size={21}/>{feed.unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{feed.unread > 99 ? "99+" : feed.unread}</span>}</button>
    {open && <Modal title="Notifikasi Pengurus" onClose={() => setOpen(false)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{feed.unread} notifikasi belum dibaca</p><button type="button" className="btn-secondary text-xs" disabled={busy || loading || !feed.unread || !feed.snapshot || Boolean(error)} onClick={() => void markRead()}>{busy ? "Menyimpan..." : "Tandai semua dibaca"}</button></div>
      {error && <div role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}<button type="button" onClick={() => void load()} className="ml-2 font-bold underline">Coba lagi</button></div>}
      {loading && !feed.items.length ? <p role="status" className="py-8 text-center text-slate-500">Memuat notifikasi...</p> : !feed.items.length && !error ? <p className="py-8 text-center text-slate-500">Tidak ada notifikasi yang belum dibaca.</p> : <div className="space-y-2">{feed.items.map(item => <Link key={item.id} href={item.href} onClick={event => { event.preventDefault(); void markRead(item); }} aria-disabled={busy} className={"flex gap-3 rounded-xl border p-4 transition hover:border-blue-300 " + (item.read ? "border-slate-100 bg-white" : "border-blue-100 bg-blue-50")}>
        <div className="rounded-lg bg-white p-2 text-blue-600">{item.href.includes("mutasi") ? <Shuffle size={18}/> : <UserPlus size={18}/>}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="text-sm font-bold">{item.title}</h3>{!item.read && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Belum dibaca"/>}</div><p className="mt-1 break-words text-sm text-slate-600">{item.message}</p><dl className="mt-3 space-y-1 text-xs text-slate-600">{[["Nama", item.name], ["Jabatan", item.position], ["Wilayah", item.region]].map(([label, value]) => <div key={label} className="flex gap-2"><dt className="w-14 shrink-0 text-slate-500">{label}</dt><dd className="min-w-0 break-words font-semibold">{value}</dd></div>)}</dl><time className="mt-2 block text-xs text-slate-400" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</time></div>
      </Link>)}</div>}
      {feed.items.length === 50 && <p className="mt-4 text-xs text-slate-500">Menampilkan 50 notifikasi terbaru.</p>}
    </Modal>}
  </>;
}
