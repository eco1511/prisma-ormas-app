import Image from "next/image";

export function PrismaFooter({ compact = false }: { compact?: boolean }) {
  return <footer className={`shrink-0 border-t border-slate-200 bg-white px-5 ${compact ? "mt-8 py-5" : "py-6"}`}>
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Powered by</span>
      <Image src="/prisma-logo.svg" alt="PRISMA — Pusat Registrasi Manajemen Anggota" width={1765} height={727} className={`h-auto max-w-full object-contain ${compact ? "w-52 sm:w-60" : "w-60 sm:w-72"}`}/>
    </div>
  </footer>;
}
