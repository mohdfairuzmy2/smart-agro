import {
  HASIL_PURATA_TAN_HA,
  KOS_LADANG_PER_HA,
  PERBANDINGAN_KAWASAN_SELANGOR,
  RISIKO_SKOR_TANAMAN,
  getNotaMusim,
} from '../data/analysisReference';
import { getGeotanihSoilScore } from '../data/cropKnowledge/imports/geotanihMerge';
import { buildCropPlan, getCropById, resolveCropIdFromLabel } from '../data/cropKnowledge/repository';
import { getDemoPlantDate } from '../data/demoScenario';
import { getFamaPriceForCrop } from './fama';
import type { FarmProfile, LadangPlot } from './farmProfile';
import type {
  Alert,
  AlertLevel,
  CropPlan,
  CropRecommendation,
  CurrentWeather,
  ForecastDay,
  MarketPrice,
  SupplyDemand,
} from '../data/types';

export type AnalysisModul =
  | 'kesihatan'
  | 'whatif'
  | 'kos'
  | 'risiko'
  | 'musim'
  | 'kawasan'
  | 'penyakit'
  | 'matang'
  | 'pasaran'
  | 'rumusan';

export interface HealthFactor {
  nama: string;
  skor: number;
  ikon: string;
}

export interface HealthScore {
  faktor: HealthFactor[];
  keseluruhan: number;
  status: 'baik' | 'sederhana' | 'perhatian';
  statusLabel: string;
  cadangan: string;
}

export interface WhatIfScenario {
  id: string;
  label: string;
  tanaman: string;
  blok: string;
  keluasanHa: number;
  risiko: AlertLevel;
  anggaranUntungRm: number;
  anggaranHasilTan: number;
  pendapatanRm: number;
  kosRm: number;
  disyorkan: boolean;
  nota: string;
  jenis: 'kekal' | 'pusingan';
}

export interface BlokAnalisis {
  cropId: string;
  nama: string;
  ikon: string;
  blok: string;
  keluasanHa: number;
  catatan: string;
  fasaSemasa: string;
  peratusKemajuan: number;
  hariKeTuaian: number;
  kematangan: MaturityAnalysis;
  kewangan: CostBreakdown;
  hargaRm: number;
  hargaUnit: string;
}

export interface LadangKewangan {
  jumlahPendapatan: number;
  jumlahKos: number;
  untungBersih: number;
  jumlahHasilTan: number;
  keluasanHa: number;
  nota: string;
}

export interface CostBreakdown {
  benih: number;
  baja: number;
  racun: number;
  air: number;
  buruh: number;
  pengangkutan: number;
  jumlahKos: number;
  pendapatan: number;
  untungBersih: number;
  hasilTan: number;
  hargaUnit: string;
}

export interface RiskMatrixRow {
  risiko: string;
  tahap: AlertLevel;
  ikon: string;
}

export interface MaturityAnalysis {
  umurHari: number;
  peratusMatang: number;
  fasa: string;
  hariKeTuaian: number;
  tarikhTuai: string;
  statusLabel: string;
}

export interface MarketOpportunity {
  permintaanTrend: string;
  bekalanTrend: string;
  peluang: 'tinggi' | 'sederhana' | 'rendah';
  peluangLabel: string;
  cadangan: string;
  permintaanPct: number | null;
  bekalanPct: number | null;
}

export interface DiseaseAiInsight {
  penyakit: string;
  ketepatanPct: number;
  tahap: AlertLevel;
  cadangan: string;
  simptom: string;
  sumber: string;
}

export interface BlokPenyakitAi extends DiseaseAiInsight {
  blok: string;
  cropId: string;
  namaTanaman: string;
}

export interface AiRumusan {
  tanaman: string;
  fasa: string;
  risiko: string;
  hargaPasaran: string;
  anggaranHasilTan: number | null;
  anggaranPendapatanRm: number | null;
  anggaranUntungRm: number | null;
  cadangan: string[];
}

export interface FarmAnalysisReport {
  dikemaskini: string;
  ladangCampuran: boolean;
  blokAnalisis: BlokAnalisis[];
  ladangKewangan: LadangKewangan;
  kesihatan: HealthScore;
  whatIf: WhatIfScenario[];
  whatIfTerbaik: string;
  kosKeuntungan: CostBreakdown;
  matriksRisiko: RiskMatrixRow[];
  trendMusim: { tempoh: string; nota: string[] }[];
  perbandinganKawasan: typeof PERBANDINGAN_KAWASAN_SELANGOR;
  penyakitAi: DiseaseAiInsight;
  penyakitPerBlok: BlokPenyakitAi[];
  kematangan: MaturityAnalysis;
  peluangPasaran: MarketOpportunity;
  rumusan: AiRumusan;
  tanaman: { naratif: string; cadanganUtama: string; alternatif: CropRecommendation[] };
  jadual: { cadanganTindakan: string; tugasanSegera: string | null };
}

