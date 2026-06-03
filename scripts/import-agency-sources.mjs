#!/usr/bin/env node
/**
 * Import kurasi: DOA Perak (SOP), MARDI myAgriManager (tugasan),
 * GeoTanih DOA (kesesuaian tanah), FAMA (harga rujukan)
 *
 * Nota: API rasmi GeoTanih/FAMA/data.gov.my tidak stabil tanpa MoU;
 * fail JSON ini menjadi sumber MVP yang boleh diganti API kemudian.
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { CROP_IDS } from './lib/crop-ids.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../src/data/cropKnowledge/imports');
const TODAY = '2026-06-03';

const META = {
  doa: {
    sumber: 'DOA Perak — Panduan Teknologi & Penanaman (kurasi SMART AGRO)',
    url: 'https://pertanianperak.doa.gov.my',
    rujukan: 'Jabatan Pertanian Negeri Perak · Buku Panduan Penanaman',
    dikemaskini: TODAY,
  },
  mardi: {
    sumber: 'MARDI myAgriManager — Jadual Aktiviti Agronomi',
    url: 'https://www.mardi.gov.my/myagrimanager',
    dikemaskini: TODAY,
  },
  geotanih: {
    sumber: 'GeoTanih / DOA — Kesesuaian Tanah & Klasifikasi',
    url: 'https://geotanih.doa.gov.my',
    dikemaskini: TODAY,
  },
  fama: {
    sumber: 'FAMA / MyHargaTani — Harga Pasaran (rujukan kurasi)',
    url: 'https://www.fama.gov.my/info-data-terbuka-fama',
    nota: 'Ganti dengan API data.gov.my apabila id katalog disahkan',
    dikemaskini: TODAY,
  },
};

/** Klas tanah GeoTanih → skor asas */
const SOIL_CLASS = {
  'Tanah liat berpasir': { kod: 'BRIS/LAPANG', skorAsas: 78 },
  'Tanah gembur': { kod: 'LEMBAH/INCEPT', skorAsas: 88 },
  'Tanah subur': { kod: 'LEMBAH', skorAsas: 90 },
  'Tanah lembap': { kod: 'ALLUVIAL', skorAsas: 85 },
  'Tanah liat': { kod: 'GRUMUSOL', skorAsas: 82 },
  'Tanah liat berlumpur': { kod: 'GRUMUSOL', skorAsas: 84 },
  'Tanah berpasir': { kod: 'BRIS', skorAsas: 65 },
  'Tanah gambut': { kod: 'GAMBUT', skorAsas: 55 },
  'Tanah laterit': { kod: 'FERROSOL', skorAsas: 72 },
  'Tanah kering': { kod: 'BRUNT', skorAsas: 58 },
  'Tanah masin': { kod: 'BRIS', skorAsas: 45 },
  'Tanah berbatu': { kod: 'LITHOSOL', skorAsas: 50 },
};

function defaultDoa(kategori) {
  const sayur = kategori === 'sayur';
  return {
    jarakTanam: sayur ? '30 cm × 20 cm (baris)' : '75 cm × 25 cm',
    kedalamanBenih: sayur ? '0.5–1 cm' : '2–3 cm',
    penyediaanTanah: 'Bajak/rujak, parit saliran, pH 5.5–6.5, baja organik 2–3 t/ha',
    sop: [
      { langkah: 1, tajuk: 'Penyediaan tanah', keterangan: 'Jarak & parit ikut DOA Perak; tanah gembur bebas rumpai.', sumber: 'doa_perak' },
      { langkah: 2, tajuk: 'Penanaman', keterangan: 'Benih/stok sihat; kedalaman ikut spesies.', sumber: 'doa_perak' },
      { langkah: 3, tajuk: 'Pembajaan & IPM', keterangan: 'Baja berperingkat; kawalan perosak bersepadu.', sumber: 'doa_perak' },
    ],
    sumber: 'doa_perak',
  };
}

