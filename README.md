# SMART AGRO — Platform Pintar Pertanian, Cuaca & Harga Pasaran

Prototaip aplikasi mudah-alih (mobile-first) berdasarkan kertas cadangan **Inisiatif 3 — SMART AGRO**. Membantu petani membuat keputusan berasaskan data cuaca, lokasi, tanah, harga pasaran & analitik.

> *"Maklumat tepat, hasil meningkat, risiko berkurang, petani lebih bersedia."*

## Demo live

**https://mohdfairuzmy2.github.io/smart-agro/**

Dibina automatik dari branch `main` melalui GitHub Actions. API luar (METMalaysia, OpenDOSM) mungkin disekat CORS pada domain GitHub Pages — app akan guna data demo/rujukan sebagai sandaran.

## Modul yang Disiapkan

| # | Modul | Skrin |
|---|-------|-------|
| 1 | Kalendar Penanaman Pintar | Kalendar |
| 2 | Cadangan Tanaman Mengikut Kawasan | Profil |
| 3 | Amaran Cuaca & Risiko Banjir | Amaran |
| 4 | Amaran Penyakit & Perosak (+ muat naik gambar / AI) | Amaran |
| 5 | Harga Pasaran Hasil Tani | Pasaran |
| 6 | Analitik Permintaan & Bekalan | Pasaran |
| 7 | Dashboard Pemantauan Pertanian | Utama |

**Navigasi:** Utama · Kalendar · Amaran · Analisis · Pasaran · Profil · Info Sistem (desktop)

## Ciri Utama

- Dashboard cuaca semasa + ramalan 7 hari
- Kalendar fasa tumbesaran tanaman + jadual baja/siraman/tuaian (boleh tanda selesai)
- Amaran berperingkat (rendah/sederhana/tinggi) untuk cuaca, banjir, penyakit & perosak
- Muat naik gambar tanaman → diagnosis penyakit (disimulasi AI)
- Trend harga & analitik permintaan-bekalan (carta interaktif)
- Cadangan tanaman ikut lokasi, tanah & musim dengan skor kesesuaian

## Teknologi

- React 19 + TypeScript + Vite
- Tailwind CSS v3 (tema hijau pertanian)
- Recharts (carta trend & permintaan-bekalan)

## Sumber Data

Data contoh dalam `src/data/mockData.ts` disusun mengikut struktur sumber sebenar
(METMalaysia, Jabatan Pertanian/DOA, MARDI, FAMA, data.gov.my, sensor IoT tanah)
supaya mudah disambung ke API kelak.

**Matriks kebergantungan data (lampiran kertas cadangan):** lihat [docs/DATA_MATRIX.md](docs/DATA_MATRIX.md)

**Crop Knowledge Repository (38 tanaman, enjin kalendar/cadangan/penyakit):** lihat [docs/CROP_KNOWLEDGE_REPOSITORY.md](docs/CROP_KNOWLEDGE_REPOSITORY.md)

```bash
npm run import:upm            # tempoh matang sayur (UPM)
npm run import:plantvillage   # penyakit (PlantVillage)
npm run import:agencies       # DOA Perak, MARDI, GeoTanih, FAMA
npm run import:data           # semua sumber di atas
```

### Integrasi API (MVP — aktif)

| Data | Endpoint / Sumber | Fail servis |
|------|-------------------|-------------|
| Ramalan cuaca 7 hari | `api.data.gov.my/weather/forecast` (METMalaysia) | `src/services/weather.ts` |
| Cuaca semasa (suhu, lembap, angin) | Open-Meteo | `src/services/weather.ts` |
| Amaran ribut/hujan | `api.data.gov.my/weather/warning` | `src/services/flood.ts` |
| Banjir (MVP) | Amaran MET + risiko hujan + [InfoBanjir](https://publicinfobanjir.water.gov.my) | `src/services/flood.ts` |
| Indeks harga (CPI) | `api.data.gov.my/opendosm?id=cpi_core` | `src/services/statistics.ts` |
| Pengeluaran tanaman | `api.data.gov.my/data-catalogue?id=crops_state` | `src/services/statistics.ts` |
| Kalendar agronomi | `src/data/agroSchedule.json` (MARDI kurasi) | `src/services/agroCalendar.ts` |
| Profil ladang + GPS | `localStorage` | `src/services/farmProfile.ts` |

Bar status **Sumber data** di atas app menunjukkan modul *live* vs *mock*. Butang **Muat semula** di tab Profil kemaskini negeri & GPS.

## Responsif (Laptop vs Telefon)

Satu aplikasi, dua pengalaman mengikut saiz skrin (breakpoint `md` = 768px):

| Peranti | Pengalaman |
|---------|------------|
| **Telefon** | Navigasi bawah, satu lajur, lebar maks ~448px — seperti app mudah-alih |
| **Laptop / desktop** | Sidebar kiri, bar atas, dashboard berbilang lajur, lebar penuh — seperti sistem web |

## Cara Jalankan

```bash
npm install
npm run dev           # pelayan pembangunan
npm run build         # bina untuk produksi
npm run build:pages   # bina untuk GitHub Pages (/smart-agro/)
npm run preview:pages # pratonton build Pages secara tempatan
```

## Struktur

```
src/
├── App.tsx                 # rangka aplikasi + navigasi
├── components/             # ikon, navigasi bawah, sparkline
├── data/                   # jenis & data contoh
├── lib/                    # utiliti UI
└── screens/                # Home, Calendar, Alerts, Market, Profile
```