function parseYieldMidPerHa(anggaran: string): number | null {
  const range = anggaran.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*tan/i);
  if (range) return (parseFloat(range[1]) + parseFloat(range[2])) / 2;
  const single = anggaran.match(/(\d+(?:\.\d+)?)\s*tan/i);
  return single ? parseFloat(single[1]) : null;
}

function addDaysLabel(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
}

function risikoFromSkor(skor: number): AlertLevel {
  if (skor >= 80) return 'rendah';
  if (skor >= 65) return 'sederhana';
  return 'tinggi';
}

function labelRisiko(t: AlertLevel): string {
  return t === 'tinggi' ? 'Tinggi' : t === 'sederhana' ? 'Sederhana' : 'Rendah';
}

function estimateRevenue(tons: number, harga: number, unit: string): number {
  if (unit === 'tan') return Math.round(tons * harga);
  return Math.round(tons * 1000 * harga);
}

function buildCostProfitForHa(
  keluasanHa: number,
  cropId: string,
  harga: number,
  unit: string
): CostBreakdown {
  const crop = getCropById(cropId);
  const kat = crop?.kategori ?? 'sayur';
  const kosKey = kat === 'padi' ? 'padi' : kat === 'buah' ? 'buah' : kat === 'sayur' ? 'sayur' : 'default';
  const perHa = KOS_LADANG_PER_HA[kosKey] ?? KOS_LADANG_PER_HA.default;
  const yieldHa =
    parseYieldMidPerHa(crop?.anggaranHasil ?? '') ??
    HASIL_PURATA_TAN_HA[cropId] ??
    HASIL_PURATA_TAN_HA.default;
  const hasilTan = Math.round(yieldHa * keluasanHa * 10) / 10;
  const benih = perHa.benih * keluasanHa;
  const baja = perHa.baja * keluasanHa;
  const racun = perHa.racun * keluasanHa;
  const air = perHa.air * keluasanHa;
  const buruh = perHa.buruh * keluasanHa;
  const pengangkutan = perHa.pengangkutan * keluasanHa;
  const jumlahKos = benih + baja + racun + air + buruh + pengangkutan;
  const pendapatan = estimateRevenue(hasilTan, harga, unit);
  return {
    benih: Math.round(benih),
    baja: Math.round(baja),
    racun: Math.round(racun),
    air: Math.round(air),
    buruh: Math.round(buruh),
    pengangkutan: Math.round(pengangkutan),
    jumlahKos: Math.round(jumlahKos),
    pendapatan,
    untungBersih: pendapatan - Math.round(jumlahKos),
    hasilTan,
    hargaUnit: unit,
  };
}

function buildCostProfit(
  farmer: FarmProfile,
  cropId: string,
  harga: number,
  unit: string
): CostBreakdown {
  return buildCostProfitForHa(farmer.keluasan, cropId, harga, unit);
}

function priceForCrop(cropId: string): { harga: number; unit: string } {
  const fama = getFamaPriceForCrop(cropId);
  return {
    harga: fama?.hargaRm ?? (cropId.includes('cili') ? 9.8 : 2.5),
    unit: fama?.unit ?? 'kg',
  };
}

function buildBlokAnalisis(plot: LadangPlot): BlokAnalisis {
  const plan = buildCropPlan(plot.cropId, getDemoPlantDate(plot.cropId));
  const { harga, unit } = priceForCrop(plot.cropId);
  const kewangan = buildCostProfitForHa(plot.keluasanHa, plot.cropId, harga, unit);
  const kematangan = plan ? buildMaturity(plan, plot.cropId) : buildMaturityFromPlot(plot);

  return {
    cropId: plot.cropId,
    nama: plot.nama,
    ikon: plot.ikon,
    blok: plot.blok,
    keluasanHa: plot.keluasanHa,
    catatan: plot.catatan,
    fasaSemasa: plot.fasaSemasa,
    peratusKemajuan: plot.peratusKemajuan,
    hariKeTuaian: plot.hariKeTuaian,
    kematangan,
    kewangan,
    hargaRm: harga,
    hargaUnit: unit,
  };
}

function buildMaturityFromPlot(plot: LadangPlot): MaturityAnalysis {
  return {
    umurHari: 0,
    peratusMatang: plot.peratusKemajuan,
    fasa: plot.fasaSemasa,
    hariKeTuaian: plot.hariKeTuaian,
    tarikhTuai: addDaysLabel(plot.hariKeTuaian),
    statusLabel: plot.peratusKemajuan >= 85 ? 'Hampir matang' : plot.peratusKemajuan >= 50 ? 'Pertengahan' : 'Belia',
  };
}

function aggregateLadangKewangan(bloks: BlokAnalisis[], keluasanHa: number): LadangKewangan {
  const jumlahPendapatan = bloks.reduce((s, b) => s + b.kewangan.pendapatan, 0);
  const jumlahKos = bloks.reduce((s, b) => s + b.kewangan.jumlahKos, 0);
  const jumlahHasilTan = Math.round(bloks.reduce((s, b) => s + b.kewangan.hasilTan, 0) * 10) / 10;
  return {
    jumlahPendapatan,
    jumlahKos,
    untungBersih: jumlahPendapatan - jumlahKos,
    jumlahHasilTan,
    keluasanHa,
    nota: `Jumlah ${bloks.length} blok · anggaran per blok (keluasan × hasil/ha × harga FAMA − kos rujukan/ha). Bukan invois sebenar.`,
  };
}

