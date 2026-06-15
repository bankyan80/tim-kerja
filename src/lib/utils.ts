import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date?: string | Date | null, fmt = "dd MMMM yyyy") {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, fmt, { locale: id });
  } catch {
    return "-";
  }
}

export function formatDateShort(date?: string | Date | null) {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, "dd/MM/yyyy");
  } catch {
    return "-";
  }
}

export function getTahunPelajaran() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

export function getBulanName(bulan: number) {
  const names = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return names[bulan - 1] || "";
}

export function generateNomorSurat(jenis: string, tahun: string) {
  const random = Math.floor(Math.random() * 999) + 1;
  const romawi = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  const bulan = new Date().getMonth();
  return `${random}/${jenis}/${romawi[bulan]}/${tahun}`;
}
