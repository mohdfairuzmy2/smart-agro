/** Data rujukan analisis (kurasi MVP — boleh diganti API/arkib sejarah) */

export const KOS_LADANG_PER_HA: Record<string, { benih: number; baja: number; racun: number; air: number; buruh: number; pengangkutan: number }> = {
  sayur: { benih: 1200, baja: 4200, racun: 1500, air: 800, buruh: 5500, pengangkutan: 2500 },
  padi: { benih: 900, baja: 3800, racun: 1100, air: 1200, buruh: 6000, pengangkutan: 3000 },
  buah: { benih: 1500, baja: 5000, racun: 1800, air: 1000, buruh: 6500, pengangkutan: 3500 },
  default: { benih: 1000, baja: 4000, racun: 1400, air: 900, buruh: 5000, pengangkutan: 2800 },
};

/** Hasil anggaran purata tan/ha (untuk what-if & perbandingan) */
export const HASIL_PURATA_TAN_HA: Record<string, number> = {
  'cili-merah': 10,
  'cili-padi': 9,
  'jagung-manis': 14,
  tembikai: 28,
  'padi-mr297': 5.5,
  tomato: 32,
  timun: 22,
  sawi: 12,
  default: 10,
};

/** Risiko skor 0–100 (lebih tinggi = lebih selamat) */
export const RISIKO_SKOR_TANAMAN: Record<string, number> = {
  'cili-merah': 62,
  'cili-padi': 65,
  'jagung-manis': 82,
  tembikai: 85,
  'padi-mr297': 78,
  tomato: 70,
  timun: 72,
  sawi: 58,
  default: 70,
};

export const PERBANDINGAN_KAWASAN_SELANGOR = [
  { kawasan: 'Sabak Bernam', hasilTanHa: 4.5, tanaman: 'Padi' },
  { kawasan: 'Kuala Selangor', hasilTanHa: 3.9, tanaman: 'Padi / Sayur' },
  { kawasan: 'Tanjung Karang', hasilTanHa: 5.1, tanaman: 'Padi' },
  { kawasan: 'Kajang (Hulu Langat)', hasilTanHa: 11.8, tanaman: 'Sayur berbilang (6 jenis)' },
  { kawasan: 'Hulu Langat', hasilTanHa: 3.6, tanaman: 'Sayur' },
];

const BULAN_MS = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember',
];

/** Corak musim Malaysia (ringkas) */
export function getNotaMusim(bulanIndex: number): { tempoh: string; nota: string[] }[] {
  const b = BULAN_MS[bulanIndex];
  const out: { tempoh: string; nota: string[] }[] = [];

  if (bulanIndex >= 5 && bulanIndex <= 7) {
    out.push({
      tempoh: `${b} (musim barat)`,
      nota: ['Purata hujan tinggi di banyak kawasan', 'Risiko banjir & penyakit kulat meningkat'],
    });
  }
  if (bulanIndex === 8) {
    out.push({
      tempoh: 'September',
      nota: ['Harga cili/sayur sering mencapai paras tinggi (permintaan perayaan)', 'Kurangkan pembajaan semasa hujan'],
    });
  }
  if (bulanIndex >= 9 && bulanIndex <= 10) {
    out.push({
      tempoh: `${BULAN_MS[bulanIndex]}`,
      nota: ['Risiko penyakit daun meningkat (kelembapan)', 'Sesuai untuk perancangan tanaman musim kering'],
    });
  }
  if (out.length === 0) {
    out.push({
      tempoh: b,
      nota: ['Pantau ramalan MET 7–14 hari', 'Selaraskan tanaman dengan permintaan pasaran semasa'],
    });
  }
  return out;
}
