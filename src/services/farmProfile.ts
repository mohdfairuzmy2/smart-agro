import type { Farmer } from '../data/types';
import { buildDemoFarmer, buildDemoLadangPlots, seedDemoProfileIfEmpty } from '../data/demoScenario';
import { resolveCropIdFromLabel } from '../data/cropKnowledge/repository';

seedDemoProfileIfEmpty();

const STORAGE_KEY = 'smart-agro-farm-profile';

export interface FarmProfile extends Farmer {
  cropId?: string;
  lat?: number;
  lon?: number;
  kemaskini?: string;
  /** Rujukan pendaftaran / ladang (data demonstrasi realistik) */
  noPetani?: string;
  noLot?: string;
  daerah?: string;
  parit?: string;
  telefon?: string;
  sistemPertanian?: string;
  tarikhTanamSemasa?: string;
  /** Blok tanaman berbilang (contoh ladang sayur campuran) */
  ladangPlots?: LadangPlot[];
}

export interface LadangPlot {
  cropId: string;
  nama: string;
  ikon: string;
  keluasanHa: number;
  blok: string;
  fasaSemasa: string;
  peratusKemajuan: number;
  hariKeTuaian: number;
  catatan: string;
}

export function loadFarmProfile(): FarmProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDemoFarmer();
    const parsed = JSON.parse(raw) as FarmProfile;
    return {
      ...buildDemoFarmer(),
      ...parsed,
      cropId: parsed.cropId ?? resolveCropIdFromLabel(parsed.tanamanUtama),
      ladangPlots: parsed.ladangPlots?.length ? parsed.ladangPlots : buildDemoLadangPlots(),
    };
  } catch {
    return buildDemoFarmer();
  }
}

export function saveFarmProfile(profile: FarmProfile): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...profile, kemaskini: new Date().toISOString() })
  );
}

export function detectLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS tidak disokong'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  });
}

/** Anggaran negeri dari koordinat (ringkas) */
export function guessNegeri(lat: number, lon: number): string {
  if (lat >= 5.9) return 'Perlis';
  if (lat >= 5.5 && lon < 101) return 'Kedah';
  if (lat >= 5.3 && lon < 100.5) return 'Pulau Pinang';
  if (lat >= 4.5 && lon < 101.2) return 'Perak';
  if (lat >= 3.5 && lon >= 103.5) return 'Terengganu';
  if (lat >= 3.5 && lon >= 102.5) return 'Pahang';
  if (lat >= 2.5 && lon >= 103) return 'Johor';
  if (lat >= 2.5 && lon >= 101.8 && lat < 3.2) return 'Negeri Sembilan';
  if (lat >= 2.5 && lon >= 101.5 && lat < 3.5) return 'Selangor';
  if (lat >= 3.0 && lon >= 101.6 && lat < 3.3) return 'Wilayah Persekutuan Kuala Lumpur';
  return 'Selangor';
}
