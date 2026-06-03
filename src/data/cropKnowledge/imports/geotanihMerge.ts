import type { CropKnowledge } from '../types';
import geoData from './geotanihByCrop.json';

interface SoilMatch {
  jenis: string;
  skor: number;
  kod?: string;
}

interface GeoEntry {
  tanahSesuai: SoilMatch[];
  tanahKurangSesuai: SoilMatch[];
  notaGeoTanih: string;
  sumber: string;
}

const imported = geoData as {
  meta: { sumber: string; url: string; dikemaskini: string };
  soilClasses: Record<string, { kod: string; skorAsas: number }>;
  byCrop: Record<string, GeoEntry>;
};

export function getGeotanihMeta() {
  return imported.meta;
}

export function getGeotanihEntry(cropId: string): GeoEntry | undefined {
  return imported.byCrop[cropId];
}

function normalizeSoil(s: string): string {
  return s.toLowerCase().trim();
}

/** Skor 35–98 untuk padanan jenis tanah profil petani */
export function getGeotanihSoilScore(cropId: string, jenisTanah: string): number | null {
  const geo = imported.byCrop[cropId];
  if (!geo) return null;

  const t = normalizeSoil(jenisTanah);
  const hit = geo.tanahSesuai.find(
    (s) => t.includes(normalizeSoil(s.jenis).slice(0, 8)) || normalizeSoil(s.jenis).includes(t.slice(0, 6))
  );
  if (hit) return Math.min(98, hit.skor + 8);

  const bad = geo.tanahKurangSesuai.find(
    (s) => t.includes(normalizeSoil(s.jenis).slice(0, 8)) || normalizeSoil(s.jenis).includes(t.slice(0, 6))
  );
  if (bad) return Math.max(35, bad.skor);

  return null;
}

export function mergeGeotanihSoil(crop: CropKnowledge): CropKnowledge {
  const geo = imported.byCrop[crop.id];
  if (!geo) return crop;

  return {
    ...crop,
    tanahSesuai: geo.tanahSesuai.map((s) => s.jenis),
    tanahKurangSesuai: geo.tanahKurangSesuai.map((s) => s.jenis),
    catatan: [crop.catatan, geo.notaGeoTanih].filter(Boolean).join(' · '),
    sumber: [
      ...crop.sumber.filter((s) => s.key !== 'geotanih'),
      {
        key: 'geotanih',
        label: imported.meta.sumber,
        digunakanUntuk: `${geo.tanahSesuai.length} tanah sesuai`,
      },
    ],
  };
}
