<p align="center">
  <img src="src/assets/logo.png" alt="Buku Penghubung Digital" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">📗 Buku Penghubung Digital</h1>

<p align="center">
  <strong>A modern, mobile-first Progressive Web App for school–parent communication</strong><br/>
  <em>Real-time attendance tracking · Appreciation badges · Achievement records · Class announcements</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.1-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Supabase-BaaS-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa&logoColor=white" alt="PWA" />
  <img src="https://img.shields.io/badge/Deploy-GitHub%20Pages-222222?style=flat-square&logo=github&logoColor=white" alt="GitHub Pages" />
  <img src="https://img.shields.io/badge/License-Amal%20(Charity)-d4af37?style=flat-square" alt="Charity Project" />
</p>

<p align="center">
  <a href="https://uzmilapekalongan123-ops.github.io/buku-penghubung-digital/">🌐 Live Demo (School)</a> ·
  <a href="https://asadiabdullah.github.io/buku-penghubung-digital/">🌐 Live Demo (Dev)</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-database-schema">Database Schema</a> ·
  <a href="#-architecture">Architecture</a>
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Migration](#-database-migration)
- [Available Scripts](#-available-scripts)
- [Deployment](#-deployment)
- [PWA & Offline Support](#-pwa--offline-support)
- [Design System](#-design-system)
- [Screenshots & User Flows](#-screenshots--user-flows)
- [Engineering Notes](#-engineering-notes)
- [Credits & License](#-credits--license)

---

## 🌟 Overview

**Buku Penghubung Digital** (Digital Communication Book) is a full-featured web application designed for elementary Islamic schools (*Madrasah Diniyah*) to bridge the communication gap between classroom teachers (*Wali Kelas*) and student guardians (*Wali Murid*).

This project replaces the traditional paper-based "buku penghubung" (parent-teacher liaison book) with a modern, real-time digital platform — accessible from any device as an installable PWA.

> **🕌 Charity Project** — Built as a charitable (*amal*) initiative for **Uzmilatul Khorioh**, a religious education institution in Pekalongan, Indonesia.

### The Problem

Traditional paper liaison books suffer from:
- ❌ Physical books get lost, damaged, or forgotten at home
- ❌ Parents only see information when the child brings the book home
- ❌ No real-time attendance or achievement tracking
- ❌ Teachers must write the same announcement repeatedly across multiple books
- ❌ Extended family (grandparents, relatives) have no access

### The Solution

Buku Penghubung Digital provides:
- ✅ **Instant digital access** from any smartphone, tablet, or desktop
- ✅ **Real-time sync** of attendance, badges, achievements, and announcements
- ✅ **Token-based public links** for sharing read-only reports with extended family via WhatsApp
- ✅ **Installable PWA** with offline-capable service worker and auto-update notifications
- ✅ **Zero infrastructure cost** — deployed as a static site on GitHub Pages with Supabase free tier

---

## 🚀 Key Features

### 👩‍🏫 Teacher / Homeroom Teacher Dashboard (`/admin`)

| Module | Description |
|--------|-------------|
| **📋 Attendance Management** | Record daily attendance (Present / Sick / Excused / Absent) for the entire class at once. Real-time student search filter. Bulk upsert to database with a single click. |
| **👥 Student Management** | Full CRUD operations for student records (name, parent name, parent WhatsApp, address, login credentials). Auto-generate unique public access tokens (`tkn_...`). Batch-reset all tokens with security confirmation. |
| **⭐ Appreciation Badge System** | Award emoji or custom-image badges to individual students with personalized notes. Filter badges by category group (Appreciation, Discipline, Evaluation, etc.). View badge history per student with revocation capability. Create new badge catalog entries with emoji picker or image upload (≤50KB Base64). Delete badges from master catalog with cascade confirmation. |
| **🏆 Achievement Records** | Log student achievements, competition results, and milestones with date and detailed descriptions. |
| **📢 Announcements Board** | Publish class/school announcements with categorization (Information, Activity, Very Important). Attach Google Drive documentation links. "Very Important" announcements auto-replace previous urgent ones. Teacher comment/reply system on announcements. |
| **🔐 Credential Management** | Edit homeroom teacher profile (name, WhatsApp number) and login credentials (username, password) directly from the dashboard header. |

### 👨‍👩‍👧 Parent / Guardian Dashboard

| Module | Description |
|--------|-------------|
| **📅 Interactive Attendance Calendar** | Monthly calendar grid with color-coded attendance status (Green=Present, Blue=Sick, Orange=Excused, Red=Absent, Gray=Holiday/Sunday). Automatic monthly attendance percentage score calculation. Summary cards with detailed breakdown. Click-to-view daily detail modal. Date-based search functionality. |
| **⭐ Badges & Achievements** | Grouped badge cards with quantity counters (e.g., 5× "Diligent Reader"). Category group filter (All, Appreciation, Discipline, Evaluation). Click badge for detailed timeline with teacher's personalized notes. Achievement timeline view. |
| **📢 Announcements Feed** | Class and school announcement stream. Direct Google Drive links for event photos/documentation. Interactive comment/response system with strict 10-word limit validation (maintaining brevity and respect). **Auto-popup for "Very Important" announcements** on portal open. |
| **🔗 Public Report Sharing** | One-click "Copy Public Report Link" button to share a token-based read-only URL with extended family via WhatsApp — no login required. |

### 🌐 Public Report View (`?token=tkn_xxx`)

| Feature | Description |
|---------|-------------|
| **Read-Only Access** | Secure, token-authenticated read-only view. No data manipulation capabilities exposed. |
| **Complete Overview** | Full attendance statistics, monthly calendar, grouped badges, achievement records, and school announcements. |
| **No Login Required** | Accessible by anyone with the unique token link — perfect for sharing with grandparents and relatives. |

---

## 🛠 Tech Stack

### Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| [**React**](https://react.dev/) | `19.2.7` | UI library — latest version with concurrent features |
| [**Vite**](https://vite.dev/) | `8.1.1` | Next-generation build tool and dev server |
| [**JavaScript (ES2022+)**](https://tc39.es/) | — | Primary language (modern ESM modules) |

### Backend-as-a-Service (BaaS)

| Technology | Version | Purpose |
|------------|---------|---------|
| [**Supabase**](https://supabase.com/) | `2.110.7` | PostgreSQL database, authentication, and real-time subscriptions |
| [**PostgreSQL**](https://www.postgresql.org/) | `15+` | Relational database engine (hosted on Supabase, Tokyo region) |

### UI & Design

| Technology | Version | Purpose |
|------------|---------|---------|
| [**Lucide React**](https://lucide.dev/) | `1.25.0` | Modern, tree-shakeable SVG icon library (17 icons used) |
| [**Google Fonts (Outfit)**](https://fonts.google.com/specimen/Outfit) | `300–700` | Premium geometric sans-serif typeface |
| **Custom CSS** | — | Hand-crafted design system with CSS custom properties |

### Build & Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| [**Vite Plugin PWA**](https://vite-pwa-org.netlify.app/) | `1.3.0` | Service worker generation, manifest, and offline support |
| [**@vitejs/plugin-react**](https://github.com/vitejs/vite-plugin-react) | `6.0.3` | React Fast Refresh and JSX transformation |
| [**OxLint**](https://oxc.rs/docs/guide/usage/linter.html) | `1.71.0` | High-performance Rust-based JavaScript linter |
| [**gh-pages**](https://github.com/tschaub/gh-pages) | `6.3.0` | Automated deployment to GitHub Pages |

### Database Administration

| Technology | Version | Purpose |
|------------|---------|---------|
| [**node-postgres (pg)**](https://node-postgres.com/) | `8.22.0` | Node.js PostgreSQL client for database migration scripts |

### Engineering Tooling

| Tool | Purpose |
|------|---------|
| [**Google Antigravity**](https://deepmind.google/) | AI-assisted pair programming for architecture, implementation, debugging, and deployment |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser / PWA)                    │
│                                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐ │
│  │  Login    │  │   Admin      │  │   Parent     │  │ Public  │ │
│  │  (Dual   │  │  Dashboard   │  │  Dashboard   │  │ Report  │ │
│  │   Role)  │  │  (5 Tabs)    │  │  (3 Tabs)    │  │ (Token) │ │
│  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └────┬────┘ │
│       │               │                 │                │      │
│       └───────────────┴─────────────────┴────────────────┘      │
│                              │                                   │
│                    ┌─────────┴──────────┐                       │
│                    │  Supabase Client   │                       │
│                    │  (supabaseClient)  │                       │
│                    └─────────┬──────────┘                       │
│                              │                                   │
│                    ┌─────────┴──────────┐                       │
│                    │   Service Worker   │                       │
│                    │  (Workbox / PWA)   │                       │
│                    └───────────────────-┘                       │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Tokyo Region)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL 15+                           │   │
│  │                                                          │   │
│  │  kelas ──┬──< siswa ──┬──< absensi                      │   │
│  │          │            ├──< catatan_stempel >── master_    │   │
│  │          │            │                       badge      │   │
│  │          │            └──< prestasi                      │   │
│  │          │                                               │   │
│  │          └──< pengumuman ──< komentar (self-referencing) │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────────┐   │
│  │  REST API  │  │  Auth (Anon) │  │  Row Level Security    │   │
│  └────────────┘  └──────────────┘  └────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     HOSTING (GitHub Pages)                        │
│                                                                  │
│   Static SPA bundle (dist/) served via gh-pages branch           │
│   Two deployment targets:                                        │
│   • School org:  uzmilapekalongan123-ops.github.io               │
│   • Developer:   asadiabdullah.github.io                         │
└──────────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User** opens the app URL → GitHub Pages serves the static SPA bundle
2. **React App** initializes → detects route (`/admin`, `?token=`, or default)
3. **Authentication** → credentials validated against `kelas` (teacher) or `siswa` (parent) table via Supabase REST API
4. **Data Operations** → all CRUD performed through `@supabase/supabase-js` client library
5. **PWA Service Worker** → caches assets for offline access; prompts user with "Update Now" banner when new version is deployed

---

## 🗄 Database Schema

The PostgreSQL database consists of **8 interconnected tables** with foreign key constraints, cascading deletes, and validation checks.

### Entity Relationship Diagram

```
┌──────────────────┐
│      kelas       │
│──────────────────│
│ id (PK, UUID)    │
│ nama_kelas       │
│ nama_wali        │
│ wa_wali          │
│ username         │
│ password         │
│ created_at       │
└────────┬─────────┘
         │ 1
         │
    ┌────┴────┐
    │         │
    ▼ N       ▼ N
┌───────────┐  ┌──────────────┐
│   siswa   │  │  pengumuman  │
│───────────│  │──────────────│
│ id (PK)   │  │ id (PK)      │
│ kelas_id  │◄─│ kelas_id     │
│ username  │  │ tanggal      │
│ password  │  │ kategori     │
│ nama_siswa│  │ isi          │
│ alamat    │  │ link_luar    │
│ nama_ortu │  │ created_at   │
│ wa_ortu   │  └──────┬───────┘
│ token (UQ)│         │ 1
│ created_at│         │
└─────┬─────┘         ▼ N
      │          ┌──────────────┐
      │ 1        │   komentar   │
      │          │──────────────│
 ┌────┼────┐     │ id (PK)      │
 │    │    │     │ pengumuman_id│
 ▼N   ▼N   ▼N   │ nama_user    │
┌──┐ ┌──┐ ┌──┐  │ komentar     │ ← CHECK: max 10 words
│Ab│ │CS│ │Pr│  │ parent_id    │ ← self-referencing FK
│se│ │ta│ │es│  │ created_at   │
│ns│ │mp│ │ta│  └──────────────┘
│i │ │el│ │si│
└──┘ └──┘ └──┘

┌──────────────────┐
│  master_badge    │
│──────────────────│
│ id (PK, UUID)    │
│ nama_stempel     │
│ simbol (emoji)   │
│ gambar_url       │ ← Base64 or URL (custom image)
│ deskripsi        │
│ grup_stempel     │ ← 'Apresiasi', 'Disiplin', etc.
│ created_at       │
└────────┬─────────┘
         │ 1
         ▼ N
   catatan_stempel
   (junction: siswa × badge)
```

### Table Details

<details>
<summary><strong>📋 kelas</strong> — Classroom & Homeroom Teacher</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique classroom identifier |
| `nama_kelas` | `VARCHAR(255)` | NOT NULL | Class name (e.g., "Kelas 1A") |
| `nama_wali` | `VARCHAR(255)` | NOT NULL | Homeroom teacher's full name |
| `wa_wali` | `VARCHAR(50)` | NOT NULL | Teacher's WhatsApp number |
| `username` | `VARCHAR(100)` | NOT NULL, DEFAULT `'guru'` | Teacher login username |
| `password` | `VARCHAR(100)` | NOT NULL, DEFAULT `'amal123'` | Teacher login password |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>👧 siswa</strong> — Student & Parent Account</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique student identifier |
| `kelas_id` | `UUID` | FK → `kelas(id)` ON DELETE CASCADE | Classroom reference |
| `username` | `VARCHAR(100)` | UNIQUE, NOT NULL | Parent login username |
| `password` | `VARCHAR(100)` | NOT NULL | Parent login password |
| `nama_siswa` | `VARCHAR(255)` | NOT NULL | Student's full name |
| `alamat` | `TEXT` | — | Home address |
| `nama_ortu` | `VARCHAR(255)` | — | Parent/guardian's name |
| `wa_ortu` | `VARCHAR(50)` | — | Parent's WhatsApp number |
| `token` | `VARCHAR(100)` | UNIQUE | Public report access token |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>📊 absensi</strong> — Daily Attendance</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique record identifier |
| `siswa_id` | `UUID` | FK → `siswa(id)` ON DELETE CASCADE | Student reference |
| `tanggal` | `DATE` | DEFAULT `CURRENT_DATE` | Attendance date |
| `status` | `VARCHAR(20)` | CHECK IN `('Hadir','Izin','Sakit','Alpa')` | Attendance status |
| `keterangan` | `TEXT` | — | Additional notes |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

**Unique Constraint:** `(siswa_id, tanggal)` — prevents duplicate entries per student per day.

</details>

<details>
<summary><strong>⭐ master_badge</strong> — Badge Catalog</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique badge identifier |
| `nama_stempel` | `VARCHAR(255)` | NOT NULL | Badge name (e.g., "Diligent Reader") |
| `simbol` | `VARCHAR(10)` | — | Emoji symbol (⭐, ⏰, 🤝, 📖, ⚠️) |
| `gambar_url` | `TEXT` | — | Custom image (Base64 data URI or URL) |
| `deskripsi` | `TEXT` | — | Badge description |
| `grup_stempel` | `VARCHAR(100)` | — | Category group (Apresiasi, Disiplin, Evaluasi) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>🏅 catatan_stempel</strong> — Badge Award Records</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique record identifier |
| `siswa_id` | `UUID` | FK → `siswa(id)` ON DELETE CASCADE | Student reference |
| `badge_id` | `UUID` | FK → `master_badge(id)` ON DELETE CASCADE | Badge reference |
| `tanggal_waktu` | `TIMESTAMPTZ` | DEFAULT `now()` | Award timestamp |
| `catatan` | `TEXT` | — | Teacher's personalized note |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>🏆 prestasi</strong> — Student Achievements</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique record identifier |
| `siswa_id` | `UUID` | FK → `siswa(id)` ON DELETE CASCADE | Student reference |
| `tanggal` | `DATE` | — | Achievement date |
| `judul_prestasi` | `VARCHAR(255)` | — | Achievement title |
| `deskripsi` | `TEXT` | — | Detailed description |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>📢 pengumuman</strong> — Announcements</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique announcement identifier |
| `kelas_id` | `UUID` | FK → `kelas(id)` ON DELETE SET NULL | Class reference (NULL = school-wide) |
| `tanggal` | `DATE` | — | Announcement date |
| `kategori` | `VARCHAR(50)` | — | Category: `Informasi`, `Kegiatan`, `Sangat Penting` |
| `isi` | `TEXT` | — | Announcement content |
| `link_luar` | `TEXT` | — | External link (Google Drive, etc.) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

</details>

<details>
<summary><strong>💬 komentar</strong> — Interactive Comments (Self-Referencing)</summary>

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, `gen_random_uuid()` | Unique comment identifier |
| `pengumuman_id` | `UUID` | FK → `pengumuman(id)` ON DELETE CASCADE | Announcement reference |
| `nama_user` | `VARCHAR(255)` | — | Commenter's display name |
| `komentar` | `TEXT` | CHECK ≤ 10 words | Comment content (enforced brevity) |
| `parent_id` | `UUID` | FK → `komentar(id)` ON DELETE CASCADE | Parent comment (for replies) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT `now()` | Record creation timestamp |

**Special Constraint:** `limit_sepuluh_kata` — Enforces a maximum of 10 words per comment using PostgreSQL regex validation: `CHECK (array_length(regexp_split_to_array(trim(komentar), '\s+'), 1) <= 10)`. This ensures parent-teacher interactions remain concise and respectful.

</details>

---

## 📁 Project Structure

```
buku-penghubung-digital/
│
├── index.html                    # SPA entry point with meta watermarks
├── vite.config.js                # Vite + PWA plugin configuration
├── package.json                  # Dependencies and npm scripts
├── .env                          # Supabase credentials (not committed)
├── .gitignore                    # Git ignore rules
├── .oxlintrc.json                # OxLint configuration
│
├── supabase_setup.sql            # Full database DDL + seed data
├── setup_db.js                   # Node.js automated migration runner
│
├── public/                       # Static assets (copied to dist/)
│   └── logo.png                  # App icon (192×192, used by PWA manifest)
│
├── src/
│   ├── main.jsx                  # React 19 entry + console watermark
│   ├── App.jsx                   # Root component: routing, auth, PWA update
│   ├── App.css                   # App-level styles
│   ├── index.css                 # Global design system (CSS custom properties)
│   ├── supabaseClient.js         # Supabase client initialization
│   │
│   ├── assets/                   # Bundled assets
│   │   ├── logo.png              # School logo
│   │   └── hero.png              # Login hero image
│   │
│   ├── components/               # Reusable UI components
│   │   ├── Button.jsx            # Multi-variant button with loading state
│   │   ├── Card.jsx              # Glassmorphism card container
│   │   └── Modal.jsx             # Backdrop blur dialog with scroll content
│   │
│   └── pages/                    # Page-level components
│       ├── Login.jsx             # Dual-role authentication (Teacher/Parent)
│       ├── AdminDashboard.jsx    # Teacher management dashboard (5 tabs)
│       ├── ParentDashboard.jsx   # Parent portal (3 tabs + public sharing)
│       └── PublicReport.jsx      # Token-based read-only public report
│
└── dist/                         # Production build output (auto-generated)
    ├── index.html
    ├── manifest.webmanifest
    ├── sw.js                     # Generated service worker
    ├── workbox-*.js              # Workbox runtime
    └── assets/
        ├── index-*.css
        └── index-*.js
```

---

## 🏁 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| **Node.js** | `18.0+` (LTS recommended) |
| **npm** | `9.0+` |
| **Git** | `2.30+` |
| **Supabase Account** | Free tier is sufficient |

### 1. Clone the Repository

```bash
git clone https://github.com/asadiabdullah/buku-penghubung-digital.git
cd buku-penghubung-digital
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-anon-key
```

### 4. Set Up the Database

Option A — **Run the migration script** (automated):
```bash
node setup_db.js
```

Option B — **Manual SQL execution** via Supabase Dashboard:
1. Navigate to your Supabase project → **SQL Editor**
2. Copy and paste the contents of `supabase_setup.sql`
3. Click **Run**

### 5. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### 6. Default Test Credentials

| Role | Username | Password |
|------|----------|----------|
| 🧑‍🏫 Teacher / Homeroom | `guru` | `amal123` |
| 👨‍👩‍👧 Parent (sample) | `budi` | `buku123` |
| 🌐 Public Report (no login) | — | URL: `?token=tkn_budi_xyz123` |

> ⚠️ **Important:** Teachers can change their credentials at any time from the dashboard header edit button. After changing credentials, the old username/password will no longer work.

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) API key |

> These variables are prefixed with `VITE_` to be exposed to the client-side bundle by Vite. The anon key is safe to expose as it only grants access permitted by your Row Level Security (RLS) policies.

---

## 🗃 Database Migration

The `supabase_setup.sql` file contains the complete database schema including:

- **8 table definitions** with UUID primary keys
- **Foreign key relationships** with cascading deletes
- **Check constraints** (attendance status enum, comment word limit)
- **Unique constraints** (student username, attendance per day, public tokens)
- **Default values** and auto-generated UUIDs
- **Seed data** for immediate testing (sample class, students, badges, attendance records)

The `setup_db.js` migration runner connects via IPv4 Supabase Pooler (for environments without IPv6 support) and executes the full SQL script programmatically.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run build` | Create optimized production bundle in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run OxLint for code quality checks |
| `npm run deploy` | Build and deploy to GitHub Pages (`gh-pages -d dist`) |

---

## 🚀 Deployment

### GitHub Pages (Current Setup)

The project is configured for automated deployment to GitHub Pages:

```bash
# Deploy to the configured remote
npm run deploy
```

This command:
1. Runs `npm run build` (predeploy hook)
2. Pushes the `dist/` folder to the `gh-pages` branch
3. GitHub Pages automatically serves the site

### Dual Deployment Setup

This project maintains two deployment targets:

| Target | Repository | URL |
|--------|-----------|-----|
| **School (Production)** | `uzmilapekalongan123-ops/buku-penghubung-digital` | [uzmilapekalongan123-ops.github.io/buku-penghubung-digital](https://uzmilapekalongan123-ops.github.io/buku-penghubung-digital/) |
| **Developer (Staging)** | `asadiabdullah/buku-penghubung-digital` | [asadiabdullah.github.io/buku-penghubung-digital](https://asadiabdullah.github.io/buku-penghubung-digital/) |

To deploy to an alternate remote, update the Git remote URL before running deploy:

```bash
# Switch to school remote
git remote set-url origin https://github.com/uzmilapekalongan123-ops/buku-penghubung-digital.git
npm run deploy

# Switch back to developer remote
git remote set-url origin https://github.com/asadiabdullah/buku-penghubung-digital.git
npm run deploy
```

---

## 📱 PWA & Offline Support

### Capabilities

| Feature | Implementation |
|---------|---------------|
| **Installable** | Web App Manifest with `display: standalone`, themed icons (192×192, 512×512 maskable) |
| **Offline-Ready** | Service Worker (Workbox) precaches all app assets for offline access |
| **Auto-Update Prompt** | `registerType: 'prompt'` shows a styled "Update Now 🚀" banner when new version is detected |
| **Theme Color** | `#2d6a4f` (Emerald Green) — matches the app's design system |
| **Scope** | `./` — compatible with GitHub Pages subdirectory hosting |

### Update Flow

1. New version is deployed to GitHub Pages
2. Service Worker detects the change in the background
3. A floating banner appears: **"Pembaruan Tersedia 🚀 — Update Sekarang"**
4. User clicks the button → service worker activates the new version → page reloads with latest code
5. No manual uninstall/reinstall needed

---

## 🎨 Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--primary-dark` | `#1b4332` | Headers, dark backgrounds |
| `--primary` | `#2d6a4f` | Primary actions, theme color |
| `--primary-light` | `#52b788` | Hover states, accents |
| `--primary-bg` | `#e8f5e9` | Light green backgrounds |
| `--accent` | `#d4af37` | Gold highlights, CTAs |
| `--accent-light` | `#fcf6bd` | Light gold backgrounds |
| `--color-hadir` | `#2e7d32` | ✅ Present (Green) |
| `--color-sakit` | `#0288d1` | 🤒 Sick (Blue) |
| `--color-izin` | `#f57c00` | 📋 Excused (Orange) |
| `--color-alpa` | `#d32f2f` | ❌ Absent (Red) |

### Typography

- **Font Family:** [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts)
- **Weights Used:** 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Layout

- **Mobile-First:** Container max-width `480px` centered on desktop with subtle shadow
- **Native App Feel:** Fullscreen mobile experience, sticky tab navigation, glass-card components
- **Glassmorphism:** Semi-transparent cards with backdrop blur and subtle borders

### Components

| Component | Style |
|-----------|-------|
| `Card` | Glassmorphism with `fade-in` animation |
| `Button` | Multi-variant (primary, secondary, danger) with integrated spinner |
| `Modal` | Backdrop blur dialog (`blur(4px)`) with scrollable content |
| `Toast` | Slide-in notifications replacing native `alert()` |
| `Confirm Dialog` | Custom confirmation modal replacing native `confirm()` |

---

## 📸 Screenshots & User Flows

### Authentication

- **Dual-Role Login** — Toggle between Parent and Teacher mode
- **Route-Based Detection** — `/admin` URL automatically switches to Teacher login
- **Token-Based Access** — `?token=tkn_xxx` bypasses login for read-only reports

### Teacher Dashboard Modules

1. **Attendance Tab** → Date picker → Student list with quick-action status buttons → Save all
2. **Student Tab** → Add/Edit/Delete students → Generate public tokens → Batch reset tokens
3. **Badge Tab** → Select student → Choose badge → Add note → Award | Create new badge catalog
4. **Achievement Tab** → Select student → Log achievement with date and description
5. **Announcement Tab** → Compose announcement → Set category → Attach link → Publish → Reply to comments

### Parent Dashboard Modules

1. **Attendance Calendar** → Monthly grid view → Color-coded statuses → Percentage score → Detail modal
2. **Badges & Achievements** → Grouped badge cards with counters → Category filter → Achievement timeline
3. **Announcements** → Feed view → Comment (max 10 words) → Auto-popup for urgent announcements → Copy public link

---

## 🧑‍💻 Engineering Notes

### AI-Assisted Development

This project was engineered using **Google Antigravity** — an advanced AI pair-programming tool by Google DeepMind. The AI assistant contributed to:

- **System architecture** design and database schema modeling
- **Full-stack implementation** of React components and Supabase integrations
- **Progressive Web App** configuration with service worker update flow
- **Database migration** scripting with IPv4/IPv6 compatibility handling
- **Dual-target deployment** automation to multiple GitHub Pages instances
- **UI/UX design** system with glassmorphism components and accessibility considerations

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No external UI framework** (no Tailwind, no MUI) | Minimize bundle size; hand-crafted CSS gives precise control for the mobile-first design |
| **Supabase over Firebase** | PostgreSQL with SQL constraints (CHECK, UNIQUE) provides stronger data integrity for an education app |
| **Token-based public reports** (not auth-based) | Grandparents and relatives need zero-friction access via WhatsApp links |
| **10-word comment limit** | Cultural consideration — maintains respectful brevity in parent-teacher interactions |
| **GitHub Pages over Vercel/Netlify** | Zero-cost hosting suitable for a charity project with static SPA architecture |
| **Console watermark** | Non-intrusive developer attribution visible only in browser DevTools |

### Known Limitations

- Credentials are stored in plaintext in the database (acceptable for this institutional use case with limited users; would use bcrypt hashing for production scale)
- Single-class architecture (one `kelas` row) — designed for small *Madrasah Diniyah* settings
- No real-time subscriptions yet (relies on page refresh for latest data)

---

## 🙏 Credits & License

### Author

**As'adi** — Software Engineer

### Purpose

This is a **charitable project (*proyek amal*)** built for **Uzmilatul Khorioh**, an Islamic religious education institution in Pekalongan, Central Java, Indonesia.

### Acknowledgments

- [React](https://react.dev/) — UI library by Meta
- [Vite](https://vite.dev/) — Build tool by Evan You and the Vite team
- [Supabase](https://supabase.com/) — Open-source Firebase alternative
- [Lucide](https://lucide.dev/) — Beautiful, consistent icon set
- [Google Antigravity](https://deepmind.google/) — AI-assisted engineering tool by Google DeepMind
- [Outfit Font](https://fonts.google.com/specimen/Outfit) — Typography by Rodrigo Fuenzalida

### Metadata

```
Author:    As'adi
Project:   Buku Penghubung Digital
Purpose:   Proyek Amal milik Uzmilatul Khorioh
Year:      2026
Stack:     React 19 · Vite 8 · Supabase · PWA
Hosted:    GitHub Pages
```

---

<p align="center">
  <strong>Built with 💚 as a charity project for Islamic education</strong><br/>
  <em>© 2026 As'adi — All rights reserved</em>
</p>
