"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, UserRoundCog, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import Image from "next/image";
export function MemberShell({children}:{children:React.ReactNode}){
 const p=usePathname(); const r=useRouter();
 async function logout(){await fetch('/api/auth/logout',{method:'POST'});r.push('/login/anggota');r.refresh()}
 const item=(href:string,label:string,Icon:any)=><Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${p===href?'bg-blue-50 text-blue-700':'text-slate-600 hover:bg-slate-50'}`}><Icon size={18}/>{label}</Link>;
 return <div className="min-h-screen bg-slate-50 lg:flex"><aside className="flex flex-col border-r border-slate-200 bg-white p-5 lg:min-h-screen lg:w-72"><Logo/><nav className="mt-8 space-y-1">{item('/anggota/dashboard','Dashboard',LayoutDashboard)}{item('/anggota/profil','Pengaturan Profil',UserRoundCog)}</nav><button onClick={logout} className="mt-6 flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-rose-600 lg:mt-auto"><LogOut size={18}/>Keluar</button><div className="mt-6 border-t border-slate-100 pt-5 text-center lg:mt-5"><span className="mb-2 block text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Powered By</span><Image src="/prisma-logo.svg" alt="PRISMA — Pusat Registrasi Manajemen Anggota" width={1765} height={727} className="mx-auto h-auto w-28 max-w-full object-contain sm:w-32 lg:w-36"/></div></aside><main className="min-w-0 flex-1 p-5 lg:p-8">{children}</main></div>
}
