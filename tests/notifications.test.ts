import test from "node:test";
import assert from "node:assert/strict";
import { notificationActions, notificationItem } from "../lib/notifications";
test("pendaftaran dan pendaftaran ulang menuju antrean verifikasi", () => {
  for (const action of ["REGISTER", "REGISTER_RESUBMIT"]) {
    assert.ok(notificationActions.includes(action));
    const item = notificationItem({ _id: "registration", action, details: { name: "Siti" }, createdAt: "2026-10-03T01:00:00Z" }, new Date(0));
    assert.equal(item.href, "/pengurus/verifikasi");
    assert.equal(item.read, false);
    assert.match(item.message, /Siti/);
  }
});
test("mutasi menuju halaman pengajuan dan batas baca bersifat inklusif", () => {
  const timestamp = "2026-10-03T02:00:00Z";
  const event = { _id: "mutation", action: "MUTATION_REQUEST", details: { name: "Budi", requestType: "Mutasi" }, createdAt: timestamp };
  const item = notificationItem(event, new Date(timestamp));
  assert.equal(item.href, "/pengurus/mutasi");
  assert.equal(item.read, true);
  assert.match(item.message, /Budi mengajukan Mutasi/);
  assert.equal(notificationItem(event, new Date("2026-10-03T01:59:59Z")).read, false);
});
test("riwayat lama tanpa nama tetap dapat ditampilkan", () => {
  const item = notificationItem({ _id: "old", action: "REGISTER", createdAt: new Date(0) }, new Date(0));
  assert.match(item.message, /Anggota/);
});

test("notifikasi menampilkan nama jabatan dan wilayah kabupaten", () => {
  const item = notificationItem({ _id: "member", action: "REGISTER", details: { name: "Siti", position: "Ketua", membershipType: "Cabang", branchType: "Kabupaten/Kota", city: "Kota Bandung", province: "Jawa Barat" }, createdAt: new Date(0) }, new Date(0));
  assert.equal(item.name, "Siti");
  assert.equal(item.position, "Ketua");
  assert.equal(item.region, "Kota Bandung, Jawa Barat");
});
test("wilayah pusat nasional dan cabang provinsi hanya provinsi", () => {
  const event = { _id: "member", action: "MUTATION_REQUEST", createdAt: new Date(0) };
  assert.equal(notificationItem({ ...event, details: { branchType: "Pusat", province: "Jawa Barat" } }, new Date(0)).region, "Nasional");
  assert.equal(notificationItem({ ...event, details: { branchType: "Provinsi", province: "Jawa Barat", city: "Kota Bandung" } }, new Date(0)).region, "Jawa Barat");
});
test("riwayat lama memakai profil dan riwayat baru mempertahankan data saat pengajuan", () => {
  const event = { _id: "member", action: "MUTATION_REQUEST", details: { name: "Budi" }, createdAt: new Date(0) };
  const current = { name: "Budi Baru", position: "Sekretaris", branchType: "Provinsi", province: "Jawa Barat" };
  const legacy = notificationItem(event, new Date(0), current);
  assert.equal(legacy.name, "Budi");
  assert.equal(legacy.position, "Sekretaris");
  assert.equal(legacy.region, "Jawa Barat");
  const snapshot = notificationItem({ ...event, details: { name: "Budi", position: "Ketua", branchType: "Pusat", province: "", city: "" } }, new Date(0), current);
  assert.equal(snapshot.position, "Ketua");
  assert.equal(snapshot.region, "Nasional");
  const missing = notificationItem(event, new Date(0));
  assert.equal(missing.position, "Belum ditentukan");
  assert.equal(missing.region, "Belum ditentukan");
});
