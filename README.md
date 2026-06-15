# Sistem Kerja Bidang SD

Aplikasi manajemen bidang Sekolah Dasar untuk **Tim Kerja Kecamatan Lemahabang, Kabupaten Cirebon**.

## Teknologi

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Database**: Turso (libSQL - edge-hosted SQLite)
- **Autentikasi**: NextAuth.js v5 dengan Google Sign-In
- **UI Components**: TanStack Table, React Hook Form, Zod, Lucide Icons
- **Ekspor/Impor**: SheetJS (Excel), jsPDF + jspdf-autotable (PDF)
- **PWA**: Manifest + Service Worker untuk instalasi browser
- **Android**: Capacitor untuk build APK

## Persyaratan

- Node.js 18+
- npm
- Akun Turso ([https://turso.tech](https://turso.tech))
- Google Cloud Console project (untuk Google Sign-In)
- Java Development Kit (JDK) 17+ dan Android Studio (untuk build APK)

## Environment Variables

Salin `.env.local` dan isi dengan kredensial Anda:

```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
AUTH_SECRET=your-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Sistem Kerja Bidang SD
```

## Database

### Setup Turso

1. Install Turso CLI:
   ```bash
   npm install -g turso
   ```

2. Login dan buat database:
   ```bash
   turso auth login
   turso db create sistem-kerja-bidang-sd
   ```

3. Dapatkan credentials:
   ```bash
   turso db show sistem-kerja-bidang-sd --url
   turso db tokens create sistem-kerja-bidang-sd
   ```

4. Jalankan migrasi:
   ```bash
   turso db shell sistem-kerja-bidang-sd < database/schema.sql
   ```

### Struktur Database

Database terdiri dari tabel-tabel berikut:

- `users` - Pengguna aplikasi (ketua, admin, staf)
- `sekolah` - Data sekolah SD negeri dan swasta
- `siswa` - Data siswa per sekolah dan tahun pelajaran
- `gtk` - Data Guru dan Tenaga Kependidikan
- `surat` - Surat masuk, keluar, tugas, dan undangan
- `laporan_bulanan` - Laporan bulanan per sekolah (Jan-Des)
- `sarpras` - Sarana dan prasarana sekolah
- `spmb` - Data penerimaan murid baru
- `kegiatan` - Agenda dan kegiatan
- `monitoring` - Monitoring dan supervisi sekolah
- `arsip` - Arsip digital dokumen
- `audit_log` - Catatan audit perubahan data
- `notifikasi` - Notifikasi pengguna
- `backup_history` - Riwayat backup database

## Google Sign-In Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Buat project baru atau pilih project yang ada
3. Buka **APIs & Services > Credentials**
4. Buat **OAuth 2.0 Client IDs** (tipe: Web application)
5. Tambahkan authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google`
6. Salin Client ID dan Client Secret ke `.env.local`

## Instalasi & Menjalankan

```bash
# Clone repositori
git clone <repo-url>
cd tim-kerja

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local dengan kredensial Anda

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Pada Vercel, tambahkan semua environment variables di dashboard project Settings > Environment Variables.

## Build APK Android

```bash
# Build Next.js production
npm run build

# Sync dengan Capacitor
npx cap sync

# Buka di Android Studio untuk build
npx cap open android

# Atau build langsung via Gradle:
cd android
./gradlew assembleDebug
```

APK akan tersedia di `android/app/build/outputs/apk/debug/`.

Alternatif: Aplikasi juga dapat dipasang sebagai PWA dari browser tanpa build APK.

## Struktur Proyek

```
src/
  app/                      # Next.js App Router pages
    (dashboard)/            # Dashboard page
    login/                  # Login page
    persuratan/             # Surat menyurat (7 submenu)
    data-sekolah/           # Data sekolah
    data-siswa/             # Data siswa
    data-gtk/               # Data GTK
    laporan/                # Laporan bulanan
    sarpras/                # Sarana prasarana
    spmb/                   # Penerimaan murid baru
    kegiatan/               # Kegiatan
    arsip/                  # Arsip digital
    monitoring/             # Monitoring sekolah
    rekap/                  # Rekap kecamatan
    lainnya/                # Menu lainnya
    pengaturan/             # Pengaturan aplikasi
    api/                    # API routes
  components/
    layout/                 # Topbar, Navigation, BottomNav
    ui/                     # Button, Card, Badge, Modal, Table, etc.
    dashboard/              # Dashboard components
  lib/                      # Utilities, types, db, auth
  types/                    # TypeScript type declarations
  providers/                # React context providers
  hooks/                    # Custom hooks
database/
  schema.sql                # Database schema
public/
  uploads/                  # Upload directory
  manifest.json             # PWA manifest
  sw.js                     # Service Worker
```

## Fitur

### Dashboard
- Ringkasan data (sekolah, siswa, GTK, surat)
- Progres pengumpulan data (8 indikator)
- Surat masuk terbaru, agenda terdekat, perlu ditindaklanjuti

### Persuratan
- Surat Masuk, Surat Keluar, Disposisi
- Surat Tugas, Undangan, Template Surat
- Buku Agenda
- CRUD lengkap dengan upload file

### Data Sekolah
- Manajemen SD negeri dan swasta
- Format nama: "SD Negeri 1 Lemahabang"

### Data Siswa
- Per sekolah dan tahun pelajaran
- Cegah NIK ganda
- Kenaikan kelas massal
- Kelulusan massal (otomatis ke alumni)
- Rekap per kelas (L/P)

### Data GTK
- PNS, PPPK, PPPK Paruh Waktu, Honorer, GTT, GTY, Tendik
- Data BUP/pensiun
- Sertifikasi, mapping per sekolah

### Laporan Bulanan
- Januari-Desember per sekolah
- Status: Draft, Dikirim, Menunggu Verifikasi, Perlu Perbaikan, Terverifikasi, Terlambat
- Data otomatis dari siswa, GTK, sarpras

### Fitur Lain
- Notifikasi realtime
- Pencarian global
- Impor/Ekspor Excel
- Cetak PDF
- Audit log
- Soft delete + restore
- Hak akses berdasarkan peran
- Tampilan responsif (desktop, tablet, mobile)

## Hak Akses

| Fitur | Ketua | Admin | Staf |
|-------|-------|-------|------|
| Melihat data | ✓ | ✓ | Terbatas |
| Menambah data | - | ✓ | ✓ |
| Mengedit data | - | ✓ | Terbatas |
| Menghapus data | - | ✓ | - |
| Verifikasi | ✓ | - | - |
| Rekap & Cetak | ✓ | ✓ | Terbatas |
| Kelola pengguna | - | ✓ | - |
| Pengaturan | - | ✓ | - |

## Lisensi

Hak Cipta © 2026 Tim Kerja Kecamatan Lemahabang, Kabupaten Cirebon.
