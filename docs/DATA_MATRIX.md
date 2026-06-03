# Matriks Kebergantungan Data SMART AGRO

Dokumen ini memetakan setiap modul aplikasi dengan sumber data, ketersediaan API, dan tahap integrasi — sesuai sebagai **lampiran kertas cadangan projek**.

---

## Jadual Pemetaan Modul dan Ketersediaan Data

| Modul | Data Diperlukan | Sumber Data | API/Data Sedia Ada | Status |
| ----- | --------------- | ----------- | ------------------ | ------ |
| **1. Kalendar Penanaman Pintar** | Cuaca semasa, ramalan cuaca, musim, suhu, hujan | METMalaysia, Data.gov.my | API Data Cuaca | ✅ Tersedia |
| | Tempoh matang tanaman, jadual agronomi | MARDI, DOA | Dokumen/manual teknikal | 🟡 Perlu integrasi |
| | Lokasi ladang | Input pengguna | Sistem sendiri | ✅ Tersedia |
| **2. Cadangan Tanaman Mengikut Kawasan** | Jenis tanah | DOA, MARDI | Dataset GIS | 🟡 Perlu permohonan |
| | Data iklim kawasan | METMalaysia | API | ✅ Tersedia |
| | Koordinat lokasi | GPS telefon / pengguna | API peranti | ✅ Tersedia |
| | Peta guna tanah | JUPEM, MyGDI | GIS Service | 🟡 Perlu akses |
| **3. Amaran Cuaca & Risiko Banjir** | Cuaca semasa | METMalaysia | API | ✅ Tersedia |
| | Ramalan hujan | METMalaysia | API | ✅ Tersedia |
| | Amaran ribut/petir | METMalaysia | API | ✅ Tersedia |
| | Paras sungai | InfoBanjir (JPS) | Web Service | 🟡 Separa terbuka |
| | Zon banjir | JPS | GIS Layer | 🟡 Perlu integrasi |
| **4. Amaran Penyakit & Perosak** | Imej tanaman | Pengguna | Upload aplikasi | ✅ Tersedia |
| | Dataset penyakit tanaman | PlantVillage | Dataset terbuka | ✅ Tersedia |
| | Data penyakit tempatan | MARDI, DOA | Data dalaman | 🟡 Perlu kerjasama |
| | Model AI pengesanan penyakit | Dibangunkan sendiri | ML Model | ❌ Perlu dibina |
| **5. Harga Pasaran Hasil Tani** | Harga borong | FAMA | Sistem harga FAMA | 🟡 Perlu akses |
| | Harga runcit | FAMA | Sistem harga FAMA | 🟡 Perlu akses |
| | Trend harga makanan | DOSM OpenDOSM | API | ✅ Tersedia |
| | Harga komoditi | MPOB, LGM, RISDA | Portal Agensi | 🟡 Sebahagian |
| **6. Analitik Permintaan & Bekalan** | Pengeluaran pertanian | DOSM | API | ✅ Tersedia |
| | Statistik tanaman | DOA | Dataset | 🟡 Perlu akses |
| | Import/eksport | DOSM, MATRADE, MAQIS | API / Dataset | ✅ Sebahagian |
| | Harga pasaran | FAMA | Sistem FAMA | 🟡 Perlu akses |
| | Forecast AI | Dibangunkan sendiri | Model AI | ❌ Perlu dibina |
| **7. Dashboard Pemantauan Pertanian** | Lokasi ladang | Pengguna | Sistem sendiri | ✅ Tersedia |
| | Cuaca | METMalaysia | API | ✅ Tersedia |
| | Banjir | JPS | Web Service | 🟡 Separa terbuka |
| | Harga pasaran | FAMA, DOSM | API/Dataset | 🟡 Sebahagian |
| | Penyakit tanaman | Sistem AI | Internal API | ❌ Perlu dibina |
| | Peta GIS | JUPEM, MyGDI | GIS Service | 🟡 Perlu akses |

---

## Ringkasan Tahap Kesediaan Data Mengikut Modul

| Modul | Tahap Kesediaan |
| ----- | --------------- |
| Kalendar Penanaman Pintar | 🟢 80% |
| Cadangan Tanaman Mengikut Kawasan | 🟡 60% |
| Amaran Cuaca & Risiko Banjir | 🟢 90% |
| Amaran Penyakit & Perosak | 🟡 50% |
| Harga Pasaran Hasil Tani | 🟡 60% |
| Analitik Permintaan & Bekalan | 🟡 70% |
| Dashboard Pemantauan Pertanian | 🟢 75% |

