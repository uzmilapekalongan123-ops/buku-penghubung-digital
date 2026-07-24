-- =========================================================================
-- SKEMA DATABASE: BUKU PENGHUBUNG DIGITAL
-- Jalankan skrip ini di SQL Editor Supabase Anda.
-- =========================================================================

-- Bersihkan tabel jika ada (opsional, hati-hati jika di production)
DROP TABLE IF EXISTS komentar CASCADE;
DROP TABLE IF EXISTS prestasi CASCADE;
DROP TABLE IF EXISTS pengumuman CASCADE;
DROP TABLE IF EXISTS absensi CASCADE;
DROP TABLE IF EXISTS catatan_stempel CASCADE;
DROP TABLE IF EXISTS master_badge CASCADE;
DROP TABLE IF EXISTS siswa CASCADE;
DROP TABLE IF EXISTS kelas CASCADE;

-- 1. Tabel Kelas & Wali Kelas
CREATE TABLE kelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas VARCHAR(255) NOT NULL,
    nama_wali VARCHAR(255) NOT NULL,
    wa_wali VARCHAR(50) NOT NULL,
    username VARCHAR(100) DEFAULT 'guru' NOT NULL,
    password VARCHAR(100) DEFAULT 'amal123' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Siswa & Akun Wali Murid
CREATE TABLE siswa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelas_id UUID REFERENCES kelas(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_siswa VARCHAR(255) NOT NULL,
    alamat TEXT,
    nama_ortu VARCHAR(255) NOT NULL,
    wa_ortu VARCHAR(50) NOT NULL,
    token VARCHAR(100) UNIQUE NOT NULL, -- Token untuk link publik, diganti berkala
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Katalog Stempel (Master Badge)
CREATE TABLE master_badge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_stempel VARCHAR(255) NOT NULL,
    simbol VARCHAR(50) NOT NULL, -- Emoji
    gambar_url TEXT, -- URL Gambar Kustom opsional
    deskripsi TEXT NOT NULL,
    grup_stempel VARCHAR(100) NOT NULL, -- 'Apresiasi', 'Disiplin', 'Evaluasi', dll.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Catatan Stempel Siswa
CREATE TABLE catatan_stempel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES master_badge(id) ON DELETE CASCADE,
    tanggal_waktu TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Catatan Absensi
CREATE TABLE absensi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpa')),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Memastikan satu siswa hanya punya satu catatan absensi per hari
    UNIQUE (siswa_id, tanggal)
);