function defaultMardi(matangMax, kategori) {
  const tasks = [
    { hariRelatif: 0, aktiviti: 'Penyediaan tanah & parit', jenis: 'tanam', sumber: 'doa_perak' },
    { hariRelatif: 7, aktiviti: 'Penanaman / pindah stok', jenis: 'tanam', sumber: 'mardi_myagri' },
    { hariRelatif: 21, aktiviti: 'Pembajaan susulan (NPK)', jenis: 'baja', sumber: 'mardi_myagri' },
    { hariRelatif: Math.round(matangMax * 0.5), aktiviti: 'Pemantauan perosak & penyakit', jenis: 'pemantauan', sumber: 'mardi_myagri' },
    { hariRelatif: matangMax, aktiviti: 'Tuaian', jenis: 'tuaian', sumber: 'mardi_myagri', catatan: 'MARDI myAgriManager' },
  ];
  if (kategori === 'padi') return null; // guna jadual khusus padi
  return { varieti: null, tugasan: tasks, sumber: 'mardi_myagri' };
}

function defaultGeo(sesuai, kurang) {
  return {
    tanahSesuai: sesuai.map((j) => ({ jenis: j, skor: SOIL_CLASS[j]?.skorAsas ?? 80, kod: SOIL_CLASS[j]?.kod })),
    tanahKurangSesuai: kurang.map((j) => ({ jenis: j, skor: 30, kod: SOIL_CLASS[j]?.kod })),
    notaGeoTanih: 'Kesesuaian berdasarkan klas tanah DOA / GeoTanih',
    sumber: 'geotanih',
  };
}

/** Override terperinci — tanaman utama */
const DOA_OVERRIDE = {
  'cili-merah': {
    jarakTanam: '75 cm × 25 cm',
    penyediaanTanah: 'Tanah gembur; parit 30 cm; baja organik 3 t/ha',
    sop: [
      { langkah: 1, tajuk: 'Penyediaan tanah', keterangan: 'Jarak 75×25 cm; naungan awal 30%.', sumber: 'doa_perak' },
      { langkah: 2, tajuk: 'Pembajaan', keterangan: 'NPK 15:15:15 — 100 kg/ha asas; top dressing N pada fasa berbunga.', sumber: 'doa_perak' },
      { langkah: 3, tajuk: 'Kawalan perosak', keterangan: 'IPM thrips & antraknos; sembur ikut ambang ekonomi.', sumber: 'doa_perak' },
    ],
  },
  'padi-mr297': {
    jarakTanam: '20 cm × 20 cm (tebar benih) atau 25×25 cm (pindah)',
    penyediaanTanah: 'Sawah tabur/pindah; paras air 5–10 cm fasa vegetatif',
    sop: [
      { langkah: 1, tajuk: 'Penyediaan sawah', keterangan: 'Perataan & parit; baja organik 2 t/ha.', sumber: 'doa_perak' },
      { langkah: 2, tajuk: 'Penanaman MR297', keterangan: 'Benih 40–60 kg/ha; umur anak benih 14–21 hari (pindah).', sumber: 'doa_perak' },
      { langkah: 3, tajuk: 'Pengurusan air', keterangan: 'Kering 7–10 hari sebelum tuaian; kawalan bena perang.', sumber: 'doa_perak' },
    ],
  },
  sawi: { jarakTanam: '15 cm × 20 cm', penyediaanTanah: 'Semai 7 hari (UPM); pindah ke bed', sop: [{ langkah: 1, tajuk: 'Penanaman sawi', keterangan: 'Pindah stok 7 hari semai; jarak rapat 15×20 cm.', sumber: 'doa_perak' }] },
  kangkung: { jarakTanam: '10 cm × 15 cm (tebar / stek)', sop: [{ langkah: 1, tajuk: 'Penanaman kangkung', keterangan: 'Tanam stek atau benih terus di bed lembap.', sumber: 'doa_perak' }] },
  timun: { jarakTanam: '1.2 m × 0.4 m (bertajuk)', sop: [{ langkah: 1, tajuk: 'Tajuk & jarak', keterangan: 'Tajuk 1.5 m; jarak 40 cm dalam baris.', sumber: 'doa_perak' }] },
  tomato: { jarakTanam: '1.0 m × 0.4 m', sop: [{ langkah: 1, tajuk: 'Penyediaan', keterangan: 'Tajuk 1.2 m; pendebungaan terbantu.', sumber: 'doa_perak' }] },
  'kelapa-sawit': {
    jarakTanam: '9 m × 9 m (triangular)',
    sop: [{ langkah: 1, tajuk: 'Penanaman sawit', keterangan: 'Anak benih bersertifikat; lubang 60×60 cm.', sumber: 'doa_perak' }],
  },
};

