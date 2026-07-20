# Buku Penghubung Digital (Portal Absensi & Laporan Siswa)

Aplikasi portal sekolah berbasis web untuk membantu yayasan/sekolah amal mengelola absensi, stempel apresiasi (badge), prestasi, dan pengumuman kelas. Wali murid dapat memantau perkembangan ananda secara real-time, memberikan tanggapan/komentar singkat, dan membagikan laporan tersebut secara aman via token publik.

---

## 🛠️ Langkah Inisialisasi & Persiapan Database (Supabase)

Aplikasi ini menggunakan **Supabase** sebagai database cloud dan backend gratis. Ikuti langkah berikut untuk memulai:

1. **Buat Akun & Proyek Baru**:
   - Masuk ke [Supabase](https://supabase.com) dan buat proyek baru (Gratis).
2. **Jalankan Skema Database**:
   - Masuk ke dasbor proyek Supabase Anda.
   - Buka menu **SQL Editor** (ikon terminal di sebelah kiri).
   - Klik **New Query**.
   - Buka file [supabase_setup.sql](./supabase_setup.sql) yang ada di folder proyek ini, salin seluruh kodenya, lalu tempel (*paste*) di SQL Editor Supabase.
   - Klik tombol **Run** di bagian kanan bawah. Database beserta tabel, validasi pembatasan 10 kata, dan data uji coba (seed) siap digunakan!
3. **Dapatkan API Keys**:
   - Buka **Project Settings -> API** di dasbor Supabase Anda.
   - Salin **Project URL** dan **API Key (Anon Public)**.

---

## 💻 Konfigurasi Proyek Lokal

1. **Konfigurasi Variabel Lingkungan (`.env`)**:
   - Buka file `.env` di folder utama proyek ini.
   - Ubah nilai variabel berikut sesuai dengan API Keys yang Anda salin dari Supabase:
     ```env
     VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```
2. **Instalasi Dependensi**:
   - Buka terminal di folder proyek ini dan jalankan:
     ```bash
     npm install
     ```
3. **Jalankan Server Lokal**:
   - Jalankan perintah berikut untuk membuka server uji coba lokal:
     ```bash
     npm run dev
     ```
   - Buka alamat URL yang tertera di terminal (biasanya `http://localhost:5173`) pada browser Anda.

---

## 🔑 Akun Uji Coba Default

Berdasarkan data awal (seed data) di database, Anda dapat langsung login menggunakan:

- **Akun Guru (Wali Kelas)**:
  - Username: `guru`
  - Password: `amal123`
- **Akun Wali Murid (Budi)**:
  - Username: `budi`
  - Password: `buku123`
- **Akses Laporan Publik (Tanpa Login)**:
  - Buka di browser: `http://localhost:5173/?token=tkn_budi_xyz123`

---

## 🚀 Deployment ke GitHub Pages (Gratis Selamanya)

Aplikasi ini telah dikonfigurasi untuk di-deploy ke **GitHub Pages** secara instan.

1. **Inisialisasi Git & Hubungkan ke GitHub**:
   - Jalankan perintah berikut di terminal:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
     ```
2. **Deploy Aplikasi**:
   - Untuk mempublikasikan aplikasi ke internet, cukup jalankan perintah:
     ```bash
     npm run deploy
     ```
   - Perintah ini otomatis akan membangun aplikasi (*build*) dan mengunggahnya ke branch `gh-pages` di repositori GitHub Anda.
   - Setelah selesai, buka pengaturan repositori GitHub Anda -> **Pages** -> pastikan source-nya mengarah ke branch `gh-pages` (root).
   - Aplikasi Anda akan aktif dan dapat diakses publik melalui URL: `https://USERNAME_ANDA.github.io/NAMA_REPO_ANDA/`

---

## ⚙️ Pengembangan Selanjutnya

Struktur folder proyek ini dirancang agar modular dan mudah dipahami:
- [src/App.jsx](./src/App.jsx) - Mengatur sesi login dan routing halaman utama.
- [src/index.css](./src/index.css) - Desain sistem premium (mobile-first, glassmorphism, hijau-emas).
- [src/supabaseClient.js](./src/supabaseClient.js) - Menghubungkan aplikasi React dengan backend Supabase.
- [src/components/](./src/components) - Berisi tombol, modal, dan kartu visual kustom.
- [src/pages/](./src/pages) - Berisi halaman Login, Dashboard Guru, Dashboard Wali Murid, dan Halaman Laporan Publik.
