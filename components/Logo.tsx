import { Users } from "lucide-react";
export function Logo({ dark = false }: { dark?: boolean }) {
  return <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/40"><Users size={20}/></div><div><div className={`font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>PRISMA</div><div className={`text-[10px] uppercase tracking-[.18em] ${dark ? "text-slate-400" : "text-slate-400"}`}>Member System</div></div></div>;
}
