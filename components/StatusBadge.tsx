export function StatusBadge({ status, pendingLabel = "Pending" }: { status: string; pendingLabel?: string }) {
  const map: Record<string, string> = {
    active: "badge-active", approved: "badge-active",
    pending: "badge-pending",
    rejected: "badge-rejected", inactive: "bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 text-xs font-bold",
  };
  const label: Record<string, string> = { active: "Aktif", approved: "Disetujui", pending: pendingLabel, rejected: "Ditolak", inactive: "Tidak aktif" };
  return <span className={map[status] || map.inactive}>{label[status] || status}</span>;
}