-- 6. Tabel Papan Pengumuman
CREATE TABLE pengumuman (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kelas_id UUID REFERENCES kelas(id) ON DELETE SET NULL, -- NULL jika pengumuman umum/semua kelas
    tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
    kategori VARCHAR(100) NOT NULL, -- 'Kegiatan', 'Informasi', 'Urgent'
    isi TEXT NOT NULL,
    link_luar TEXT, -- Tautan Google Drive foto kegiatan dsb
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Catatan Prestasi Siswa
CREATE TABLE prestasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    siswa_id UUID REFERENCES siswa(id) ON DELETE CASCADE,
    tanggal DATE DEFAULT CURRENT_DATE NOT NULL,
    judul_prestasi VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Komentar
CREATE TABLE komentar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengumuman_id UUID REFERENCES pengumuman(id) ON DELETE CASCADE,
    nama_user VARCHAR(255) NOT NULL,
    komentar TEXT NOT NULL,
    parent_id UUID REFERENCES komentar(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Constraint validasi maksimal 10 kata di database PostgreSQL
    CONSTRAINT limit_sepuluh_kata CHECK (
        array_length(regexp_split_to_array(trim(komentar), '\s+'), 1) <= 10
    )
);

-- =========================================================================
-- DATA AWAL (SEEDING) UNTUK UJI COBA
-- =========================================================================

-- Seed Kelas
INSERT INTO kelas (id, nama_kelas, nama_wali, wa_wali) VALUES
('b3c66f54-d841-47cc-98f9-d5c2e17ea478', 'Kelas 1-A Ibnu Sina', 'Ustadzah Fatimah', '6281234567890');

-- Seed Siswa & Wali Murid (Password default: 'buku123')
INSERT INTO siswa (id, kelas_id, username, password, nama_siswa, alamat, nama_ortu, wa_ortu, token) VALUES
('a1111111-1111-1111-1111-111111111111', 'b3c66f54-d841-47cc-98f9-d5c2e17ea478', 'budi', 'buku123', 'Ahmad Budi', 'Jl. Kenanga No. 12, Surabaya', 'Bapak Joko', '6289876543210', 'tkn_budi_xyz123'),
('a2222222-2222-2222-2222-222222222222', 'b3c66f54-d841-47cc-98f9-d5c2e17ea478', 'cici', 'buku123', 'Cici Amelia', 'Jl. Melati No. 5, Surabaya', 'Ibu Rina', '6289876543211', 'tkn_cici_abc456'),
('a3333333-3333-3333-3333-333333333333', 'b3c66f54-d841-47cc-98f9-d5c2e17ea478', 'dedi', 'buku123', 'Dedi Wijaya', 'Jl. Mawar No. 8, Surabaya', 'Bapak Budi', '6289876543212', 'tkn_dedi_qwe789');

-- Seed Master Badge (Menggunakan UUID valid berawalan 'b' untuk Badge)
INSERT INTO master_badge (id, nama_stempel, simbol, gambar_url, deskripsi, grup_stempel) VALUES
('b1111111-1111-1111-1111-111111111111', 'Sangat Disiplin', '⏰', NULL, 'Diberikan kepada siswa yang selalu datang tepat waktu dan tertib mengumpulkan tugas.', 'Disiplin'),
('b2222222-2222-2222-2222-222222222222', 'Suka Membantu', '🤝', NULL, 'Diberikan kepada siswa yang menunjukkan sikap kepedulian sosial yang tinggi terhadap temannya.', 'Apresiasi'),
('b3333333-3333-3333-3333-333333333333', 'Rajin Membaca', '📖', NULL, 'Diberikan kepada siswa yang aktif meminjam buku perpustakaan atau giat membaca.', 'Apresiasi'),
('b4444444-4444-4444-4444-444444444444', 'Tugas Terlambat', '⚠️', NULL, 'Pemberitahuan/evaluasi bahwa terdapat tugas sekolah yang belum diselesaikan tepat waktu.', 'Evaluasi');

-- Seed Catatan Stempel
INSERT INTO catatan_stempel (siswa_id, badge_id, catatan) VALUES
('a1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Budi tidak pernah terlambat selama sebulan penuh.'),
('a1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 'Membantu membereskan kelas setelah kegiatan belajar mengajar.'),
('a2222222-2222-2222-2222-222222222222', 'b3333333-3333-3333-3333-333333333333', 'Menyelesaikan tantangan membaca 5 buku cerita.');

-- Seed Absensi
INSERT INTO absensi (siswa_id, tanggal, status, keterangan) VALUES
('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 2, 'Hadir', 'Datang tepat waktu'),
('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 2, 'Hadir', 'Datang tepat waktu'),
('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 2, 'Sakit', 'Demam tinggi, sedang istirahat di rumah'),
('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 'Hadir', 'Datang tepat waktu'),
('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, 'Izin', 'Ada keperluan keluarga di luar kota'),
('a3333333-3333-3333-3333-333333333333', CURRENT_DATE - 1, 'Hadir', 'Sudah sembuh');

-- Seed Pengumuman (Menggunakan UUID valid berawalan 'e' untuk announcement/event)
INSERT INTO pengumuman (id, kelas_id, tanggal, kategori, isi, link_luar) VALUES
('e1111111-1111-1111-1111-111111111111', 'b3c66f54-d841-47cc-98f9-d5c2e17ea478', CURRENT_DATE - 1, 'Kegiatan', 'Buku Penghubung Digital resmi diluncurkan! Wali murid dapat memantau perkembangan ananda mulai hari ini.', 'https://drive.google.com'),
('e2222222-2222-2222-2222-222222222222', 'b3c66f54-d841-47cc-98f9-d5c2e17ea478', CURRENT_DATE, 'Informasi', 'Pemberitahuan kerja bakti wali murid hari Ahad besok jam 07:00 pagi. Harap membawa perlengkapan kebersihan.', NULL);

-- Seed Catatan Prestasi
INSERT INTO prestasi (siswa_id, tanggal, judul_prestasi, deskripsi) VALUES
('a1111111-1111-1111-1111-111111111111', CURRENT_DATE - 5, 'Juara 1 Lomba Adzan', 'Meraih predikat juara 1 dalam rangka memperingati Tahun Baru Islam tingkat kecamatan.'),
('a2222222-2222-2222-2222-222222222222', CURRENT_DATE - 3, 'Hafalan Juz 30 Selesai', 'Telah menyelesaikan setoran hafalan Juz 30 (Juz Amma) dengan predikat Jayyid Jiddan.');

-- Seed Komentar (Semua memenuhi batas 10 kata)
INSERT INTO komentar (pengumuman_id, nama_user, komentar, parent_id) VALUES
('e1111111-1111-1111-1111-111111111111', 'Bapak Joko', 'Alhamdulillah aplikasi ini sangat membantu wali murid.', NULL),
('e1111111-1111-1111-1111-111111111111', 'Ustadzah Fatimah', 'Sama-sama pak, semoga bermanfaat untuk bersama.', NULL);
