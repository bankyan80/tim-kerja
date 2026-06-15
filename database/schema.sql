-- Database Schema for Sistem Kerja Bidang SD
-- Turso (libSQL) SQL

-- Enable WAL mode
PRAGMA journal_mode=WAL;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'staf' CHECK(role IN ('ketua','admin','staf')),
  status TEXT NOT NULL DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sekolah table
CREATE TABLE IF NOT EXISTS sekolah (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  npsn TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('negeri','swasta')),
  alamat TEXT NOT NULL DEFAULT '',
  desa TEXT NOT NULL DEFAULT '',
  kecamatan TEXT NOT NULL DEFAULT 'Lemahabang',
  kabupaten TEXT NOT NULL DEFAULT 'Kabupaten Cirebon',
  kode_pos TEXT DEFAULT '',
  kepala_sekolah TEXT DEFAULT '',
  nip_kepala_sekolah TEXT DEFAULT '',
  operator TEXT DEFAULT '',
  no_wa TEXT DEFAULT '',
  email TEXT DEFAULT '',
  akreditasi TEXT DEFAULT 'Belum',
  jumlah_rombel INTEGER DEFAULT 0,
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  foto TEXT,
  status_aktif TEXT NOT NULL DEFAULT 'aktif' CHECK(status_aktif IN ('aktif','nonaktif')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Siswa table
CREATE TABLE IF NOT EXISTS siswa (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nik TEXT NOT NULL,
  nisn TEXT NOT NULL DEFAULT '',
  nama_lengkap TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK(jenis_kelamin IN ('L','P')),
  tempat_lahir TEXT DEFAULT '',
  tanggal_lahir TEXT DEFAULT '',
  usia INTEGER DEFAULT 0,
  agama TEXT DEFAULT 'Islam',
  alamat TEXT DEFAULT '',
  nama_ayah TEXT DEFAULT '',
  nama_ibu TEXT DEFAULT '',
  nomor_kk TEXT DEFAULT '',
  kelas TEXT NOT NULL,
  rombel TEXT DEFAULT '',
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  tahun_pelajaran TEXT NOT NULL,
  status_siswa TEXT NOT NULL DEFAULT 'aktif' CHECK(status_siswa IN ('aktif','keluar','lulus','mutasi')),
  tanggal_masuk TEXT DEFAULT '',
  asal_sekolah TEXT DEFAULT '',
  kebutuhan_khusus TEXT DEFAULT '',
  kontak_orang_tua TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE(nik, sekolah_id, tahun_pelajaran)
);

-- GTK table
CREATE TABLE IF NOT EXISTS gtk (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nik TEXT NOT NULL,
  nip TEXT,
  nuptk TEXT,
  nama TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK(jenis_kelamin IN ('L','P')),
  tempat_lahir TEXT DEFAULT '',
  tanggal_lahir TEXT DEFAULT '',
  status_pegawai TEXT NOT NULL DEFAULT 'honorer',
  jabatan TEXT DEFAULT '',
  jenis_gtk TEXT NOT NULL DEFAULT 'Guru',
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  pangkat_golongan TEXT DEFAULT '',
  pendidikan_terakhir TEXT DEFAULT '',
  sertifikasi INTEGER DEFAULT 0,
  nrg TEXT,
  masa_kerja INTEGER DEFAULT 0,
  tmt TEXT DEFAULT '',
  nomor_sk TEXT DEFAULT '',
  bup TEXT DEFAULT '',
  kontak TEXT DEFAULT '',
  status_aktif TEXT NOT NULL DEFAULT 'aktif' CHECK(status_aktif IN ('aktif','nonaktif')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Surat table
CREATE TABLE IF NOT EXISTS surat (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nomor_agenda TEXT,
  nomor_surat TEXT NOT NULL,
  tanggal_surat TEXT NOT NULL DEFAULT (date('now')),
  tanggal_diterima TEXT,
  asal_surat TEXT,
  tujuan TEXT,
  perihal TEXT NOT NULL DEFAULT '',
  klasifikasi TEXT,
  jenis TEXT NOT NULL CHECK(jenis IN ('masuk','keluar','tugas','undangan')),
  file TEXT,
  disposisi TEXT,
  penerima_disposisi TEXT,
  batas_tindak_lanjut TEXT,
  penandatangan TEXT,
  isi_surat TEXT,
  lampiran TEXT,
  file_final TEXT,
  status_pengiriman TEXT,
  tanggal_kirim TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  catatan TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Laporan Bulanan table
CREATE TABLE IF NOT EXISTS laporan_bulanan (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  bulan INTEGER NOT NULL CHECK(bulan BETWEEN 1 AND 12),
  tahun TEXT NOT NULL,
  tahun_pelajaran TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','dikirim','menunggu_verifikasi','perlu_perbaikan','terverifikasi','terlambat')),
  catatan TEXT,
  lampiran TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  UNIQUE(sekolah_id, bulan, tahun)
);

-- Sarpras table
CREATE TABLE IF NOT EXISTS sarpras (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  jenis TEXT NOT NULL,
  nama TEXT NOT NULL,
  jumlah INTEGER DEFAULT 0,
  kondisi_baik INTEGER DEFAULT 0,
  kondisi_sedang INTEGER DEFAULT 0,
  kondisi_rusak INTEGER DEFAULT 0,
  foto TEXT,
  usulan_perbaikan TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- SPMB table
CREATE TABLE IF NOT EXISTS spmb (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  tahun_pelajaran TEXT NOT NULL,
  daya_tampung INTEGER DEFAULT 0,
  pendaftar INTEGER DEFAULT 0,
  diterima INTEGER DEFAULT 0,
  jalur_domisili INTEGER DEFAULT 0,
  jalur_afirmasi INTEGER DEFAULT 0,
  jalur_mutasi INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(sekolah_id, tahun_pelajaran)
);

-- Kegiatan table
CREATE TABLE IF NOT EXISTS kegiatan (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'Lainnya',
  tanggal TEXT NOT NULL DEFAULT (date('now')),
  waktu TEXT DEFAULT '',
  tempat TEXT DEFAULT '',
  peserta TEXT DEFAULT '',
  penanggung_jawab TEXT DEFAULT '',
  undangan TEXT,
  daftar_hadir TEXT,
  notulen TEXT,
  dokumentasi TEXT,
  biaya REAL DEFAULT 0,
  laporan TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Monitoring table
CREATE TABLE IF NOT EXISTS monitoring (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  sekolah_id TEXT NOT NULL REFERENCES sekolah(id),
  tanggal TEXT NOT NULL DEFAULT (date('now')),
  petugas TEXT NOT NULL DEFAULT '',
  jenis_monitoring TEXT NOT NULL DEFAULT '',
  instrumen TEXT,
  temuan TEXT,
  rekomendasi TEXT,
  tindak_lanjut TEXT,
  batas_waktu TEXT,
  bukti_foto TEXT,
  status TEXT NOT NULL DEFAULT 'tertunda' CHECK(status IN ('tertunda','ditindaklanjuti','selesai')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Arsip table
CREATE TABLE IF NOT EXISTS arsip (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  jenis_dokumen TEXT NOT NULL,
  sekolah_id TEXT REFERENCES sekolah(id),
  bulan INTEGER,
  tahun TEXT NOT NULL,
  pemilik TEXT NOT NULL DEFAULT '',
  file TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  versi INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  aksi TEXT NOT NULL,
  modul TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notifikasi table
CREATE TABLE IF NOT EXISTS notifikasi (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  judul TEXT NOT NULL,
  pesan TEXT NOT NULL,
  dibaca INTEGER DEFAULT 0,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Backup history table
CREATE TABLE IF NOT EXISTS backup_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  filename TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sukses',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_siswa_sekolah ON siswa(sekolah_id);
CREATE INDEX IF NOT EXISTS idx_siswa_nik ON siswa(nik);
CREATE INDEX IF NOT EXISTS idx_siswa_nisn ON siswa(nisn);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas);
CREATE INDEX IF NOT EXISTS idx_siswa_tahun ON siswa(tahun_pelajaran);
CREATE INDEX IF NOT EXISTS idx_gtk_sekolah ON gtk(sekolah_id);
CREATE INDEX IF NOT EXISTS idx_surat_jenis ON surat(jenis);
CREATE INDEX IF NOT EXISTS idx_surat_status ON surat(status);
CREATE INDEX IF NOT EXISTS idx_laporan_sekolah ON laporan_bulanan(sekolah_id);
CREATE INDEX IF NOT EXISTS idx_laporan_bulan ON laporan_bulanan(bulan, tahun);
CREATE INDEX IF NOT EXISTS idx_arsip_jenis ON arsip(jenis_dokumen);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_notifikasi_user ON notifikasi(user_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sekolah ON monitoring(sekolah_id);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES ('nama_aplikasi', 'Sistem Informasi Kecamatan Lemahabang');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('instansi', 'Kecamatan Lemahabang');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('wilayah', 'Kecamatan Lemahabang, Kabupaten Cirebon');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('logo', '');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('tahun_pelajaran', '2025/2026');
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('format_nomor_surat', '{nomor}/SURAT/{bulan_romawi}/{tahun}');

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  foto TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
