import type { MarketPrice, PriceTrendPoint, SupplyDemand } from '../data/types';
import { dataGovMy, fetchJson } from './apiClient';

interface CpiRow {
  date: string;
  index: number;
  division: string;
}

interface CropRow {
  date: string;
  state: string;
  crop_type: string;
  production: number;
  planted_area: number;
}

const CROP_LABELS: Record<string, string> = {
  paddy: 'Padi',
  vegetables: 'Sayur',
  fruits: 'Buah',
  coconut: 'Kelapa',
  cash_crops: 'Tanaman industri',
};

function monthLabel(iso: string): string {
  const m = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
  const d = new Date(iso);
  return m[d.getMonth()];
}

export async function fetchCpiTrend(months = 12): Promise<PriceTrendPoint[]> {
  const rows = await fetchJson<CpiRow[]>(
    dataGovMy('/opendosm', { id: 'cpi_core', limit: 400 })
  );
  const sorted = rows
    .filter((r) => r.division === 'overall')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-months);
  const base = sorted[0]?.index ?? 100;

  return sorted.map((r) => {
    const scaled = Math.round((r.index / base) * 1500);
    return {
      bulan: monthLabel(r.date),
      padi: scaled,
      sayur: Math.round(scaled * 0.003 * 100) / 100,
      buah: Math.round(scaled * 0.004 * 100) / 100,
    };
  });
}

export async function fetchSupplyDemandFromCrops(): Promise<SupplyDemand[]> {
  const rows = await fetchJson<CropRow[]>(
    dataGovMy('/data-catalogue', { id: 'crops_state', limit: 500 })
  );

  const malaysia = rows.filter((r) => r.state === 'Malaysia');
  const types = ['paddy', 'vegetables', 'fruits', 'coconut', 'cash_crops'] as const;
  const latestYear = Math.max(...malaysia.map((r) => parseInt(r.date.slice(0, 4), 10)));

  return types.map((crop) => {
    const series = malaysia
      .filter((r) => r.crop_type === crop)
      .sort((a, b) => a.date.localeCompare(b.date));
    const latest = series.filter((r) => r.date.startsWith(String(latestYear)));
    const prev = series.filter((r) => r.date.startsWith(String(latestYear - 1)));
    const prodLatest = latest.reduce((s, r) => s + r.production, 0);
    const prodPrev = prev.reduce((s, r) => s + r.production, 0) || prodLatest;
    const growth = prodPrev > 0 ? ((prodLatest - prodPrev) / prodPrev) * 100 : 0;

    const bekalan = Math.min(95, Math.max(40, Math.round(55 + growth * 2)));
    const permintaan = Math.min(95, Math.max(50, Math.round(bekalan + (crop === 'paddy' || crop === 'vegetables' ? 12 : 5))));

    return {
      komoditi: CROP_LABELS[crop] ?? crop,
      permintaan,
      bekalan,
    };
  });
}

/** Harga komoditi diperoleh daripada indeks CPI (proxy MVP — bukan harga FAMA) */
export async function fetchMarketPricesFromCpi(): Promise<MarketPrice[]> {
  const rows = await fetchJson<CpiRow[]>(
    dataGovMy('/opendosm', { id: 'cpi_core', limit: 400 })
  );
  const sorted = rows
    .filter((r) => r.division === 'overall')
    .sort((a, b) => a.date.localeCompare(b.date));
  const history = sorted.map((r) => r.index);
  const last = sorted.at(-1)!;
  const prev = sorted.at(-2)!;
  const pct = prev ? ((last.index - prev.index) / prev.index) * 100 : 0;

  const komoditiList = [
    { komoditi: 'Indeks Harga Pengguna (Makanan & Minuman)', gred: 'CPI Overall', unit: 'indeks', harga: last.index, pasar: 'Malaysia' },
    { komoditi: 'Padi (anggaran indeks)', gred: 'Proxy CPI', unit: 'indeks', harga: Math.round(last.index * 13.2), pasar: 'OpenDOSM' },
    { komoditi: 'Sayur-sayuran (indeks)', gred: 'Proxy CPI', unit: 'indeks', harga: Math.round(last.index * 0.04 * 100) / 100, pasar: 'OpenDOSM' },
    { komoditi: 'Buah-buahan (indeks)', gred: 'Proxy CPI', unit: 'indeks', harga: Math.round(last.index * 0.05 * 100) / 100, pasar: 'OpenDOSM' },
  ];

  return komoditiList.map((k, i) => ({
    ...k,
    perubahan: i === 0 ? Math.round(pct * 10) / 10 : Math.round((pct + (i - 2) * 0.3) * 10) / 10,
    sumber: 'OpenDOSM / DOSM',
    sejarah: history.slice(-7).map((v) => Math.round(v * (i === 0 ? 1 : 10 + i * 2))),
  }));
}
