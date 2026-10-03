"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, UserCheck, Database, Shuffle, Layers3, BriefcaseBusiness, Settings, ShieldCheck, LogOut, Crown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Notifications } from "./Notifications";
import { Logo } from "./Logo";
import Image from "next/image";

const menus = [
  ["/pengurus/dashboard", "Dashboard", LayoutDashboard],
  ["/pengurus/verifikasi", "Verifikasi Anggota", UserCheck],
  ["/pengurus/anggota", "Database Anggota", Database],
  ["/pengurus/mutasi", "Mutasi & Status", Shuffle],
  ["/pengurus/master/jenjang", "Master Jenjang", Layers3],
  ["/pengurus/master/jabatan", "Master Jabatan", BriefcaseBusiness],
  ["/pengurus/pengaturan", "Pengaturan", Settings],
  ["/pengurus/keamanan", "Keamanan Admin", ShieldCheck],
] as const;

export function AdminShell({ children, superadmin = false }: { children: React.ReactNode; superadmin?: boolean }) {
  const path = usePathname(); const router = useRouter(); const [open,setOpen]=useState(false);
  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); router.push("/login/pengurus"); router.refresh(); }
  return <div className="min-h-screen bg-slate-50 lg:flex">
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-slate-200 bg-white p-5 transition-transform lg:static lg:min-h-screen lg:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
      <div className="flex items-center justify-between"><Logo/><button className="lg:hidden" onClick={()=>setOpen(false)}><X/></button></div>
      <nav className="mt-8 space-y-1">
        {superadmin && <Link href="/superadmin/dashboard" className="mb-3 flex items-center gap-3 rounded-xl bg-slate-950 px-3 py-3 text-sm font-bold text-white"><Crown size={18}/> Super Admin</Link>}
        {menus.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${path===href?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-50 hover:text-blue-700"}`}><Icon size={18}/>{label}</Link>)}
      </nav>
      <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"><LogOut size={18}/> Keluar</button>
      <div className="mt-5 border-t border-slate-100 pt-5 text-center"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Powered By</span><Image src="/prisma-logo.svg" alt="PRISMA — Pusat Registrasi Manajemen Anggota" width={1765} height={727} className="mx-auto h-auto w-28 max-w-full object-contain sm:w-32 lg:w-36"/></div>
    </aside>
    <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8"><button className="lg:hidden" onClick={()=>setOpen(true)}><Menu/></button><div className="hidden text-sm text-slate-500 lg:block">Panel Pengurus PRISMA</div><div className="ml-auto flex items-center gap-4"><Notifications/><div className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">Administrator</div></div></header>
      <main className="flex-1 p-5 lg:p-8">{children}</main>
    </div>
  </div>
}
