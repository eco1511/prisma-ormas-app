# Catatan Migrasi HTML → Next.js + MongoDB

Prototype HTML asli terdiri dari halaman statis dengan Tailwind CDN dan beberapa interaksi JavaScript sederhana. Konversi ini memetakan modulnya menjadi route Next.js berikut:

| Prototype HTML | Next.js |
|---|---|
| `landingpage` | `/` dan `/daftar` |
| `login-anggota` | `/login/anggota` |
| `login-pengurus` | `/login/pengurus` |
| `dashboard-anggota` | `/anggota/dashboard` |
| `pengaturan-profile-anggota` | `/anggota/profil` |
| `dashboard-pengurus` | `/pengurus/dashboard` |
| `database-anggota` | `/pengurus/anggota` |
| `verifikasi-anggota` | `/pengurus/verifikasi` |
| `mutasi-anggota` | `/pengurus/mutasi` |
| `master-jenjang` | `/pengurus/master/jenjang` |
| `master-jabatan` | `/pengurus/master/jabatan` |
| `pengaturan-pengurus` | `/pengurus/pengaturan` |
| `keamanan-admin` | `/pengurus/keamanan` |
| `dashboard-superadmin` | `/superadmin/dashboard` |

## Perubahan arsitektur

1. Hard-coded sample data diganti collection MongoDB/Mongoose.
2. Form pendaftaran membuat `Member` dan akun `User` role `member`.
3. Login memakai JWT pada cookie HTTP-only.
4. Middleware membatasi halaman berdasarkan role.
5. Admin dapat menyetujui/menolak pendaftaran; nomor anggota dibuat saat disetujui.
6. Mutasi/status anggota menggunakan collection `Mutation` dan workflow approval.
7. Jenjang dan jabatan menjadi master data MongoDB.
8. Pengaturan organisasi disimpan pada collection `Setting`.
9. Dashboard superadmin memakai collection `Organization` untuk agregasi nasional.
10. Aktivitas penting disiapkan untuk dicatat melalui `AuditLog`.

## Catatan produksi

- Upload lokal di `public/uploads` perlu diganti object storage untuk deployment serverless.
- Tambahkan validasi upload, rate limiting, CSRF strategy sesuai pola deployment, backup MongoDB, dan kebijakan retensi data sebelum digunakan dengan data pribadi nyata.
- Ganti seluruh password akun seed dan `AUTH_SECRET` pada instalasi nyata.