function ladangKewanganToCostBreakdown(l: LadangKewangan, bloks: BlokAnalisis[]): CostBreakdown {
  return {
    benih: bloks.reduce((s, b) => s + b.kewangan.benih, 0),
    baja: bloks.reduce((s, b) => s + b.kewangan.baja, 0),
    racun: bloks.reduce((s, b) => s + b.kewangan.racun, 0),
    air: bloks.reduce((s, b) => s + b.kewangan.air, 0),
    buruh: bloks.reduce((s, b) => s + b.kewangan.buruh, 0),
    pengangkutan: bloks.reduce((s, b) => s + b.kewangan.pengangkutan, 0),
    jumlahKos: l.jumlahKos,
    pendapatan: l.jumlahPendapatan,
    untungBersih: l.untungBersih,
    hasilTan: l.jumlahHasilTan,
    hargaUnit: 'campuran',
  };
}

/** Pusingan cadangan per blok (musim seterusnya) — bukan ganti seluruh ladang */
const PUSINGAN_BLOK: Record<string, { cropId: string; sebab: string }> = {
  'Blok A': { cropId: 'cili-merah', sebab: 'Kekalkan cili — permintaan & harga masih kuat' },
  'Blok B': { cropId: 'kangkung', sebab: 'Pusingan sawi → kangkung (tanah lembap)' },
  'Blok C': { cropId: 'bayam', sebab: 'Pusingan pantas selepas kangkung' },
  'Blok D': { cropId: 'sawi', sebab: 'Pusingan pantas 25–35 hari' },
  'Blok E': { cropId: 'timun', sebab: 'Teruskan terung atau tukar timun (drainase)' },
  'Blok F': { cropId: 'terung', sebab: 'Pusingan timun → terung (hasil tinggi)' },
};

function buildWhatIfBlok(plots: LadangPlot[]): { scenarios: WhatIfScenario[]; terbaik: string } {
  const scenarios: WhatIfScenario[] = [];

  for (const plot of plots) {
    const pusingan = PUSINGAN_BLOK[plot.blok];
    if (!pusingan || pusingan.cropId === plot.cropId) continue;

    const crop = getCropById(pusingan.cropId);
    const { harga, unit } = priceForCrop(pusingan.cropId);
    const cp = buildCostProfitForHa(plot.keluasanHa, pusingan.cropId, harga, unit);
    const skor = RISIKO_SKOR_TANAMAN[pusingan.cropId] ?? RISIKO_SKOR_TANAMAN.default;

    scenarios.push({
      id: `pusingan-${plot.blok}-${pusingan.cropId}`,
      label: `${plot.blok}: ${crop?.nama ?? pusingan.cropId}`,
      tanaman: crop?.nama ?? pusingan.cropId,
      blok: plot.blok,
      keluasanHa: plot.keluasanHa,
      risiko: risikoFromSkor(skor),
      anggaranUntungRm: cp.untungBersih,
      anggaranHasilTan: cp.hasilTan,
      pendapatanRm: cp.pendapatan,
      kosRm: cp.jumlahKos,
      disyorkan: false,
      nota: `Musim seterusnya · ${plot.keluasanHa} ha · ${pusingan.sebab}`,
      jenis: 'pusingan',
    });
  }

  const sorted = [...scenarios].sort((a, b) => b.anggaranUntungRm - a.anggaranUntungRm);
  if (sorted[0]) sorted[0].disyorkan = true;

  const terbaik = sorted[0]
    ? `${sorted[0].blok} → ${sorted[0].tanaman} (untung anggaran RM${sorted[0].anggaranUntungRm.toLocaleString('ms-MY')} pada ${sorted[0].keluasanHa} ha)`
    : 'Kekalkan campuran semasa';

  return { scenarios: sorted, terbaik };
}

function buildWhatIfSingle(
  farmer: FarmProfile,
  recommendations: CropRecommendation[],
  currentCropId: string
): { scenarios: WhatIfScenario[]; terbaik: string } {
  const extra = recommendations
    .map((r) => r.cropId)
    .filter((id): id is string => !!id && id !== currentCropId)
    .slice(0, 2);

  const scenarios: WhatIfScenario[] = [currentCropId, ...extra].map((id) => {
    const crop = getCropById(id);
    const { harga, unit } = priceForCrop(id);
    const cp = buildCostProfitForHa(farmer.keluasan, id, harga, unit);
    const skor = RISIKO_SKOR_TANAMAN[id] ?? RISIKO_SKOR_TANAMAN.default;
    return {
      id,
      label: id === currentCropId ? 'Tanaman semasa' : `Musim seterusnya: ${crop?.nama ?? id}`,
      tanaman: crop?.nama ?? id,
      blok: 'Seluruh ladang',
      keluasanHa: farmer.keluasan,
      risiko: risikoFromSkor(skor),
      anggaranUntungRm: cp.untungBersih,
      anggaranHasilTan: cp.hasilTan,
      pendapatanRm: cp.pendapatan,
      kosRm: cp.jumlahKos,
      disyorkan: false,
      nota: id === currentCropId ? 'Musim semasa' : 'Anggaran jika tukar keseluruhan keluasan',
      jenis: id === currentCropId ? 'kekal' : 'pusingan',
    };
  });

  const sorted = [...scenarios].sort((a, b) => b.anggaranUntungRm - a.anggaranUntungRm);
  const pusinganOnly = sorted.filter((s) => s.jenis === 'pusingan');
  if (pusinganOnly[0]) pusinganOnly[0].disyorkan = true;
  else if (sorted[0]) sorted[0].disyorkan = true;

  const best = pusinganOnly[0] ?? sorted[0];
  const terbaik = best
    ? `${best.tanaman} (RM${best.anggaranUntungRm.toLocaleString('ms-MY')}, ${best.keluasanHa} ha)`
    : '—';

  return { scenarios: sorted, terbaik };
}

