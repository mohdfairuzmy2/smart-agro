#!/usr/bin/env node
/**
 * Import tempoh matang sayur — rujukan UPM Program Buku Hijau (AFS 2001)
 * Siri 1: Pengeluaran Sayur-Sayuran + jadual 45 jenis (panduan latihan pertanian)
 *
 * Sumber utama:
 * - https://sarawak.upm.edu.my/upload/dokumen/20180626114146Modul_SIRI_1.pdf
 * - Petikan: sawi/bayam/kangkung dituai 3–4 minggu selepas tanam di ladang
 * - Anak benih sawi pindah ladang ~7 hari semai
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/cropKnowledge/imports/upmSayurByCrop.json');

/** Kumpulan sayur mengikut modul UPM Siri 1 */
const KUMPULAN_DEFAULT = {
  daun: { min: 21, max: 28, nota: 'UPM: sayur daun biasanya 3–4 minggu di ladang' },
  buah: { min: 60, max: 90, nota: 'UPM: sayur buah 60–90 hari selepas pindah ke ladang' },
  ubi: { min: 60, max: 120, nota: 'UPM: sayur ubi/umbisi 2–4 bulan' },
  kekacang: { min: 45, max: 60, nota: 'UPM: sayur kekacang ~45–60 hari' },
  bawang: { min: 70, max: 120, nota: 'UPM: sayur bawang 70–120 hari' },
};

/**
 * Senarai tempoh matang — diselaraskan jadual 45 jenis + modul UPM Siri 1
 * cropId mesti sepadan dengan SMART AGRO repository
 */
