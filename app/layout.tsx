import type { Metadata } from "next";
import "./globals.css";
import { DialogProvider } from "@/components/DialogProvider";

export const metadata: Metadata = {
  title: "PRISMA | Pusat Registrasi dan Manajemen Anggota",
  description: "Sistem manajemen anggota PRISMA berbasis web. Daftar, periksa status, dan unduh kartu anggota.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body><DialogProvider>{children}</DialogProvider></body>
    </html>
  );
}