function buildHealth(
  farmer: FarmProfile,
  forecast: ForecastDay[],
  weather: CurrentWeather,
  alerts: Alert[],
  cropId: string,
  pasaran: MarketOpportunity
): HealthScore {
  const maxRain = Math.max(...forecast.map((f) => f.hujan), 0);
  const skorCuaca = Math.max(35, Math.min(98, 95 - maxRain * 0.45 - (weather.kelembapan > 85 ? 8 : 0)));
  const skorTanah = getGeotanihSoilScore(cropId, farmer.jenisTanah) ?? 75;
  const penyakitAlerts = alerts.filter((a) => a.kategori === 'penyakit' || a.kategori === 'perosak');
  const tinggi = penyakitAlerts.filter((a) => a.tahap === 'tinggi').length;
  const skorPenyakit = Math.max(40, 92 - tinggi * 18 - penyakitAlerts.filter((a) => a.tahap === 'sederhana').length * 8);
  const skorPengairan = Math.max(50, Math.min(95, 88 - (maxRain > 80 ? 15 : 0) + (maxRain < 30 ? 12 : 0)));
  const skorPasaran =
    pasaran.peluang === 'tinggi' ? 95 : pasaran.peluang === 'sederhana' ? 80 : 65;

  const faktor: HealthFactor[] = [
    { nama: 'Cuaca', skor: Math.round(skorCuaca), ikon: '🌦️' },
    { nama: 'Tanah', skor: Math.round(skorTanah), ikon: '🪴' },
    { nama: 'Penyakit', skor: Math.round(skorPenyakit), ikon: '🦠' },
    { nama: 'Pengairan', skor: Math.round(skorPengairan), ikon: '💧' },
    { nama: 'Pasaran', skor: Math.round(skorPasaran), ikon: '📊' },
  ];
  const keseluruhan = Math.round(faktor.reduce((s, f) => s + f.skor, 0) / faktor.length);
  const status: HealthScore['status'] =
    keseluruhan >= 85 ? 'baik' : keseluruhan >= 70 ? 'sederhana' : 'perhatian';
  const statusLabel =
    status === 'baik' ? 'Baik' : status === 'sederhana' ? 'Sederhana' : 'Perlu Perhatian';

  let cadangan =
    'Keadaan ladang stabil — teruskan pemantauan mingguan.';
  if (skorPenyakit < 75) {
    cadangan =
      'Keadaan tanaman stabil tetapi risiko penyakit meningkat dalam tempoh 7 hari akan datang.';
  } else if (skorCuaca < 70) {
    cadangan = 'Cuaca tidak menentu — utamakan saliran dan elak pembajaan semasa hujan lebat.';
  }

  return { faktor, keseluruhan, status, statusLabel, cadangan };
}

function buildRiskMatrix(
  alerts: Alert[],
  forecast: ForecastDay[],
  weather: CurrentWeather
): RiskMatrixRow[] {
  const maxRain = Math.max(...forecast.map((f) => f.hujan), 0);
  const banjirAlert = alerts.find((a) => a.kategori === 'banjir');
  const penyakitMax: AlertLevel = alerts.some(
    (a) => (a.kategori === 'penyakit' || a.kategori === 'perosak') && a.tahap === 'tinggi'
  )
    ? 'tinggi'
    : alerts.some((a) => a.kategori === 'penyakit' && a.tahap === 'sederhana')
      ? 'sederhana'
      : 'rendah';

  return [
    {
      risiko: 'Banjir',
      tahap: banjirAlert?.tahap ?? (maxRain >= 70 ? 'tinggi' : maxRain >= 55 ? 'sederhana' : 'rendah'),
      ikon: '🌊',
    },
    {
      risiko: 'Kemarau',
      tahap: maxRain < 25 && weather.hujan < 30 ? 'sederhana' : 'rendah',
      ikon: '☀️',
    },
    {
      risiko: 'Penyakit',
      tahap: penyakitMax,
      ikon: '🦠',
    },
    {
      risiko: 'Hujan lebat',
      tahap: maxRain >= 75 ? 'tinggi' : maxRain >= 55 ? 'sederhana' : 'rendah',
      ikon: '🌧️',
    },
    {
      risiko: 'Ribut / kilat',
      tahap: alerts.some((a) => a.kategori === 'cuaca' && a.tahap !== 'rendah') ? 'sederhana' : 'rendah',
      ikon: '⛈️',
    },
  ];
}

