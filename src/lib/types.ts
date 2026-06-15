export type UserRole = "ketua" | "admin" | "staf" | "operator_sekolah";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: "aktif" | "nonaktif";
  sekolah_id?: string;
  created_at: string;
};

export type Sekolah = {
  id: string;
  npsn: string;
  nama: string;
  status: "negeri" | "swasta";
  alamat: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  kode_pos: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  operator: string;
  no_wa: string;
  email: string;
  akreditasi: string;
  jumlah_rombel: number;
  latitude: number;
  longitude: number;
  foto?: string;
  status_aktif: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Siswa = {
  id: string;
  nik: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string;
  tanggal_lahir: string;
  usia: number;
  agama: string;
  alamat: string;
  nama_ayah: string;
  nama_ibu: string;
  nomor_kk: string;
  kelas: string;
  rombel: string;
  sekolah_id: string;
  tahun_pelajaran: string;
  status_siswa: "aktif" | "keluar" | "lulus" | "mutasi";
  tanggal_masuk: string;
  asal_sekolah: string;
  kebutuhan_khusus: string;
  kontak_orang_tua: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type GTK = {
  id: string;
  nik: string;
  nip?: string;
  nuptk?: string;
  nama: string;
  jenis_kelamin: "L" | "P";
  tempat_lahir: string;
  tanggal_lahir: string;
  status_pegawai: string;
  jabatan: string;
  jenis_gtk: string;
  sekolah_id: string;
  pangkat_golongan: string;
  pendidikan_terakhir: string;
  sertifikasi: boolean;
  nrg?: string;
  masa_kerja: number;
  tmt: string;
  nomor_sk: string;
  bup: string;
  kontak: string;
  status_aktif: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Surat = {
  id: string;
  nomor_agenda?: string;
  nomor_surat: string;
  tanggal_surat: string;
  tanggal_diterima?: string;
  asal_surat?: string;
  tujuan?: string;
  perihal: string;
  klasifikasi?: string;
  jenis: "masuk" | "keluar" | "tugas" | "undangan";
  file?: string;
  disposisi?: string;
  penerima_disposisi?: string;
  batas_tindak_lanjut?: string;
  penandatangan?: string;
  isi_surat?: string;
  lampiran?: string;
  file_final?: string;
  status_pengiriman?: string;
  tanggal_kirim?: string;
  status: string;
  catatan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type LaporanBulanan = {
  id: string;
  sekolah_id: string;
  bulan: number;
  tahun: string;
  tahun_pelajaran: string;
  data: string;
  status: "draft" | "dikirim" | "menunggu_verifikasi" | "perlu_perbaikan" | "terverifikasi" | "terlambat";
  catatan?: string;
  lampiran?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Sarpras = {
  id: string;
  sekolah_id: string;
  jenis: string;
  nama: string;
  jumlah: number;
  kondisi_baik: number;
  kondisi_sedang: number;
  kondisi_rusak: number;
  foto?: string;
  usulan_perbaikan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type SPMB = {
  id: string;
  sekolah_id: string;
  tahun_pelajaran: string;
  daya_tampung: number;
  pendaftar: number;
  diterima: number;
  jalur_domisili: number;
  jalur_afirmasi: number;
  jalur_mutasi: number;
  created_at: string;
  updated_at: string;
};

export type Kegiatan = {
  id: string;
  nama: string;
  kategori: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  peserta: string;
  penanggung_jawab: string;
  undangan?: string;
  daftar_hadir?: string;
  notulen?: string;
  dokumentasi?: string;
  biaya: number;
  laporan?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Monitoring = {
  id: string;
  sekolah_id: string;
  tanggal: string;
  petugas: string;
  jenis_monitoring: string;
  instrumen?: string;
  temuan?: string;
  rekomendasi?: string;
  tindak_lanjut?: string;
  batas_waktu?: string;
  bukti_foto?: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type Arsip = {
  id: string;
  jenis_dokumen: string;
  sekolah_id?: string;
  bulan?: number;
  tahun: string;
  pemilik: string;
  file: string;
  versi: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
};

export type AuditLog = {
  id: string;
  user_id: string;
  aksi: string;
  modul: string;
  detail?: string;
  created_at: string;
};

export type Notifikasi = {
  id: string;
  user_id: string;
  judul: string;
  pesan: string;
  dibaca: boolean;
  link?: string;
  created_at: string;
};

export type ProgressData = {
  id: string;
  label: string;
  total: number;
  selesai: number;
  belum_selesai: number;
  perlu_perbaikan: number;
  persentase: number;
};
