/**
 * Data operasi demonstrasi — disusun seperti output sebenar
 * (METMalaysia, FAMA, DOA, MARDI, sensor IoT, rekod musim ladang).
 */
import type {
  Alert,
  CalendarTask,
  CropPlan,
  CropRecommendation,
  CurrentWeather,
  ForecastDay,
  MarketPrice,
  PriceTrendPoint,
  SupplyDemand,
} from './types';
import type { LadangPlot } from '../services/farmProfile';

export interface PlotCalendarEntry {
  plot: LadangPlot;
  plan: CropPlan;
}

export function buildPlotCalendarEntries(plots: LadangPlot[]): PlotCalendarEntry[] {
  return plots
    .map((plot) => {
      const plan = buildCropPlan(plot.cropId, getDemoPlantDate(plot.cropId));
      if (!plan) return null;
      return { plot, plan };
    })
    .filter((e): e is PlotCalendarEntry => e != null);
}
import { buildCropPlan, buildDiseaseAlerts, getCropById } from './cropKnowledge/repository';
import { getGeotanihSoilScore } from './cropKnowledge/imports/geotanihMerge';
import { fetchMarketPricesFromFama } from '../services/fama';
import type { FarmProfile } from '../services/farmProfile';

/** Fokus analisis / kalendar (blok terbesar) */
export const DEMO_TANAMAN_UTAMA_ID = 'cili-merah' as const;

/** 6 jenis sayur di ladang Haji Razali — jumlah 2.4 ha */
export const DEMO_LADANG_SAYUR: {
  cropId: string;
  keluasanHa: number;
  blok: string;
  catatanRingkas: string;
}[] = [
  { cropId: 'cili-merah', keluasanHa: 0.6, blok: 'Blok A', catatanRingkas: 'Pembungaan · permintaan & harga tinggi' },
  { cropId: 'sawi', keluasanHa: 0.4, blok: 'Blok B', catatanRingkas: 'Sesuai tanah liat berlumpur' },
  { cropId: 'kangkung', keluasanHa: 0.4, blok: 'Blok C', catatanRingkas: 'Tanah lembap · parit mencukupi' },
  { cropId: 'bayam', keluasanHa: 0.35, blok: 'Blok D', catatanRingkas: 'Pusingan pantas (~25–35 hari)' },
  { cropId: 'terung', keluasanHa: 0.35, blok: 'Blok E', catatanRingkas: 'Hasil tinggi; drainase baik' },
  { cropId: 'timun', keluasanHa: 0.3, blok: 'Blok F', catatanRingkas: 'Hasil tinggi; drainase baik' },
];

/** Koordinat ladang contoh — Kajang, Selangor (Mukim Semenyih berhampiran) */
export const DEMO_FARM_COORDS = { lat: 2.9931, lon: 101.7908 } as const;

const HARI_RINGKAS = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'] as const;

function formatDikemaskini(d = new Date()): string {
  const jam = d.getHours();
  const waktu =
    jam < 12 ? `${jam}.${String(d.getMinutes()).padStart(2, '0')} pagi` : `${jam > 12 ? jam - 12 : 12}.${String(d.getMinutes()).padStart(2, '0')} petang`;
  return `Hari ini, ${waktu} · METMalaysia / Stesen Kajang`;
}

function masaRelatif(jamLalu: number): string {
  if (jamLalu < 1) return 'Baru sahaja';
  if (jamLalu < 24) return `${Math.round(jamLalu)} jam lalu`;
  const hari = Math.round(jamLalu / 24);
  if (hari === 1) return 'Semalam, 6:15 petang';
  return `${hari} hari lalu`;
}

/** Tarikh tanam relatif — cili ~62 hari (pembungaan), sayur pendek ~20 hari */
export function getDemoPlantDate(cropId: string = DEMO_TANAMAN_UTAMA_ID): Date {
  const hariLalu =
    cropId === 'cili-merah' ? 62 : cropId === 'bayam' || cropId === 'kangkung' ? 20 : cropId === 'sawi' ? 22 : 45;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - hariLalu);
  return d;
}

export function buildDemoLadangPlots(): LadangPlot[] {
  return DEMO_LADANG_SAYUR.map(({ cropId, keluasanHa, blok, catatanRingkas }) => {
    const crop = getCropById(cropId);
    const plan = buildCropPlan(cropId, getDemoPlantDate(cropId));
    return {
      cropId,
      nama: crop?.nama ?? cropId,
      ikon: crop?.ikon ?? '🌱',
      keluasanHa,
      blok,
      fasaSemasa: plan?.fasaSemasa ?? '—',
      peratusKemajuan: plan?.peratusKemajuan ?? 0,
      hariKeTuaian: plan?.hariKeTuaian ?? 0,
      catatan: catatanRingkas,
    };
  });
}