function buildMaturity(cropPlan: CropPlan, cropId: string): MaturityAnalysis {
  const crop = getCropById(cropId);
  const matang = crop?.fasa[crop?.fasa.length - 1]?.hariTamat ?? 90;
  const umur = Math.max(0, matang - cropPlan.hariKeTuaian);
  const peratus = cropPlan.peratusKemajuan;
  return {
    umurHari: umur,
    peratusMatang: peratus,
    fasa: cropPlan.fasaSemasa,
    hariKeTuaian: cropPlan.hariKeTuaian,
    tarikhTuai: addDaysLabel(cropPlan.hariKeTuaian),
    statusLabel: peratus >= 85 ? 'Hampir matang' : peratus >= 50 ? 'Pertengahan' : 'Belia',
  };
}

function buildMarketOpportunity(
  farmer: FarmProfile,
  supplyDemand: SupplyDemand[],
  pasaranHarga: { perubahanPct: number | null }
): MarketOpportunity {
  const key = farmer.tanamanUtama.split(' ')[0].toLowerCase();
  const sd =
    supplyDemand.find((s) => s.komoditi.toLowerCase().includes('cili') && key.includes('cili')) ??
    supplyDemand.find((s) => s.komoditi.toLowerCase().includes('sayur')) ??
    supplyDemand.find((s) => s.komoditi.toLowerCase().includes('padi')) ??
    supplyDemand[0];

  const permintaan = sd?.permintaan ?? 75;
  const bekalan = sd?.bekalan ?? 70;
  const diff = permintaan - bekalan;
  const peluang: MarketOpportunity['peluang'] =
    diff >= 15 ? 'tinggi' : diff >= 5 ? 'sederhana' : 'rendah';

  const hargaNota =
    pasaranHarga.perubahanPct != null && pasaranHarga.perubahanPct > 0
      ? ` Harga pasaran naik ~${pasaranHarga.perubahanPct}%.`
      : '';

  return {
    permintaanTrend: diff > 0 ? `Permintaan meningkat ~${Math.min(25, diff + 10)}% (indeks)` : 'Permintaan stabil',
    bekalanTrend: bekalan < permintaan ? `Bekalan menurun ~${Math.min(20, diff + 5)}%` : 'Bekalan mencukupi',
    peluang,
    peluangLabel: peluang === 'tinggi' ? 'TINGGI' : peluang === 'sederhana' ? 'SEDERHANA' : 'RENDAH',
    cadangan:
      (peluang === 'tinggi'
        ? `Disyorkan meneruskan penanaman ${farmer.tanamanUtama.split('(')[0].trim()} untuk musim seterusnya.`
        : 'Pantau harga mingguan; fleksibelkan masa jualan.') + hargaNota,
    permintaanPct: sd ? permintaan : null,
    bekalanPct: sd ? bekalan : null,
  };
}

const TAHAP_URUTAN: Record<AlertLevel, number> = { tinggi: 3, sederhana: 2, rendah: 1 };

function cropAlertTokens(cropId: string, cropName: string): string[] {
  const base = cropName.split('(')[0].trim().toLowerCase();
  const tokens = new Set<string>([base, cropId.toLowerCase(), ...cropId.split('-')]);
  if (cropId.includes('cili')) ['cili', 'antraknosa', 'thrips', 'grayak', 'ulat'].forEach((t) => tokens.add(t));
  if (cropId.includes('sawi')) tokens.add('sawi');
  if (cropId.includes('kangkung')) tokens.add('kangkung');
  if (cropId.includes('bayam')) tokens.add('bayam');
  if (cropId.includes('terung')) tokens.add('terung');
  if (cropId.includes('timun')) tokens.add('timun');
  return [...tokens].filter((t) => t.length > 2);
}

function alertMatchesCrop(alert: Alert, cropId: string, cropName: string): boolean {
  const text = `${alert.tajuk} ${alert.keterangan}`.toLowerCase();
  return cropAlertTokens(cropId, cropName).some((t) => text.includes(t));
}

function adjustTahapCuaca(tahap: AlertLevel, weather: CurrentWeather): AlertLevel {
  if (weather.kelembapan > 75 && tahap === 'sederhana') return 'tinggi';
  if (weather.kelembapan > 68 && tahap === 'rendah') return 'sederhana';
  return tahap;
}

