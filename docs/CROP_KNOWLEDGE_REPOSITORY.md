# Crop Knowledge Repository — SMART AGRO

Enjin data pusat untuk modul **Kalendar**, **Cadangan Tanaman**, dan **Amaran Penyakit**. Semua modul berkongsi sumber yang sama — tidak dibangunkan berasingan.

## Sumber data (prioriti anda)

| Keutamaan | Sumber | Medan dalam repositori |
|-----------|--------|------------------------|
| 1 | UPM Manual Penanaman Sayur | `tempohMatangHari`, fasa sayur |
| 2 | DOA Perak (Panduan Tanaman) | `sop[]`, jarak/penyediaan tanah |
| 3 | MARDI myAgriManager | `tugasan[]` (jadual aktiviti) |
| 4 | GeoTanih DOA | `tanahSesuai`, `tanahKurangSesuai`, skor cadangan |
| 5 | METMalaysia | Pemicu penyakit (`pemicu: hujan/kelembapan`) |
| 6 | FAMA | Fasa 2 — harga pasaran |
| 7 | PlantVillage | `penyakit[].plantVillageLabel`, simptom |

## Skop MVP

- **38 tanaman utama** Malaysia (sasaran 30–50): cili, timun, sawi, kangkung, bayam, terung, jagung, padi, nanas, pisang, tomato, durian, kelapa sawit, dll.
- Fail data: `src/data/cropKnowledge/cropsData.ts`
- API repositori: `src/data/cropKnowledge/repository.ts`

## Fungsi repositori

| Fungsi | Modul |
|--------|-------|
| `buildCropPlan(cropId)` | Kalendar Penanaman Pintar |
| `recommendCrops({ jenisTanah, negeri })` | Cadangan Tanaman Mengikut Kawasan |
| `buildDiseaseAlerts(cropId, cuaca)` | Amaran Penyakit & Perosak |
| `getCropById` / `searchCrops` | Profil, carian |
| `getRepositoryMeta()` | Metadata versi & jumlah tanaman |

## Struktur rekod tanaman

Setiap `CropKnowledge` mengandungi:

- Identiti: `id`, `nama`, `ikon`, `kategori`
- Agronomi: `tempohMatangHari`, `varietiDisyorkan`, `musimTanam`, `anggaranHasil`
- Tanah: `tanahSesuai`, `tanahKurangSesuai`, `negeriSesuai?`
- `fasa[]` — fasa tumbesaran
- `tugasan[]` — jadual relatif hari tanam
- `penyakit[]` — penyakit + rujukan PlantVillage
- `sop[]` — langkah SOP DOA
- `sumber[]` — atribusi sumber

## Cara tambah tanaman baharu

1. Tambah entri dalam `cropsData.ts` (atau pecahkan ikut kategori).
2. Pastikan `id` unik (slug: `cili-merah`).
3. Isi minimum: `tempohMatangHari`, `fasa`, `tugasan`, `tanahSesuai`, `penyakit`.
4. Uji di Profil → pilih tanaman → Kalendar & Amaran berubah automatik.

## Import UPM — Tempoh Matang Sayur (aktif)

```bash
npm run import:upm
# atau kedua-dua sumber:
npm run import:data
```

| Item | Nilai |
|------|-------|
| Sumber | UPM Program Buku Hijau Siri 1 — Pengeluaran Sayur-Sayuran |
| Fail output | `imports/upmSayurByCrop.json` |
| Sayur dalam repo | 21 tanaman (kategori sayur + serai) |
| Kesan | `tempohMatangHari`, fasa & tugasan (hari tuaian) dikemas kini |

Petikan UPM: *"sawi, bayam dan kangkung boleh dituai apabila mencapai umur di antara 3–4 minggu selepas ditanam di ladang"* · sawi semai 7 hari sebelum pindah ladang.

## Import DOA Perak, MARDI, GeoTanih, FAMA (aktif)

```bash
npm run import:agencies
# atau semua sumber:
npm run import:data
```

| Sumber | Fail output | Kesan dalam app |
|--------|-------------|-----------------|
| DOA Perak | `doaPerakByCrop.json` | `sop[]`, jarak tanam, nota penyediaan tanah |
| MARDI myAgriManager | `mardiTugasanByCrop.json` | `tugasan[]`, varieti (cth. MR297) |
| GeoTanih DOA | `geotanihByCrop.json` | `tanahSesuai` / `tanahKurangSesuai`, skor cadangan |
| FAMA | `famaPricesByCrop.json` | Skrin Pasaran — harga borong (12 komoditi) |

Merge: `doaPerakMerge.ts` → `mardiMerge.ts` → `geotanihMerge.ts` → `upmSayurMerge.ts` (urutan load).

## Import PlantVillage (aktif)

Sumber tunggal pertama yang diimport secara automatik:

```bash
npm run import:plantvillage
```

| Item | Nilai |
|------|-------|
| Kelas rasmi | 38 (TensorFlow Datasets) |
| Fail output | `src/data/cropKnowledge/imports/plantVillageByCrop.json` |
| Tanaman dipetakan | 10 cropId (cili, tomato, jagung, ubi kentang, labu, limau, kacang tanah, dll.) |
| Merge | `plantVillageMerge.ts` → ganti/isi `penyakit[]` pada load |

Tanaman tanpa padanan spesies PV (contoh: **padi**) kekal pada data MARDI/DOA manual.

## Nota integrasi rasmi

Data MVP adalah **kurasi berstruktur** + **import PlantVillage** untuk penyakit. Untuk produksi:

- Import semi-automatik dari PDF/portal rasmi ke JSON
- MoU FAMA untuk harga komoditi mengikut `cropId`
- GeoTanih API untuk skor tanah automatik
- Model ML PlantVillage untuk diagnosis gambar sebenar

---

*SMART AGRO · Crop Knowledge Repository v1.0.0-mvp*