/** Jadual gabungan tugasan semua blok */
export function buildCombinedCropPlan(plots: LadangPlot[]): CropPlan {
  const tugasan: CalendarTask[] = [];
  const selesai: CalendarTask[] = [];

  for (const plot of plots) {
    const plan = buildCropPlan(plot.cropId, getDemoPlantDate(plot.cropId));
    if (!plan) continue;
    const tag = plot.nama.split('(')[0].trim().split(' ')[0];
    for (const t of plan.tugasan) {
      const row: CalendarTask = {
        ...t,
        aktiviti: `[${tag}] ${t.aktiviti}`,
        catatan: [plot.blok, t.catatan].filter(Boolean).join(' · '),
      };
      if (t.selesai) selesai.push(row);
      else tugasan.push(row);
    }
  }

  const parseMs = (tarikh: string) => new Date(`${tarikh} 2026`).getTime();
  tugasan.sort((a, b) => parseMs(a.tarikh) - parseMs(b.tarikh));
  selesai.sort((a, b) => parseMs(a.tarikh) - parseMs(b.tarikh));

  const avgProgress = Math.round(
    plots.reduce((s, p) => s + p.peratusKemajuan, 0) / Math.max(1, plots.length)
  );
  const minHari = Math.min(...plots.map((p) => p.hariKeTuaian));
  const fokus = buildCropPlan(DEMO_TANAMAN_UTAMA_ID, getDemoPlantDate(DEMO_TANAMAN_UTAMA_ID));

  return {
    tanaman: 'Sayur berbilang',
    varieti: `${plots.length} jenis`,
    tarikhTanam: 'Berperingkat · Mac–Mei 2026',
    fasaSemasa: 'Pelbagai blok aktif',
    peratusKemajuan: avgProgress,
    hariKeTuaian: minHari,
    fasa: fokus?.fasa ?? [],
    tugasan: [...tugasan, ...selesai.slice(-4)],
  };
}

/** Senarai tanaman sedang diusahakan (bukan cadangan) */
export function buildDemoTanamanAktif(jenisTanah: string, negeri: string): CropRecommendation[] {
  return DEMO_LADANG_SAYUR.map(({ cropId, keluasanHa, catatanRingkas }) => {
    const crop = getCropById(cropId);
    const plot = buildDemoLadangPlots().find((p) => p.cropId === cropId);
    const geo = getGeotanihSoilScore(cropId, jenisTanah) ?? 72;
    const kesesuaian = Math.min(98, Math.round(geo + (negeri === 'Selangor' ? 5 : 0)));
    return {
      cropId,
      nama: crop?.nama ?? cropId,
      ikon: crop?.ikon ?? '🌱',
      kesesuaian,
      musim: crop?.musimTanam ?? '—',
      tempohMatang: crop
        ? `${crop.tempohMatangHari.min}–${crop.tempohMatangHari.max} hari`
        : '—',
      anggaranHasil: crop?.anggaranHasil ?? '—',
      permintaan: crop?.permintaanPasaran ?? 'sederhana',
      catatan: `${keluasanHa} ha · ${plot?.fasaSemasa ?? '—'} · ${catatanRingkas}`,
    };
  });
}

/** @deprecated guna buildDemoTanamanAktif */
export const buildDemoSayurRecommendations = buildDemoTanamanAktif;