function buildDiseaseAi(
  cropId: string,
  alerts: Alert[],
  weather: CurrentWeather
): DiseaseAiInsight {
  const crop = getCropById(cropId);
  const cropName = crop?.nama ?? cropId;
  const related = alerts.filter(
    (a) =>
      (a.kategori === 'penyakit' || a.kategori === 'perosak') &&
      alertMatchesCrop(a, cropId, cropName)
  );
  const alertPenyakit = related.find((a) => a.kategori === 'penyakit') ?? related[0];
  const top = crop?.penyakit[0];

  if (alertPenyakit) {
    const tahap = adjustTahapCuaca(alertPenyakit.tahap, weather);
    return {
      penyakit: alertPenyakit.tajuk.split('—')[0].trim(),
      ketepatanPct: tahap === 'tinggi' ? 91 : tahap === 'sederhana' ? 86 : 82,
      tahap,
      cadangan:
        alertPenyakit.tindakan ||
        (tahap === 'tinggi'
          ? 'Semburan kawalan dalam tempoh 48 jam; buang bahagian teruk.'
          : 'Pemeriksaan ladang dalam 24 jam; rujuk racun berdaftar DOA.'),
      simptom: alertPenyakit.keterangan.slice(0, 120),
      sumber: alertPenyakit.kategori === 'perosak' ? 'Amaran perosak + MET' : 'Repositori + cuaca MET',
    };
  }

  if (top) {
    let tahap = top.tahapRisiko;
    if (weather.kelembapan > 70 && top.pemicu?.includes('kelembapan')) {
      tahap = tahap === 'rendah' ? 'sederhana' : tahap;
    }
    if (weather.hujan > 60 && top.pemicu?.includes('hujan')) {
      tahap = tahap === 'rendah' ? 'sederhana' : tahap === 'sederhana' ? 'tinggi' : tahap;
    }
    tahap = adjustTahapCuaca(tahap, weather);
    return {
      penyakit: top.nama,
      ketepatanPct: top.plantVillageLabel ? 92 : 78,
      tahap,
      cadangan: top.tindakan,
      simptom: top.simptom,
      sumber: top.plantVillageLabel ? 'PlantVillage' : 'MARDI/DOA',
    };
  }

  return {
    penyakit: 'Tiada isu kritikal direkod',
    ketepatanPct: 85,
    tahap: 'rendah',
    cadangan: 'Teruskan pemantauan; muat naik gambar jika ada simptom.',
    simptom: '—',
    sumber: 'SMART AGRO',
  };
}

function buildDiseaseAiPerBlok(
  plots: LadangPlot[],
  alerts: Alert[],
  weather: CurrentWeather
): BlokPenyakitAi[] {
  return plots.map((plot) => {
    const insight = buildDiseaseAi(plot.cropId, alerts, weather);
    return {
      ...insight,
      blok: plot.blok,
      cropId: plot.cropId,
      namaTanaman: plot.nama,
    };
  });
}

function pickPenyakitRingkasan(perBlok: BlokPenyakitAi[]): DiseaseAiInsight {
  if (!perBlok.length) {
    return {
      penyakit: 'Tiada data blok',
      ketepatanPct: 0,
      tahap: 'rendah',
      cadangan: 'Tambah pecahan ladang di profil.',
      simptom: '—',
      sumber: 'SMART AGRO',
    };
  }
  const worst = [...perBlok].sort((a, b) => TAHAP_URUTAN[b.tahap] - TAHAP_URUTAN[a.tahap])[0];
  return {
    ...worst,
    penyakit: `${worst.penyakit} (${worst.blok})`,
    cadangan: `${worst.cadangan} · ${perBlok.filter((b) => b.tahap !== 'rendah').length} blok perlu tindakan.`,
  };
}

function buildRumusan(
  farmer: FarmProfile,
  cropPlan: CropPlan,
  cropId: string,
  kos: CostBreakdown,
  health: HealthScore,
  matriks: RiskMatrixRow[],
  pasaran: MarketOpportunity,
  jadualCadangan: string,
  hargaPerubahan: number | null
): AiRumusan {
  const crop = getCropById(cropId);
  const risikoDominan = matriks.find((m) => m.tahap === 'tinggi') ?? matriks.find((m) => m.tahap === 'sederhana');
  const cadangan: string[] = [];

  if (health.keseluruhan >= 70) cadangan.push('Teruskan penanaman semasa dengan pemantauan berkala.');
  else cadangan.push('Pertimbangkan penyesuaian tanaman atau kurangkan risiko cuaca.');

  if (matriks.find((m) => m.risiko === 'Penyakit' && m.tahap !== 'rendah')) {
    cadangan.push('Lakukan kawalan penyakit dalam 7 hari (pemeriksaan + rawatan).');
  }
  if (jadualCadangan.includes('hujan') || jadualCadangan.includes('2 hari')) {
    cadangan.push('Elakkan pembajaan semasa hujan lebat; ikut jadual cuaca.');
  }
  cadangan.push(`Jadual tuaian dalam ${cropPlan.hariKeTuaian} hari (${addDaysLabel(cropPlan.hariKeTuaian)}).`);
  if (kos.untungBersih > 15000) cadangan.push('Potensi keuntungan tinggi — rancang pemasaran awal.');
  if (pasaran.peluang === 'tinggi') cadangan.push('Peluang pasaran baik — kekalkan komoditi untuk musim seterusnya.');

  return {
    tanaman: crop?.nama ?? farmer.tanamanUtama,
    fasa: cropPlan.fasaSemasa,
    risiko: risikoDominan ? `${risikoDominan.risiko}: ${labelRisiko(risikoDominan.tahap)}` : labelRisiko('rendah'),
    hargaPasaran:
      hargaPerubahan != null
        ? hargaPerubahan > 0
          ? 'Meningkat'
          : hargaPerubahan < 0
            ? 'Menurun'
            : 'Stabil'
        : 'Stabil',
    anggaranHasilTan: kos.hasilTan,
    anggaranPendapatanRm: kos.pendapatan,
    anggaranUntungRm: kos.untungBersih,
    cadangan: cadangan.slice(0, 5),
  };
}

