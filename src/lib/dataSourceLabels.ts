import type { Alert } from '../data/types';

type WeatherMeta = 'live' | 'mock' | 'demo';
type MarketMeta = 'live' | 'mock' | 'fama' | 'hybrid' | 'demo';
type AlertsMeta = 'live' | 'hybrid' | 'mock' | 'demo';

/** Jenis sumber data — dipaparkan pada setiap bahagian */
export type DataSourceKind = 'live' | 'rujukan' | 'demo' | 'campuran';

export interface DataSourceMeta {
  label: string;
  /** Teks pendek pada badge */
  short: string;
  title: string;
  className: string;
}

export const DATA_SOURCE: Record<DataSourceKind, DataSourceMeta> = {
  live: {
    label: 'Data Live',
    short: 'Live',
    title: 'Dimuat dari API/internet semasa anda buka app (contoh METMalaysia, OpenDOSM)',
    className: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  },
  rujukan: {
    label: 'Data Rujukan',
    short: 'Rujukan',
    title: 'Berasaskan sumber rasmi yang diimport/dikurasi — bukan kemaskini automatik setiap jam',
    className: 'bg-sky-100 text-sky-900 ring-sky-300',
  },
  demo: {
    label: 'Data Demo',
    short: 'Demo',
    title: 'Contoh/simulasi untuk demonstrasi — jangan guna sebagai keputusan muktamad',
    className: 'bg-amber-100 text-amber-950 ring-amber-300',
  },
  campuran: {
    label: 'Data Campuran',
    short: 'Campuran',
    title: 'Gabungan data live + demo/rujukan — semak bar status di atas',
    className: 'bg-violet-100 text-violet-900 ring-violet-300',
  },
};

export function weatherSourceKind(weather: WeatherMeta): DataSourceKind {
  return weather === 'live' ? 'live' : 'demo';
}

export function marketPricesSourceKind(market: MarketMeta): DataSourceKind {
  if (market === 'fama') return 'rujukan';
  if (market === 'hybrid' || market === 'live') return 'campuran';
  return 'demo';
}

export function alertsListSourceKind(alerts: AlertsMeta): DataSourceKind {
  if (alerts === 'live') return 'live';
  if (alerts === 'hybrid') return 'campuran';
  return 'demo';
}

export function getAlertSourceKind(alert: Alert): DataSourceKind {
  if (alert.id.startsWith('demo-')) return 'demo';
  if (alert.id.startsWith('repo-') || alert.masa === 'Crop Knowledge Repository') return 'rujukan';
  return 'live';
}