const UPM_SAYUR = [
  { cropId: 'bayam', namaMs: 'Bayam', namaEn: 'Amaranth', kumpulan: 'daun', min: 25, max: 30, hariSemaian: 0, petikan: 'Modul UPM: 3–4 minggu di ladang' },
  { cropId: 'sawi', namaMs: 'Sawi', namaEn: 'Caixin / Pak Choy', kumpulan: 'daun', min: 25, max: 30, hariSemaian: 7, petikan: 'UPM: semai 7 hari sebelum pindah ladang' },
  { cropId: 'kangkung', namaMs: 'Kangkung', namaEn: 'Water Spinach', kumpulan: 'daun', min: 25, max: 30, hariSemaian: 0, petikan: 'Modul UPM: 3–4 minggu di ladang' },
  { cropId: 'salad', namaMs: 'Salad (Lettuce)', namaEn: 'Lettuce', kumpulan: 'daun', min: 35, max: 45, hariSemaian: 14 },
  { cropId: 'kobis', namaMs: 'Kobis', namaEn: 'Cabbage', kumpulan: 'daun', min: 60, max: 75, hariSemaian: 21 },
  { cropId: 'kubis-cina', namaMs: 'Kubis Cina / Pak Choi', namaEn: 'Pak Choy', kumpulan: 'daun', min: 25, max: 30, hariSemaian: 7 },
  { cropId: 'brokoli', namaMs: 'Brokoli', namaEn: 'Broccoli', kumpulan: 'daun', min: 55, max: 100, hariSemaian: 21 },
  { cropId: 'timun', namaMs: 'Timun', namaEn: 'Cucumber', kumpulan: 'buah', min: 40, max: 55, hariSemaian: 14 },
  { cropId: 'tomato', namaMs: 'Tomato', namaEn: 'Tomato', kumpulan: 'buah', min: 60, max: 90, hariSemaian: 21 },
  { cropId: 'terung', namaMs: 'Terung', namaEn: 'Eggplant', kumpulan: 'buah', min: 65, max: 80, hariSemaian: 21 },
  { cropId: 'cili-merah', namaMs: 'Cili Merah', namaEn: 'Red Pepper', kumpulan: 'buah', min: 60, max: 90, hariSemaian: 21 },
  { cropId: 'cili-padi', namaMs: 'Cili Padi', namaEn: 'Hot Pepper', kumpulan: 'buah', min: 60, max: 75, hariSemaian: 21 },
  { cropId: 'labu-manis', namaMs: 'Labu Manis', namaEn: 'Pumpkin', kumpulan: 'buah', min: 90, max: 110, hariSemaian: 14 },
  { cropId: 'labu-kuning', namaMs: 'Labu Kuning', namaEn: 'Squash', kumpulan: 'buah', min: 90, max: 110, hariSemaian: 14 },
  { cropId: 'kacang-panjang', namaMs: 'Kacang Panjang', namaEn: 'Yard Long Bean', kumpulan: 'kekacang', min: 40, max: 50, hariSemaian: 10 },
  { cropId: 'kacang-bendi', namaMs: 'Kacang Bendi', namaEn: 'Okra', kumpulan: 'buah', min: 45, max: 60, hariSemaian: 14 },
  { cropId: 'bawang-merah', namaMs: 'Bawang Merah', namaEn: 'Onion', kumpulan: 'bawang', min: 70, max: 90, hariSemaian: 0 },
  { cropId: 'bawang-putih', namaMs: 'Bawang Putih', namaEn: 'Garlic', kumpulan: 'bawang', min: 90, max: 120, hariSemaian: 0 },
  { cropId: 'ubi-kentang', namaMs: 'Ubi Kentang', namaEn: 'Potato', kumpulan: 'ubi', min: 80, max: 100, hariSemaian: 0 },
  { cropId: 'sengkuang', namaMs: 'Sengkuang', namaEn: 'Jicama', kumpulan: 'ubi', min: 120, max: 150, hariSemaian: 0 },
  { cropId: 'serai', namaMs: 'Serai', namaEn: 'Lemongrass', kumpulan: 'daun', min: 90, max: 120, hariSemaian: 0, nota: 'Herba — tempoh tuai batang' },
  // Rujukan 45 jenis — tanaman SMART AGRO belum ada (untuk peluasan)
  { cropId: null, namaMs: 'Kailan', kumpulan: 'daun', min: 45, max: 45 },
  { cropId: null, namaMs: 'Ketumbar', kumpulan: 'daun', min: 45, max: 50 },
  { cropId: null, namaMs: 'Peria', kumpulan: 'buah', min: 60, max: 60 },
  { cropId: null, namaMs: 'Petola', kumpulan: 'buah', min: 45, max: 45 },
  { cropId: null, namaMs: 'Lobak Putih', kumpulan: 'ubi', min: 50, max: 50 },
  { cropId: null, namaMs: 'Lobak Merah (Carrot)', kumpulan: 'ubi', min: 60, max: 60 },
  { cropId: null, namaMs: 'Kacang Kelisa', kumpulan: 'kekacang', min: 50, max: 50 },
  { cropId: null, namaMs: 'Kubis Bunga (Cauliflower)', kumpulan: 'daun', min: 65, max: 65 },
];

const byCrop = {};
const senarai = [];

for (const row of UPM_SAYUR) {
  const entry = {
    namaMs: row.namaMs,
    namaEn: row.namaEn,
    kumpulan: row.kumpulan,
    tempohMatangHari: { min: row.min, max: row.max },
    hariSemaianSebelumLadang: row.hariSemaian ?? 0,
    nota: row.nota ?? row.petikan ?? KUMPULAN_DEFAULT[row.kumpulan]?.nota,
    petikanUpm: row.petikan ?? null,
    sumber: 'upm_sayur',
  };
  senarai.push(entry);
  if (row.cropId) {
    byCrop[row.cropId] = entry;
  }
}

const output = {
  meta: {
    sumber: 'UPM Program Buku Hijau (AFS 2001) — Siri 1: Pengeluaran Sayur-Sayuran',
    url: 'https://sarawak.upm.edu.my/upload/dokumen/20180626114146Modul_SIRI_1.pdf',
    rujukanTambahan: 'Jadual 45 jenis tempoh matang sayuran (panduan latihan)',
    dikemaskini: new Date().toISOString().slice(0, 10),
    jumlahSayurDalamRepo: Object.keys(byCrop).length,
    jumlahSenaraiUpm: senarai.length,
    kumpulan: KUMPULAN_DEFAULT,
  },
  byCrop,
  senarai,
};

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`✓ UPM sayur: ${Object.keys(byCrop).length} tanaman dalam repo, ${senarai.length} entri jadual`);
console.log(`  Fail: ${OUT}`);