function buildRumusanCampuran(
  farmer: FarmProfile,
  ladang: LadangKewangan,
  bloks: BlokAnalisis[],
  matriks: RiskMatrixRow[],
  peluangPasaran: MarketOpportunity,
  jadualCadangan: string
): AiRumusan {
  const risikoDominan = matriks.find((m) => m.tahap === 'tinggi') ?? matriks.find((m) => m.tahap === 'sederhana');
  const cadangan: string[] = [
    `Ladang campuran ${bloks.length} blok (${ladang.keluasanHa} ha) — pantau setiap tanaman di Kalendar.`,
  ];

  if (matriks.find((m) => m.risiko === 'Penyakit' && m.tahap !== 'rendah')) {
    cadangan.push('Utamakan kawalan penyakit cili (Blok A) dalam 7 hari.');
  }
  if (jadualCadangan.includes('hujan')) {
    cadangan.push('Elakkan baja semasa hujan lebat; ikut jadual per blok.');
  }
  const tuaianTerdekat = bloks.reduce((a, b) => (a.hariKeTuaian < b.hariKeTuaian ? a : b));
  cadangan.push(`${tuaianTerdekat.blok} (${tuaianTerdekat.nama}) tuaian ~${tuaianTerdekat.hariKeTuaian} hari lagi.`);
  if (ladang.untungBersih > 0) {
    cadangan.push(
      `Anggaran untung ladang musim semasa RM${ladang.untungBersih.toLocaleString('ms-MY')} (jumlah ${bloks.length} blok).`
    );
  }
  if (peluangPasaran.peluang === 'tinggi') {
    cadangan.push('Peluang pasaran cili/sayur baik — rancang pusingan blok selepas tuaian.');
  }

  const fokusBlok = bloks.find((b) => b.cropId.includes('cili')) ?? bloks[0];

  return {
    tanaman: `${bloks.length} jenis sayur (${farmer.keluasan} ha)`,
    fasa: `Pelbagai · fokus ${fokusBlok?.nama ?? '—'} (${fokusBlok?.fasaSemasa ?? '—'})`,
    risiko: risikoDominan ? `${risikoDominan.risiko}: ${labelRisiko(risikoDominan.tahap)}` : labelRisiko('rendah'),
    hargaPasaran: peluangPasaran.peluangLabel === 'TINGGI' ? 'Meningkat (cili/sayur)' : 'Stabil',
    anggaranHasilTan: ladang.jumlahHasilTan,
    anggaranPendapatanRm: ladang.jumlahPendapatan,
    anggaranUntungRm: ladang.untungBersih,
    cadangan: cadangan.slice(0, 5),
  };
}

function buildTanamanCampuran(
  farmer: FarmProfile,
  forecast: ForecastDay[],
  bloks: BlokAnalisis[],
  recommendations: CropRecommendation[]
) {
  const maxHujan = Math.max(...forecast.map((f) => f.hujan), 0);
  const naratif = `Ladang campuran ${farmer.lokasi}: ${bloks.length} blok (${farmer.keluasan} ha). Hujan maks ${maxHujan}% (7 hari). Analisis kewangan dikira per blok, bukan satu tanaman untuk seluruh ladang.`;
  const cadanganUtama = `Musim semasa: ${bloks.map((b) => `${b.blok} ${b.nama}`).join(' · ')}.`;
  return { naratif, cadanganUtama, alternatif: recommendations };
}

function buildLegacyTanaman(
  farmer: FarmProfile,
  forecast: ForecastDay[],
  recommendations: CropRecommendation[]
) {
  const maxHujan = Math.max(...forecast.map((f) => f.hujan), 0);
  const top = recommendations[0];
  let naratif = `Lokasi ${farmer.lokasi}, ${farmer.negeri}. Hujan maks ${maxHujan}% (7 hari). `;
  let cadanganUtama = top
    ? `Pertimbangkan ${top.nama} (skor ${top.kesesuaian}%).`
    : 'Kemas kini profil tanaman.';
  return { naratif, cadanganUtama, alternatif: recommendations.slice(0, 5) };
}

function buildLegacyJadual(cropPlan: CropPlan, forecast: ForecastDay[]) {
  const next = cropPlan.tugasan.find((t) => !t.selesai);
  const heavy = forecast.slice(0, 3).some((f) => f.hujan >= 60);
  let cadangan = next
    ? `Seterusnya: ${next.aktiviti} (${next.tarikh}).`
    : 'Tiada tugasan tertunggak.';
  if (heavy && next?.jenis === 'baja') {
    cadangan = `「${next.aktiviti}」 disyorkan dalam 2 hari sebelum hujan lebat.`;
  }
  return { cadanganTindakan: cadangan, tugasanSegera: next ? `${next.aktiviti} · ${next.tarikh}` : null };
}

