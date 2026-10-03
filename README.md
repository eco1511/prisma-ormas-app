# PRISMA â€” Next.js + MongoDB

Konversi aplikasi HTML PRISMA menjadi aplikasi **Next.js App Router + TypeScript + Tailwind CSS + MongoDB/Mongoose**.

## Modul yang tersedia

- Landing page dan pendaftaran anggota
- Login Anggota, Admin, dan Super Admin
- Dashboard anggota + E-KTA sederhana
- Pengajuan mutasi/perubahan jabatan/status
- Dashboard pengurus
- Verifikasi pendaftaran
- Database anggota
- Master jenjang dan jabatan
- Pengaturan organisasi dan buka/tutup pendaftaran
- Ubah kata sandi admin
- Dashboard Super Admin untuk agregasi organisasi/pengurus
- Audit log dasar untuk login/verifikasi/perubahan data

## 1. Persiapan MongoDB

### MongoDB lokal / Compass
Jalankan MongoDB di port standar lalu gunakan:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/prisma_anggota
```

### MongoDB Atlas
Ganti dengan connection string Atlas Anda, misalnya:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/prisma_anggota
```

Pastikan IP komputer/server sudah diizinkan pada Network Access Atlas.

## 2. Instalasi

```bash
npm install
copy .env.example .env.local
```

Di Windows PowerShell dapat menggunakan:

```powershell
Copy-Item .env.example .env.local
```

Isi `AUTH_SECRET` dengan string acak minimal 32 karakter.

## 3. Data awal

```bash
npm run seed
```

Akun demo:

- Admin: `admin@prisma.com` / `Admin123!`
- Super Admin: `root@prisma.com` / `Admin123!`
- Anggota: NIK `3271000000000001` / `Anggota123!`

**Ganti password demo setelah instalasi.**

## 4. Menjalankan

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Struktur URL

- `/` â€” Landing page
- `/daftar` â€” Pendaftaran anggota
- `/login/anggota` â€” Login anggota
- `/login/pengurus` â€” Login admin/superadmin
- `/anggota/dashboard` â€” Dashboard anggota
- `/anggota/profil` â€” Profil anggota
- `/pengurus/dashboard` â€” Dashboard pengurus
- `/pengurus/verifikasi` â€” Verifikasi pendaftaran
- `/pengurus/anggota` â€” Database anggota
- `/pengurus/mutasi` â€” Mutasi/status
- `/pengurus/master/jenjang` â€” Master jenjang
- `/pengurus/master/jabatan` â€” Master jabatan
- `/pengurus/pengaturan` â€” Pengaturan sistem
- `/pengurus/keamanan` â€” Keamanan admin
- `/superadmin/dashboard` â€” Dashboard super admin

## Catatan upload file

Versi ini menyimpan file upload ke `public/uploads` dan **path file** ke MongoDB. Ini cocok untuk development/local server. Untuk production/serverless (mis. Vercel), pindahkan file ke object storage seperti S3/Cloudinary/MinIO dan tetap simpan URL-nya di MongoDB.

## Keanggotaan, wilayah, dan kartu digital

- Pendaftaran: pilih Pusat atau Cabang. Cabang memilih Provinsi atau Kabupaten/Kota. Cabang provinsi tidak menyimpan kabupaten/kota; pusat ditampilkan sebagai Nasional.
- Master lokal memuat 38 provinsi dan 514 kabupaten/kota, sehingga dropdown tetap tersedia tanpa layanan eksternal. Sumber: https://www.emsifa.com/api-wilayah-indonesia/v2/ (snapshot 27 September 2026, turunan cahyadsn/wilayah).
- Jalankan `npm run seed:master` untuk mengisi/update koleksi regions dan jabatan Ketua, Sekretaris, Bendahara, Anggota pada tiap tingkat. Perintah ini idempoten dan tidak mereset akun atau data anggota.
- Setelah nomor anggota terbit, kartu berisi nama, foto, nomor anggota, Pusat/Cabang, status Aktif/Tidak aktif, nama daerah, serta QR. PDF diunduh pada ukuran 85,6 x 53,98 mm, tanpa isi dashboard. Cetak pada skala 100%.
- QR mengarah ke /verifikasi/[nomor-anggota], dengan status terbaru dan hanya identitas publik yang diperlukan. Untuk kartu yang dipakai di luar komputer lokal, unduh dari alamat domain aplikasi yang dapat diakses pemindai.
- Pencarian dashboard menyediakan filter Aktif, Pending, Tidak aktif, dan Ditolak.
- Saat mendaftar, anggota dapat mengunggah foto (JPG/PNG) dan KTP (JPG/PNG/PDF), masing-masing maksimal 5 MB. SK Pengangkatan hanya diunggah melalui profil anggota.
- Berkas baru disimpan di storage/uploads, bukan public. Atur UPLOAD_DIR ke volume persisten saat deployment dan sertakan direktori itu dalam backup. Akses /api/files/[nama] memerlukan login pemilik atau pengurus. Berkas lama di public/uploads tidak otomatis dipindahkan.
- Anggota lama tanpa afiliasi tidak otomatis dianggap Pusat/Cabang; kartu menampilkan Belum ditentukan sampai data afiliasi diperbarui.
- Pemeriksaan: `npm test`, `npx tsc --noEmit`, dan `npm run build`.