export function buildDemoFarmer(): FarmProfile {
  const tanam = getDemoPlantDate();
  return {
    nama: 'Haji Razali bin Osman',
    lokasi: 'Kajang',
    negeri: 'Selangor',
    keluasan: 2.4,
    jenisTanah: 'Tanah Liat Berlumpur',
    tanamanUtama: 'Sayur berbilang (6 jenis)',
    avatar: '🧑‍🌾',
    cropId: DEMO_TANAMAN_UTAMA_ID,
    ladangPlots: buildDemoLadangPlots(),
    lat: DEMO_FARM_COORDS.lat,
    lon: DEMO_FARM_COORDS.lon,
    noPetani: 'SP-SEL-2019-04821',
    noLot: 'PT 4827, Mukim Semenyih',
    daerah: 'Hulu Langat',
    parit: 'Parit 7 · Drainase & berparit',
    telefon: '012-345 6789',
    sistemPertanian: 'Sayur campuran · Cili, Sawi, Kangkung, Bayam, Terung, Timun',
    kemaskini: new Date().toISOString(),
    tarikhTanamSemasa: tanam.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

export interface SoilSensorReading {
  sensorId: string;
  lokasi: string;
  dikemaskini: string;
  kelembapanTanah: number;
  suhuTanah: number;
  ph: number;
  konduktiviti: number;
  nitrogen: number;
  fosforus: number;
  kalium: number;
  parasAirSawah: number;
  unitAir: 'cm';
  status: 'normal' | 'awas' | 'kritikal';
  nota: string;
}

export interface HarvestRecord {
  musim: string;
  tanaman: string;
  hasilTan: number;
  keluasanHa: number;
  hasilTanHa: number;
  pendapatanRm: number;
  catatan: string;
}

export interface FarmSeasonInsight {
  tahun: number;
  bulan: string;
  peristiwa: string;
  impak: string;
}

function buildForecast(): ForecastDay[] {
  const today = new Date().getDay();
  const pola = [
    { ikon: '⛅', suhuMin: 24, suhuMax: 31, hujan: 45 },
    { ikon: '🌧️', suhuMin: 23, suhuMax: 29, hujan: 78 },
    { ikon: '🌧️', suhuMin: 23, suhuMax: 28, hujan: 85 },
    { ikon: '⛅', suhuMin: 24, suhuMax: 30, hujan: 50 },
    { ikon: '☀️', suhuMin: 25, suhuMax: 33, hujan: 25 },
    { ikon: '☀️', suhuMin: 25, suhuMax: 33, hujan: 18 },
    { ikon: '⛅', suhuMin: 24, suhuMax: 32, hujan: 38 },
  ] as const;
  return pola.map((p, i) => ({
    ...p,
    hari: HARI_RINGKAS[(today + i) % 7],
  }));
}

export function buildDemoWeather(profile: FarmProfile): {
  current: CurrentWeather;
  forecast: ForecastDay[];
} {
  return {
    current: {
      suhu: 28,
      keadaan: 'Berawan',
      ikon: '⛅',
      kelembapan: 74,
      angin: 9,
      hujan: 62,
      lokasi: `${profile.lokasi}, ${profile.negeri}`,
      dikemaskini: formatDikemaskini(),
    },
    forecast: buildForecast(),
  };
}

export function buildDemoAlerts(
  cropId: string,
  ctx: { kelembapan: number; maxRain: number }
): Alert[] {
  const penyakit = buildDiseaseAlerts(cropId, {
    kelembapan: ctx.kelembapan,
    hujanPct: ctx.maxRain,
  }).map((a, i) => ({
    ...a,
    id: `demo-penyakit-${i}`,
    masa: i === 0 ? masaRelatif(2) : masaRelatif(5),
    keterangan:
      i === 0
        ? cropId.includes('cili')
          ? 'Kelembapan 74% & hujan 78–85% Rab–Kha meningkat risiko antraknosa / hawar daun pada cili fasa pembungaan. IoT: kelembapan tanah 68%.'
          : `Kelembapan tinggi meningkat risiko penyakit daun pada ${cropId}. IoT: kelembapan tanah 68%.`
        : a.keterangan,
    tindakan:
      i === 0
        ? cropId.includes('cili')
          ? 'Semburan kawalan (mankozeb/kuprum) dalam 48 jam; pastikan parit lancar & kurangkan siraman berlebihan.'
          : 'Pantau daun muda; semburan pencegahan ikut jadual DOA/MARDI.'
        : a.tindakan,
  }));

  return [
    ...penyakit.slice(0, 2),
    {
      id: 'demo-cuaca-hujan',
      kategori: 'cuaca',
      tajuk: 'Amaran Hujan Lebat — Selangor',
      tahap: 'sederhana',
      keterangan:
        'METMalaysia: Hujan lebat dijangka Rabu–Khamis (kebarangkalian 78–85%). Angin kuat di kawasan berhampiran.',
      tindakan: 'Tunda pembajaan; pastikan parit & drainase ladang sayur berfungsi.',
      masa: masaRelatif(5),
      ikon: '🌧️',
    },
    {
      id: 'demo-banjir',
      kategori: 'banjir',
      tajuk: 'Paras Sungai Langat — Normal',
      tahap: 'rendah',
      keterangan:
        'InfoBanjir JPS: Paras 1.42 m (09:00 pagi). Ambang amaran 2.50 m. Tiada risiko banjir kilat setakat ini.',
      tindakan: 'Pantau semula selepas hujan Khamis; rekod paras air parit ladang.',
      masa: masaRelatif(6),
      ikon: '🌊',
    },
    {
      id: 'demo-perosak',
      kategori: 'perosak',
      tajuk: 'Thrips & Ulat Grayak — Di Bawah AET',
      tahap: 'rendah',
      keterangan:
        'Pemerhatian Lot PT4827: thrips <5% daun; ulat grayak sporadik pada cili. Belum melepasi ambang ekonomi.',
      tindakan: 'Teruskan pemantauan 2x seminggu; semburan selektif jika melebihi 10% tanaman terjejas.',
      masa: masaRelatif(28),
      ikon: '🦗',
    },
    {
      id: 'demo-baja',
      kategori: 'cuaca',
      tajuk: 'Peringatan Baja Kalium (Cili)',
      tahap: 'rendah',
      keterangan: 'Jadual ladang: Top-dress kalium & organik fasa pembungaan dalam 2 hari.',
      tindakan: 'Laksanakan sebelum hujan lebat Rabu; elakkan baja semasa hujan lebat.',
      masa: 'Esok, 7:00 pagi',
      ikon: '🧪',
    },
  ];
}

export function buildDemoSupplyDemand(): SupplyDemand[] {
  return [
    { komoditi: 'Padi (Beras Super)', permintaan: 91, bekalan: 76 },
    { komoditi: 'Cili Merah', permintaan: 89, bekalan: 61 },
    { komoditi: 'Tomato', permintaan: 71, bekalan: 84 },
    { komoditi: 'Jagung Manis', permintaan: 76, bekalan: 70 },
    { komoditi: 'Bayam', permintaan: 68, bekalan: 59 },
    { komoditi: 'Timun', permintaan: 72, bekalan: 77 },
    { komoditi: 'Sawi (Caisim)', permintaan: 65, bekalan: 63 },
  ];
}

export function buildDemoPriceTrend(): PriceTrendPoint[] {
  return [
    { bulan: 'Jul 25', padi: 1460, sayur: 3.7, buah: 5.1 },
    { bulan: 'Ogo 25', padi: 1475, sayur: 3.8, buah: 5.0 },
    { bulan: 'Sep 25', padi: 1490, sayur: 4.2, buah: 5.4 },
    { bulan: 'Okt 25', padi: 1485, sayur: 4.0, buah: 5.2 },
    { bulan: 'Nov 25', padi: 1500, sayur: 4.1, buah: 5.5 },
    { bulan: 'Dis 25', padi: 1510, sayur: 3.9, buah: 5.3 },
    { bulan: 'Jan 26', padi: 1505, sayur: 4.1, buah: 5.0 },
    { bulan: 'Feb 26', padi: 1520, sayur: 4.0, buah: 5.4 },
    { bulan: 'Mac 26', padi: 1510, sayur: 4.3, buah: 5.6 },
    { bulan: 'Apr 26', padi: 1545, sayur: 4.5, buah: 5.3 },
    { bulan: 'Mei 26', padi: 1560, sayur: 4.4, buah: 5.7 },
    { bulan: 'Jun 26', padi: 1580, sayur: 4.6, buah: 5.9 },
  ];
}

export function buildDemoSoilSensor(profile: FarmProfile): SoilSensorReading {
  return {
    sensorId: 'IOT-SEL-KJ-00482',
    lokasi: `${profile.noLot ?? profile.lokasi} · ${profile.lokasi}`,
    dikemaskini: formatDikemaskini().replace('METMalaysia / Stesen Kajang', 'Sensor IoT · 15 min'),
    kelembapanTanah: 68,
    suhuTanah: 27.2,
    ph: 5.8,
    konduktiviti: 420,
    nitrogen: 42,
    fosforus: 28,
    kalium: 55,
    parasAirSawah: 5.2,
    unitAir: 'cm',
    status: 'normal',
    nota: 'pH 5.8 sesuai 6 jenis sayur; kelembapan baik untuk cili, sawi, kangkung, bayam, terung & timun.',
  };
}

export const DEMO_HARVEST_HISTORY: HarvestRecord[] = [
  {
    musim: '2025/26',
    tanaman: '6 jenis (cili, sawi, kangkung, bayam, terung, timun)',
    hasilTan: 28.4,
    keluasanHa: 2.4,
    hasilTanHa: 11.83,
    pendapatanRm: 248600,
    catatan: 'Campuran sayur; cili menyumbang ~45% pendapatan.',
  },
  {
    musim: '2024/25',
    tanaman: 'Sawi, kangkung, bayam (pusingan pantas)',
    hasilTan: 22.1,
    keluasanHa: 2.4,
    hasilTanHa: 9.21,
    pendapatanRm: 88600,
    catatan: 'Blok D–F pusingan 3–4 kali setahun.',
  },
  {
    musim: '2023/24',
    tanaman: 'Cili + terung + timun',
    hasilTan: 26.8,
    keluasanHa: 2.4,
    hasilTanHa: 11.17,
    pendapatanRm: 231200,
    catatan: 'Rekod terbaik; harga cili purata RM10.20/kg.',
  },
];

export const DEMO_SEASON_INSIGHTS: FarmSeasonInsight[] = [
  { tahun: 2024, bulan: 'Jun–Ogos', peristiwa: 'Purata hujan tinggi (barat)', impak: 'Risiko banjir & hawar daun meningkat' },
  { tahun: 2024, bulan: 'September', peristiwa: 'Harga cili tertinggi (RM11/kg)', impak: 'Peluang pendapatan sayur tinggi' },
  { tahun: 2025, bulan: 'Oktober', peristiwa: 'Thrips pada cili — sederhana', impak: 'Kawalan semburan 2x diperlukan' },
  { tahun: 2025, bulan: 'Disember', peristiwa: 'Harga cili stabil RM9.50–10/kg', impak: 'Margin untung musim sayur baik' },
];

export interface DemoDataBundle {
  farmer: FarmProfile;
  ladangPlots: LadangPlot[];
  plotCalendars: PlotCalendarEntry[];
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  cropPlan: CropPlan;
  alerts: Alert[];
  marketPrices: MarketPrice[];
  priceTrend: PriceTrendPoint[];
  supplyDemand: SupplyDemand[];
  cropRecommendations: CropRecommendation[];
  soilSensor: SoilSensorReading;
  harvestHistory: HarvestRecord[];
  seasonInsights: FarmSeasonInsight[];
  syncedAt: string;
}

export async function buildDemoDataBundle(profile?: FarmProfile): Promise<DemoDataBundle> {
  const base = buildDemoFarmer();
  const plots = profile?.ladangPlots?.length ? profile.ladangPlots : buildDemoLadangPlots();
  const farmer: FarmProfile = {
    ...base,
    ...profile,
    cropId: profile?.cropId ?? base.cropId,
    lat: profile?.lat ?? base.lat,
    lon: profile?.lon ?? base.lon,
    nama: profile?.nama?.trim() ? profile.nama : base.nama,
    ladangPlots: plots,
    tanamanUtama: profile?.ladangPlots?.length ? profile.tanamanUtama : base.tanamanUtama,
  };
  const cropId = farmer.cropId ?? DEMO_TANAMAN_UTAMA_ID;
  const { current, forecast } = buildDemoWeather(farmer);
  const maxRain = Math.max(...forecast.map((f) => f.hujan), current.hujan);

  const plotCalendars = buildPlotCalendarEntries(plots);
  const cropPlan = buildCombinedCropPlan(plots);
  const cropRecommendations = buildDemoTanamanAktif(farmer.jenisTanah, farmer.negeri);

  const marketPrices = await fetchMarketPricesFromFama();

  return {
    farmer,
    ladangPlots: plots,
    plotCalendars,
    currentWeather: current,
    forecast,
    cropPlan,
    alerts: buildDemoAlerts(cropId, { kelembapan: current.kelembapan, maxRain }),
    marketPrices: marketPrices.length ? marketPrices : [],
    priceTrend: buildDemoPriceTrend(),
    supplyDemand: buildDemoSupplyDemand(),
    cropRecommendations,
    soilSensor: buildDemoSoilSensor(farmer),
    harvestHistory: DEMO_HARVEST_HISTORY,
    seasonInsights: DEMO_SEASON_INSIGHTS,
    syncedAt: new Date().toISOString(),
  };
}

/** Muat / kemas kini profil demo (sayur · Kajang) */
export function seedDemoProfileIfEmpty(): void {
  const KEY = 'smart-agro-farm-profile';
  const FLAG = 'smart-agro-demo-seeded-v4';
  const MIGRATE = 'smart-agro-migrated-multicrop-v4';
  try {
    const demo = buildDemoFarmer();
    if (!localStorage.getItem(FLAG)) {
      localStorage.setItem(KEY, JSON.stringify(demo));
      localStorage.setItem(FLAG, '1');
      localStorage.removeItem('smart-agro-demo-seeded-v2');
      localStorage.removeItem('smart-agro-demo-seeded-v3');
    } else if (!localStorage.getItem(MIGRATE)) {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as FarmProfile;
        localStorage.setItem(
          KEY,
          JSON.stringify({
            ...demo,
            nama: p.nama?.trim() ? p.nama : demo.nama,
            lat: p.lat ?? demo.lat,
            lon: p.lon ?? demo.lon,
          })
        );
      }
      localStorage.setItem(MIGRATE, '1');
    }
  } catch {
    /* abaikan */
  }
}