export function buildFarmAnalysis(input: {
  farmer: FarmProfile;
  cropPlan: CropPlan;
  forecast: ForecastDay[];
  currentWeather: CurrentWeather;
  alerts: Alert[];
  cropRecommendations: CropRecommendation[];
  marketPrices: MarketPrice[];
  supplyDemand: SupplyDemand[];
  ladangPlots?: LadangPlot[];
}): FarmAnalysisReport {
  const plots = input.ladangPlots ?? [];
  const ladangCampuran = plots.length >= 2;
  const cropId = input.farmer.cropId ?? resolveCropIdFromLabel(input.farmer.tanamanUtama);
  const fama = getFamaPriceForCrop(cropId);
  const harga = fama?.hargaRm ?? 5;
  const unit = fama?.unit ?? 'kg';

  const peluangPasaran = buildMarketOpportunity(
    input.farmer,
    input.supplyDemand,
    { perubahanPct: fama?.perubahanPct ?? null }
  );
  const kesihatan = buildHealth(
    input.farmer,
    input.forecast,
    input.currentWeather,
    input.alerts,
    cropId,
    peluangPasaran
  );
  const matriksRisiko = buildRiskMatrix(input.alerts, input.forecast, input.currentWeather);
  const trendMusim = getNotaMusim(new Date().getMonth());
  const jadual = buildLegacyJadual(input.cropPlan, input.forecast);
  const penyakitPerBlok = ladangCampuran
    ? buildDiseaseAiPerBlok(plots, input.alerts, input.currentWeather)
    : [];
  const penyakitAi = ladangCampuran
    ? pickPenyakitRingkasan(penyakitPerBlok)
    : buildDiseaseAi(cropId, input.alerts, input.currentWeather);

  let blokAnalisis: BlokAnalisis[] = [];
  let ladangKewangan: LadangKewangan;
  let kosKeuntungan: CostBreakdown;
  let whatIf: WhatIfScenario[];
  let whatIfTerbaik: string;
  let rumusan: AiRumusan;
  let tanaman: FarmAnalysisReport['tanaman'];
  let kematangan: MaturityAnalysis;

  if (ladangCampuran) {
    blokAnalisis = plots.map(buildBlokAnalisis);
    ladangKewangan = aggregateLadangKewangan(blokAnalisis, input.farmer.keluasan);
    kosKeuntungan = ladangKewanganToCostBreakdown(ladangKewangan, blokAnalisis);
    const wi = buildWhatIfBlok(plots);
    whatIf = wi.scenarios;
    whatIfTerbaik = wi.terbaik;
    rumusan = buildRumusanCampuran(
      input.farmer,
      ladangKewangan,
      blokAnalisis,
      matriksRisiko,
      peluangPasaran,
      jadual.cadanganTindakan
    );
    tanaman = buildTanamanCampuran(input.farmer, input.forecast, blokAnalisis, input.cropRecommendations);
    const fokus = blokAnalisis.find((b) => b.cropId === cropId) ?? blokAnalisis[0];
    kematangan = fokus.kematangan;
  } else {
    blokAnalisis = [];
    kosKeuntungan = buildCostProfit(input.farmer, cropId, harga, unit);
    ladangKewangan = {
      jumlahPendapatan: kosKeuntungan.pendapatan,
      jumlahKos: kosKeuntungan.jumlahKos,
      untungBersih: kosKeuntungan.untungBersih,
      jumlahHasilTan: kosKeuntungan.hasilTan,
      keluasanHa: input.farmer.keluasan,
      nota: 'Satu tanaman · anggaran FAMA & kos rujukan/ha.',
    };
    const wi = buildWhatIfSingle(input.farmer, input.cropRecommendations, cropId);
    whatIf = wi.scenarios;
    whatIfTerbaik = wi.terbaik;
    kematangan = buildMaturity(input.cropPlan, cropId);
    rumusan = buildRumusan(
      input.farmer,
      input.cropPlan,
      cropId,
      kosKeuntungan,
      kesihatan,
      matriksRisiko,
      peluangPasaran,
      jadual.cadanganTindakan,
      fama?.perubahanPct ?? null
    );
    tanaman = buildLegacyTanaman(input.farmer, input.forecast, input.cropRecommendations);
  }

  return {
    dikemaskini: new Date().toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' }),
    ladangCampuran,
    blokAnalisis,
    ladangKewangan,
    kesihatan,
    whatIf,
    whatIfTerbaik,
    kosKeuntungan,
    matriksRisiko,
    trendMusim,
    perbandinganKawasan: PERBANDINGAN_KAWASAN_SELANGOR,
    penyakitAi,
    penyakitPerBlok,
    kematangan,
    peluangPasaran,
    rumusan,
    tanaman,
    jadual,
  };
}