const MARDI_OVERRIDE = {
  'padi-mr297': {
    varieti: 'MR297',
    tugasan: [
      { hariRelatif: 0, aktiviti: 'Penanaman / pindah stok', jenis: 'tanam', sumber: 'mardi_myagri' },
      { hariRelatif: 20, aktiviti: 'Pembajaan Baja 1 (NPK)', jenis: 'baja', sumber: 'mardi_myagri' },
      { hariRelatif: 45, aktiviti: 'Pembajaan Baja 2', jenis: 'baja', sumber: 'mardi_myagri' },
      { hariRelatif: 52, aktiviti: 'Kawalan rumpai', jenis: 'racun', sumber: 'mardi_myagri' },
      { hariRelatif: 56, aktiviti: 'Pemantauan paras air (~5 cm)', jenis: 'pemantauan', sumber: 'mardi_myagri' },
      { hariRelatif: 115, aktiviti: 'Tuaian', jenis: 'tuaian', sumber: 'mardi_myagri', catatan: 'MR297 ~110–120 hari' },
    ],
  },
  nanas: {
    varieti: 'MD2 / N36',
    tugasan: [
      { hariRelatif: 0, aktiviti: 'Penanaman suckers', jenis: 'tanam', sumber: 'mardi_myagri' },
      { hariRelatif: 90, aktiviti: 'Pembajaan NPK', jenis: 'baja', sumber: 'mardi_myagri' },
      { hariRelatif: 180, aktiviti: 'Pemangkasan daun', jenis: 'pemantauan', sumber: 'mardi_myagri' },
      { hariRelatif: 420, aktiviti: 'Tuaian', jenis: 'tuaian', sumber: 'mardi_myagri' },
    ],
  },
  durian: {
    varieti: 'Musang King / D24',
    tugasan: [
      { hariRelatif: 0, aktiviti: 'Penanaman anak benih', jenis: 'tanam', sumber: 'mardi_myagri' },
      { hariRelatif: 365, aktiviti: 'Pembajaan tahunan', jenis: 'baja', sumber: 'mardi_myagri' },
      { hariRelatif: 1825, aktiviti: 'Tuaian pertama (anggaran)', jenis: 'tuaian', sumber: 'mardi_myagri' },
    ],
  },
};

const GEO_OVERRIDE = {
  'cili-merah': defaultGeo(['Tanah liat berpasir', 'Tanah gembur'], ['Tanah gambut', 'Tanah masin']),
  'padi-mr297': defaultGeo(['Tanah liat berlumpur', 'Tanah lembap'], ['Tanah berpasir', 'Tanah kering']),
  kangkung: defaultGeo(['Tanah lembap', 'Tanah liat'], ['Tanah kering', 'Tanah berpasir']),
  durian: defaultGeo(['Tanah laterit', 'Tanah gembur'], ['Tanah gambut', 'Tanah masin']),
  'kelapa-sawit': defaultGeo(['Tanah laterit', 'Tanah liat berpasir'], ['Tanah gambut', 'Tanah berbatu']),
};