---

## Cadangan MVP (Tanpa MoU Agensi)

Modul yang boleh dibangunkan serta-merta menggunakan data terbuka:

| Modul MVP | Sumber |
| --------- | ------ |
| Cuaca Semasa & Ramalan | METMalaysia / Data.gov.my |
| Amaran Cuaca | METMalaysia |
| Risiko Banjir | InfoBanjir |
| Dashboard GIS | OpenStreetMap + Data.gov.my |
| Statistik Pertanian | OpenDOSM |
| Analitik Ringkas | OpenDOSM + Data.gov.my |
| Kalendar Penanaman Asas | Cuaca + Jadual tanaman MARDI (manual/JSON) |

**Anggaran kesediaan MVP:** 70–80% tanpa menunggu perkongsian data rasmi FAMA, DOA atau MARDI.

---

## Modul Yang Memerlukan Kerjasama Rasmi Agensi

| Agensi | Data |
| ------ | ---- |
| FAMA | Harga pasaran harian |
| DOA | Peta kesesuaian tanaman, jenis tanah |
| MARDI | Penyakit tanaman, varieti tanaman |
| JUPEM / MyGDI | GIS dan lapisan spatial rasmi |
| JPS | Data hidrologi terperinci |

---

## Pemetaan ke Kod SMART AGRO (Semasa)

| Skrin / Modul UI | Fail kod | Data sekarang | Sedia untuk API MVP |
| ---------------- | -------- | ------------- | ------------------- |
| Utama (Dashboard) | `src/screens/Home.tsx` | `mockData.ts` | METMalaysia, InfoBanjir, OpenDOSM |
| Kalendar | `src/screens/Calendar.tsx` | `cropPlan` mock | Cuaca API + JSON jadual MARDI |
| Cadangan Tanaman | `src/screens/Profile.tsx` | `cropRecommendations` mock | METMalaysia + GPS + OSM (fasa 2: DOA GIS) |
| Amaran | `src/screens/Alerts.tsx` | `alerts`, `forecast` mock | METMalaysia + InfoBanjir |
| Diagnosis gambar | `src/screens/Alerts.tsx` | Simulasi AI | PlantVillage + model sendiri (fasa 2) |
| Pasaran | `src/screens/Market.tsx` | `marketPrices` mock | OpenDOSM (fasa 2: FAMA) |
| Analitik | `src/screens/Market.tsx` | `supplyDemand` mock | OpenDOSM |
| Profil / ladang | `src/screens/Profile.tsx`, `farmer` | Mock statik | LocalStorage / backend sendiri |

Lapisan data disentralkan dalam `src/data/mockData.ts` — direka supaya diganti oleh `src/services/` (API adapters) tanpa ubah UI.

---

## Fasa Integrasi Disyorkan

### Fasa 1 — MVP (0–3 bulan)
- [x] METMalaysia: ramalan 7 hari via `api.data.gov.my/weather/forecast`
- [x] Cuaca semasa: Open-Meteo (hybrid dengan MET)
- [x] Amaran cuaca: `api.data.gov.my/weather/warning`
- [x] InfoBanjir: pautan portal + risiko hujan (API rasmi tiada CORS)
- [x] OpenDOSM: CPI (`cpi_core`) + `crops_state` untuk analitik
- [x] Profil ladang: LocalStorage + GPS
- [x] Kalendar: `src/data/agroSchedule.json` (jadual MARDI kurasi)

### Fasa 2 — Pengayaan (3–6 bulan)
- [ ] OpenStreetMap + Data.gov.my untuk peta asas
- [x] PlantVillage import (penyakit) — `npm run import:plantvillage`
- [x] FAMA harga rujukan (kurasi import) — `npm run import:agencies` · API live: MoU
- [x] DOA Perak SOP + MARDI jadual + GeoTanih tanah (import JSON)

### Fasa 3 — Kerjasama agensi (6+ bulan)
- [ ] MoU FAMA, DOA, MARDI, JPS, JUPEM/MyGDI
- [ ] GIS rasmi, zon banjir, kesesuaian tanah
- [ ] Forecast AI permintaan-bekalan

---

*SMART AGRO · Inisiatif 3 — Platform Pintar Pertanian*