## Pendaftaran dan email Gmail

Pendaftaran menyimpan Member pending tanpa membuat User. Persetujuan mengaktifkan anggota dengan pembaruan bersyarat, lalu membuat akun. Jika pembuatan akun gagal, status dikembalikan ke pending. Alur ini mendukung MongoDB standalone maupun replica set. Kata sandi acak disimpan sebagai hash dan dikirim melalui email setelah persetujuan. Jika email gagal, pengurus dapat memakai Kirim Ulang Email; pengiriman ulang persetujuan menghasilkan kata sandi baru. Data pendaftar lama tidak dihapus otomatis.

Email persetujuan dan penolakan memakai layanan SMTP Gmail yang sama. Lengkapi .env.local:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_AUTH_TYPE=password
SMTP_USER=alamat-anda@gmail.com
SMTP_PASS=app-password-gmail-anda
SMTP_FROM="PRISMA <alamat-anda@gmail.com>"
```

Aktifkan Verifikasi 2 Langkah pada akun Google lalu buat App Password di https://myaccount.google.com/apppasswords . Gunakan App Password 16 karakter pada SMTP_PASS. SMTP_USER dan alamat di SMTP_FROM harus sesuai akun Gmail pengirim. Pengaturan OAuth2 Microsoft tidak diperlukan. Petunjuk Google: https://support.google.com/accounts/answer/185833 .

APP_URL harus alamat aplikasi yang dapat diakses anggota. Restart aplikasi setelah mengubah .env.local. Jalankan `npm run check:smtp` untuk memeriksa konfigurasi, koneksi dan autentikasi tanpa mengirim email. Log SMTP hanya berisi kode kegagalan dan status respons.

Penolakan pendaftaran dan mutasi mengirim jenis permohonan serta alasan penolakan. Keputusan tetap tersimpan apabila email gagal; pengurus diberi pesan kegagalan. Saat pendaftaran ditolak, data permohonan, akun anggota lama yang terkait, dan berkas foto/KTP/SK dihapus. Pemohon dapat mendaftar kembali dengan NIK/email yang sama. Email penolakan menggunakan data pemohon yang diambil sebelum penghapusan. Jika pengiriman gagal, data tetap dihapus dan hasilnya diberitahukan kepada pengurus. Tombol Kirim Ulang Email tersedia untuk email persetujuan yang gagal selama halaman verifikasi masih terbuka.

## Tambah, edit, impor, dan ekspor anggota

Pada Database Anggota, pengurus dapat menambah anggota dan mengedit identitas, kontak, afiliasi, jabatan, serta wilayah. Perubahan nama/email/NIK ikut memperbarui akun anggota yang terkait. Status dikelola melalui verifikasi dan mutasi. Anggota baru yang ditambahkan atau diimpor berstatus Pending; akun dan nomor anggota diterbitkan melalui alur persetujuan yang sama dengan pendaftaran publik.

- Format Excel: tombol Format Excel, atau public/templates/format-import-anggota.xlsx. Isi sheet Anggota mulai baris 2. Sheet Panduan berisi aturan dan contoh; sheet Wilayah berisi referensi nama provinsi/kabupaten/kota.
- Impor menerima .xlsx, maksimal 5 MB dan 1.000 anggota per file. Periksa File menampilkan pratinjau sebelum penyimpanan. Hanya baris valid yang diimpor; NIK/email ganda serta baris tidak valid dilewati dan dilaporkan. Data anggota lama tidak ditimpa.
- NIK dan telepon harus berupa teks, termasuk angka nol di depan. Rumus dan tautan Excel tidak diterima. Tanggal lahir menerima tanggal Excel atau teks YYYY-MM-DD.
- Ekspor PDF berisi ringkasan anggota dalam tabel landscape dengan header dan nomor halaman. Ekspor Excel memuat profil, nomor anggota, status, tanggal daftar/verifikasi, dan catatan verifikasi. Semua ekspor mengikuti filter yang sudah diterapkan, sampai 10.000 hasil; batas 500 baris tabel tidak membatasi ekspor.
- API tambah/edit/impor/ekspor dibatasi untuk pengurus, dengan pengecualian edit profil anggota sendiri sesuai hak akses yang sudah ada.
