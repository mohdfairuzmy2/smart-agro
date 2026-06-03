import type { FarmProfile } from '../services/farmProfile';
import { DEMO_FARM_COORDS } from './demoScenario';

export type SalesVenueJenis = 'pasar' | 'pasar-tani' | 'pasaraya';

export interface SalesVenue {
  id: string;
  nama: string;
  jenis: SalesVenueJenis;
  alamat: string;
  daerah: string;
  lat: number;
  lon: number;
  jarakKm: number;
  waktuOperasi: string;
  /** Komoditi yang biasa diterima / laris */
  komoditiSesuai: string[];
  nota: string;
  telefon?: string;
  /** Petunjuk harga jualan runcit (bukan borong FAMA) */
  hargaPetunjuk?: string;
}

export const VENUE_JENIS_LABEL: Record<SalesVenueJenis, string> = {
  pasar: 'Pasar / Pasar malam',
  'pasar-tani': 'Tapak Pasar Tani',
  pasaraya: 'Pasaraya / Runcit',
};

export const VENUE_JENIS_IKON: Record<SalesVenueJenis, string> = {
  pasar: '🏪',
  'pasar-tani': '🧺',
  pasaraya: '🛒',
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const KAJANG_VENUES_RAW: Omit<SalesVenue, 'jarakKm'>[] = [
  {
    id: 'pasar-kajang',
    nama: 'Pasar Kajang (Pasar Malam)',
    jenis: 'pasar',
    alamat: 'Jalan Besar, 43000 Kajang, Selangor',
    daerah: 'Hulu Langat',
    lat: 2.9938,
    lon: 101.7902,
    waktuOperasi: 'Petang–malam (≈ 6:00–23:00), setiap hari',
    komoditiSesuai: ['Cili', 'Sawi', 'Kangkung', 'Bayam', 'Terung', 'Timun'],
    nota: 'Pelanggan runcit tinggi; sesuai sayur segar & cili. Bawa timbangan & beg sendiri.',
    hargaPetunjuk: 'Cili RM10–14/kg · sayur daun RM3–6/kg',
  },
  {
    id: 'pasar-tani-kajang',
    nama: 'Pasar Tani Kajang',
    jenis: 'pasar-tani',
    alamat: 'Lot tapak berhampiran Pusat Bandar Kajang',
    daerah: 'Hulu Langat',
    lat: 2.9915,
    lon: 101.7925,
    waktuOperasi: 'Sabtu & Ahad, 7:00–12:00 pagi',
    komoditiSesuai: ['Cili', 'Sawi', 'Kangkung', 'Bayam', 'Terung', 'Timun'],
    nota: 'FAMA/MyHargaTani rujukan harga borong — di sini harga runcit biasanya +15–25%.',
    telefon: '03-8736 xxxx (Majlis Perbandaran Kajang)',
    hargaPetunjuk: 'Potong harga borong FAMA +20% sebagai sasaran jualan',
  },
  {
    id: 'pasar-tani-bangi',
    nama: 'Pasar Tani Bangi',
    jenis: 'pasar-tani',
    alamat: 'Persiaran Bandar Baru Bangi, 43650 Bangi',
    daerah: 'Hulu Langat',
    lat: 2.9678,
    lon: 101.7721,
    waktuOperasi: 'Sabtu & Ahad, 7:00–13:00',
    komoditiSesuai: ['Cili', 'Sawi', 'Bayam', 'Timun'],
    nota: 'Pelanggan pejabat & keluarga; stok sayur daun laris pagi.',
    hargaPetunjuk: 'Sawi & bayam RM4–7/kg',
  },
  {
    id: 'pasar-tani-seri-kembangan',
    nama: 'Pasar Tani Seri Kembangan',
    jenis: 'pasar-tani',
    alamat: 'Jalan SK 6/1, Seri Kembangan',
    daerah: 'Petaling',
    lat: 3.0212,
    lon: 101.7078,
    waktuOperasi: 'Sabtu & Ahad, 6:30–12:30',
    komoditiSesuai: ['Cili', 'Terung', 'Timun', 'Kangkung'],
    nota: 'Jarak sedikit jauh; sesuai jika hasil cili & terung berlebihan.',
    hargaPetunjuk: 'Terung RM4–8/kg · timun RM3–5/kg',
  },
  {
    id: 'pasar-borong-selayang',
    nama: 'Pasar Borong Selayang (Pasar Borong Selangor)',
    jenis: 'pasar',
    alamat: 'Jalan 2/2, Selayang Baru, Batu Caves',
    daerah: 'Gombak',
    lat: 3.2381,
    lon: 101.6554,
    waktuOperasi: 'Awal pagi 4:00–10:00 (borong)',
    komoditiSesuai: ['Cili', 'Sawi', 'Terung', 'Timun'],
    nota: 'Harga borong — volume besar. Sesuai jual pukal selepas tuaian, bukan runcit kecil.',
    hargaPetunjuk: 'Selaras FAMA Pasar Borong Selangor',
  },
  {
    id: 'aeon-bangi',
    nama: 'AEON Big Bandar Baru Bangi',
    jenis: 'pasaraya',
    alamat: 'No. 1, Jalan BB Bangi, 43650 Bangi',
    daerah: 'Hulu Langat',
    lat: 2.9625,
    lon: 101.7789,
    waktuOperasi: '10:00–22:00 setiap hari',
    komoditiSesuai: ['Sawi', 'Bayam', 'Timun', 'Terung'],
    nota: 'Perlu rundingan pembekal / kontrak sayur tempatan; gred & pembungkusan diperhatikan.',
    telefon: '03-8925 2929',
    hargaPetunjuk: 'Harga kontrak — biasanya di bawah pasar tani 10–20%',
  },
  {
    id: 'tesco-kajang',
    nama: "Lotus's Kajang (dulu Tesco Extra)",
    jenis: 'pasaraya',
    alamat: 'Jalan Semenyih, 43000 Kajang',
    daerah: 'Hulu Langat',
    lat: 2.9789,
    lon: 101.8032,
    waktuOperasi: '8:00–23:00',
    komoditiSesuai: ['Cili', 'Sawi', 'Timun'],
    nota: 'Pintu masuk pembekal sayur — hubungi jabatan perishables HQ.',
    hargaPetunjuk: 'Rujuk senarai pembekal HQ Selangor',
  },
  {
    id: 'econsave-kajang',
    nama: 'Econsave Kajang Prima',
    jenis: 'pasaraya',
    alamat: 'Jalan Prima Saujana 1, Kajang Prima',
    daerah: 'Hulu Langat',
    lat: 3.0052,
    lon: 101.8156,
    waktuOperasi: '9:00–22:00',
    komoditiSesuai: ['Sawi', 'Kangkung', 'Bayam'],
    nota: 'Runcit tempatan — volume sederhana, bayaran tunai/QR pantas.',
    hargaPetunjuk: 'Sayur daun RM3–6/kg',
  },
  {
    id: 'nsk-kajang',
    nama: 'NSK Trade City Kajang',
    jenis: 'pasaraya',
    alamat: 'Off Jalan Semenyih, Kajang',
    daerah: 'Hulu Langat',
    lat: 2.9812,
    lon: 101.8265,
    waktuOperasi: '9:00–22:00',
    komoditiSesuai: ['Cili', 'Terung', 'Timun', 'Sawi'],
    nota: 'Campuran borong-runcit; sesuai jual kuantiti sederhana dengan harga kompetitif.',
    hargaPetunjuk: 'Antara pasar tani & borong',
  },
];

const GENERIC_SELANGOR: Omit<SalesVenue, 'jarakKm'>[] = [
  {
    id: 'pasar-tani-utama',
    nama: 'Pasar Tani berhampiran anda',
    jenis: 'pasar-tani',
    alamat: 'Carian tapak FAMA / Majlis tempatan',
    daerah: 'Selangor',
    lat: 3.0733,
    lon: 101.5185,
    waktuOperasi: 'Biasanya hujung minggu pagi',
    komoditiSesuai: ['Sayur', 'Cili', 'Buah'],
    nota: 'Kemas kini lokasi GPS ladang untuk senarai tepat.',
  },
];

function isKajangArea(farmer: FarmProfile): boolean {
  const t = `${farmer.lokasi} ${farmer.daerah} ${farmer.negeri}`.toLowerCase();
  return t.includes('kajang') || t.includes('hulu langat') || t.includes('bangi') || t.includes('semenyih');
}

function withDistance(
  venues: Omit<SalesVenue, 'jarakKm'>[],
  originLat: number,
  originLon: number
): SalesVenue[] {
  return venues
    .map((v) => ({
      ...v,
      jarakKm: haversineKm(originLat, originLon, v.lat, v.lon),
    }))
    .sort((a, b) => a.jarakKm - b.jarakKm);
}

/** Tapak jualan berhampiran ladang petani */
export function getNearbySalesVenues(farmer: FarmProfile): SalesVenue[] {
  const lat = farmer.lat ?? DEMO_FARM_COORDS.lat;
  const lon = farmer.lon ?? DEMO_FARM_COORDS.lon;
  const raw = isKajangArea(farmer) ? KAJANG_VENUES_RAW : GENERIC_SELANGOR;
  return withDistance(raw, lat, lon);
}

export function mapsSearchUrl(venue: SalesVenue): string {
  const q = encodeURIComponent(`${venue.nama}, ${venue.alamat}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
