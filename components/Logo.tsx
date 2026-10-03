"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Users } from "lucide-react";

type LogoSettings = { logoUrl?: string; organizationName?: string };

export function Logo({ dark = false }: { dark?: boolean }) {
  const [settings, setSettings] = useState<LogoSettings>({});

  useEffect(() => {
    let active = true;
    const loadSettings = () => {
      fetch("/api/settings")
        .then((response) => {
          if (!response.ok) throw new Error("Pengaturan logo gagal dimuat.");
          return response.json();
        })
        .then((data: LogoSettings) => {
          if (active) setSettings(data);
        })
        .catch((error) => console.error(error));
    };
    loadSettings();
    window.addEventListener("organization-settings-updated", loadSettings);
    return () => {
      active = false;
      window.removeEventListener("organization-settings-updated", loadSettings);
    };
  }, []);

  return <div className="flex items-center gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200/40">{settings.logoUrl?<Image src={settings.logoUrl} alt={`Logo ${settings.organizationName||"organisasi"}`} width={40} height={40} unoptimized className="h-full w-full object-contain"/>:<Users size={20}/>}</div><div><div className={`font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>{settings.organizationName||"PRISMA"}</div></div></div>;
}
