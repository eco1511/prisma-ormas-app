export const notificationActions = ["REGISTER", "REGISTER_RESUBMIT", "MUTATION_REQUEST"];
export type NotificationMember = {
  name?: string;
  position?: string;
  membershipType?: string;
  branchType?: string;
  province?: string;
  city?: string;
};
export function notificationItem(event: { _id: unknown; action: string; details?: NotificationMember & { requestType?: string }; createdAt: Date | string }, readThrough: Date, member?: NotificationMember) {
  const mutation = event.action === "MUTATION_REQUEST";
  const details = { ...member, ...event.details };
  const name = details.name || "Anggota";
  const position = details.position || "Belum ditentukan";
  const region = details.membershipType === "Pusat" || details.branchType === "Pusat"
    ? "Nasional"
    : (details.branchType === "Provinsi" ? details.province : [details.city, details.province].filter(Boolean).join(", ")) || "Belum ditentukan";
  return {
    id: String(event._id),
    title: mutation ? "Pengajuan mutasi & status" : "Pendaftaran anggota",
    message: mutation ? name + " mengajukan " + (event.details?.requestType || "perubahan status") + "." : name + " mendaftar dan menunggu verifikasi.",
    name, position, region,
    href: mutation ? "/pengurus/mutasi" : "/pengurus/verifikasi",
    createdAt: event.createdAt,
    read: new Date(event.createdAt) <= readThrough,
  };
}
