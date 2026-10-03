"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";

export function LoginForm({ portal }: { portal: "member" | "admin" }) {
  const router=useRouter();const [show,setShow]=useState(false);const [loading,setLoading]=useState(false);const [error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError("");const f=new FormData(e.currentTarget);const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:f.get('identifier'),password:f.get('password'),portal})});const data=await res.json();setLoading(false);if(!res.ok){setError(data.message||'Login gagal');return;}router.push(data.role==='superadmin'?'/superadmin/dashboard':data.role==='admin'?'/pengurus/dashboard':'/anggota/dashboard');router.refresh();}
  return <form onSubmit={submit} className="space-y-5">
    {error&&<div className="rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</div>}
    <div><label className="label">{portal==='member'?'NIK':'Email Pengurus'}</label><input className="input" name="identifier" type={portal==='member'?'text':'email'} placeholder={portal==='member'?'Masukkan 16 digit NIK':'admin@prisma.com'} required/></div>
    <div><label className="label">Kata Sandi</label><div className="relative"><input className="input pr-12" name="password" type={show?'text':'password'} placeholder="Masukkan kata sandi" required/><button type="button" onClick={()=>setShow(!show)} className="absolute right-4 top-3.5 text-slate-400">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
    <button className="btn-primary w-full py-3" disabled={loading}><LogIn size={18}/>{loading?'Memproses...':'Masuk'}</button>
    <div className="text-center text-sm text-slate-500">{portal==='member'?<>Belum menjadi anggota? <Link className="font-bold text-blue-600" href="/daftar">Daftar sekarang</Link></>:<><Link className="font-bold text-blue-600" href="/login/anggota">Masuk sebagai anggota</Link></>}</div>
  </form>
}