const FAMA_PRICES = {
  'padi-mr297': { komoditi: 'Padi (Beras Super)', hargaRm: 1580, unit: 'tan', gred: 'Gred A', pasar: 'Purata Kebangsaan', perubahanPct: 2.6, sejarah: [1490, 1505, 1520, 1510, 1535, 1560, 1580] },
  'cili-merah': { komoditi: 'Cili Merah', hargaRm: 9.8, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Selangor', perubahanPct: 4.3, sejarah: [8.2, 8.6, 8.4, 9.0, 9.3, 9.4, 9.8] },
  tomato: { komoditi: 'Tomato', hargaRm: 3.4, unit: 'kg', gred: 'Gred B', pasar: 'Pasar Borong Selangor', perubahanPct: -1.8, sejarah: [3.8, 3.7, 3.6, 3.5, 3.6, 3.5, 3.4] },
  'jagung-manis': { komoditi: 'Jagung Manis', hargaRm: 2.1, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Tani Kajang', perubahanPct: 0.9, sejarah: [1.9, 2.0, 2.0, 2.05, 2.0, 2.05, 2.1] },
  bayam: { komoditi: 'Bayam', hargaRm: 4.5, unit: 'kg', gred: 'Segar', pasar: 'Pasar Tani Kajang', perubahanPct: 3.1, sejarah: [4.0, 4.1, 4.2, 4.2, 4.3, 4.4, 4.5] },
  sawi: { komoditi: 'Sawi (Caisim)', hargaRm: 3.2, unit: 'kg', gred: 'Segar', pasar: 'Pasar Borong Selangor', perubahanPct: 1.5, sejarah: [2.9, 3.0, 3.0, 3.1, 3.1, 3.15, 3.2] },
  kangkung: { komoditi: 'Kangkung', hargaRm: 2.8, unit: 'kg', gred: 'Segar', pasar: 'Pasar Tani Kajang', perubahanPct: 2.0, sejarah: [2.5, 2.6, 2.6, 2.7, 2.7, 2.75, 2.8] },
  timun: { komoditi: 'Timun', hargaRm: 2.5, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Selangor', perubahanPct: -0.5, sejarah: [2.6, 2.55, 2.5, 2.5, 2.52, 2.48, 2.5] },
  terung: { komoditi: 'Terung', hargaRm: 3.8, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Selangor', perubahanPct: 1.2, sejarah: [3.5, 3.6, 3.6, 3.7, 3.75, 3.78, 3.8] },
  durian: { komoditi: 'Durian (Musang King)', hargaRm: 28, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Raub', perubahanPct: 5.0, sejarah: [24, 25, 26, 26, 27, 27.5, 28] },
  pisang: { komoditi: 'Pisang', hargaRm: 2.4, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Selangor', perubahanPct: 0.5, sejarah: [2.2, 2.25, 2.3, 2.3, 2.35, 2.38, 2.4] },
  nanas: { komoditi: 'Nanas', hargaRm: 2.0, unit: 'kg', gred: 'Gred A', pasar: 'Pasar Borong Johor', perubahanPct: 1.0, sejarah: [1.85, 1.9, 1.9, 1.95, 1.95, 1.98, 2.0] },
};

const KATEGORI = {
  'cili-merah': 'sayur', timun: 'sayur', sawi: 'sayur', kangkung: 'sayur', bayam: 'sayur', terung: 'sayur',
  tomato: 'sayur', kobis: 'sayur', 'kubis-cina': 'sayur', 'labu-manis': 'sayur', 'kacang-panjang': 'sayur',
  'kacang-bendi': 'sayur', salad: 'sayur', brokoli: 'sayur', 'jagung-manis': 'tanaman_industri',
  'padi-mr297': 'padi', nanas: 'buah', pisang: 'buah', tembikai: 'buah', durian: 'buah', rambutan: 'buah',
  manggis: 'buah', kelapa: 'buah', 'kelapa-sawit': 'tanaman_industri', tebu: 'tanaman_industri', halia: 'rempah',
  serai: 'herba', 'bawang-merah': 'sayur', 'ubi-kentang': 'sayur', 'ubi-kayu': 'tanaman_industri',
  'lada-hitam': 'rempah', 'limau-purut': 'buah', rockmelon: 'buah', 'cili-padi': 'sayur', 'labu-kuning': 'sayur',
  'kacang-tanah': 'tanaman_industri', 'bawang-putih': 'sayur', sengkuang: 'sayur',
};

const MATANG = {
  'cili-merah': 90, timun: 70, sawi: 30, kangkung: 30, bayam: 30, terung: 100, tomato: 90, kobis: 85,
  'kubis-cina': 60, 'labu-manis': 110, 'kacang-panjang': 65, 'kacang-bendi': 70, salad: 55, brokoli: 85,
  'jagung-manis': 75, 'padi-mr297': 120, nanas: 420, pisang: 300, tembikai: 90, durian: 1825, rambutan: 365,
  manggis: 365, kelapa: 1825, 'kelapa-sawit': 1460, tebu: 365, halia: 270, serai: 120, 'bawang-merah': 90,
  'ubi-kentang': 100, 'ubi-kayu': 270, 'lada-hitam': 1095, 'limau-purut': 365, rockmelon: 90, 'cili-padi': 75,
  'labu-kuning': 110, 'kacang-tanah': 120, 'bawang-putih': 120, sengkuang: 150,
};

const DEFAULT_GEO = defaultGeo(['Tanah gembur', 'Tanah liat berpasir'], ['Tanah gambut', 'Tanah masin']);

const doaByCrop = {};
const mardiByCrop = {};
const geoByCrop = {};
const famaByCrop = {};

for (const id of CROP_IDS) {
  const kat = KATEGORI[id] ?? 'sayur';
  const matang = MATANG[id] ?? 90;
  doaByCrop[id] = { ...defaultDoa(kat), ...(DOA_OVERRIDE[id] ?? {}) };
  const mardi = MARDI_OVERRIDE[id] ?? defaultMardi(matang, kat);
  if (mardi) mardiByCrop[id] = mardi;
  geoByCrop[id] = GEO_OVERRIDE[id] ?? DEFAULT_GEO;
  if (FAMA_PRICES[id]) {
    famaByCrop[id] = { ...FAMA_PRICES[id], peringkat: 'borong', sumber: 'fama', cropId: id };
  }
}

writeFileSync(
  join(OUT_DIR, 'doaPerakByCrop.json'),
  JSON.stringify({ meta: META.doa, byCrop: doaByCrop, jumlah: Object.keys(doaByCrop).length }, null, 2)
);
writeFileSync(
  join(OUT_DIR, 'mardiTugasanByCrop.json'),
  JSON.stringify({ meta: META.mardi, byCrop: mardiByCrop, jumlah: Object.keys(mardiByCrop).length }, null, 2)
);
writeFileSync(
  join(OUT_DIR, 'geotanihByCrop.json'),
  JSON.stringify({ meta: META.geotanih, soilClasses: SOIL_CLASS, byCrop: geoByCrop, jumlah: Object.keys(geoByCrop).length }, null, 2)
);
writeFileSync(
  join(OUT_DIR, 'famaPricesByCrop.json'),
  JSON.stringify({ meta: META.fama, byCrop: famaByCrop, jumlah: Object.keys(famaByCrop).length }, null, 2)
);

console.log('✓ DOA Perak:', Object.keys(doaByCrop).length, 'tanaman');
console.log('✓ MARDI:', Object.keys(mardiByCrop).length, 'tanaman');
console.log('✓ GeoTanih:', Object.keys(geoByCrop).length, 'tanaman');
console.log('✓ FAMA:', Object.keys(famaByCrop).length, 'komoditi harga');
console.log('  Fail:', OUT_DIR);
