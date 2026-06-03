import type { CropKnowledge, CropPhaseDef, CropTaskTemplate } from '../types';
import upmData from './upmSayurByCrop.json';

interface UpmEntry {
  namaMs: string;
  kumpulan: string;
  tempohMatangHari: { min: number; max: number };
  hariSemaianSebelumLadang?: number;
  nota?: string;
  petikanUpm?: string | null;
  sumber: string;
}

const imported = upmData as {
  meta: {
    sumber: string;
    url: string;
    dikemaskini: string;
    jumlahSayurDalamRepo: number;
  };
  byCrop: Record<string, UpmEntry>;
};

export function getUpmSayurMeta() {
  return imported.meta;
}

export function getUpmEntry(cropId: string): UpmEntry | undefined {
  return imported.byCrop[cropId];
}

/** Skala semula fasa & tugasan ikut tempoh matang UPM */
function rescalePhases(fasa: CropPhaseDef[], matangMax: number): CropPhaseDef[] {
  if (!fasa.length) return fasa;
  const oldMax = fasa[fasa.length - 1].hariTamat || matangMax;
  const scale = matangMax / oldMax;
  return fasa.map((f) => ({
    nama: f.nama,
    hariMula: Math.round(f.hariMula * scale),
    hariTamat: Math.round(f.hariTamat * scale),
  }));
}

function rescaleTasks(tugasan: CropTaskTemplate[], matangMax: number): CropTaskTemplate[] {
  const harvest = tugasan.find((t) => t.jenis === 'tuaian');
  const rest = tugasan.filter((t) => t.jenis !== 'tuaian');
  const oldHarvest = harvest?.hariRelatif ?? matangMax;
  const scale = matangMax / (oldHarvest || matangMax);
  const scaled = rest.map((t) => ({
    ...t,
    hariRelatif: Math.max(0, Math.round(t.hariRelatif * scale)),
    sumber: 'upm_sayur' as const,
  }));
  if (harvest) {
    scaled.push({
      ...harvest,
      hariRelatif: matangMax,
      catatan: `Tempoh matang UPM: ${matangMax} hari`,
      sumber: 'upm_sayur',
    });
  }
  return scaled.sort((a, b) => a.hariRelatif - b.hariRelatif);
}

/** Guna tempoh matang UPM untuk semua sayur dalam repository */
export function mergeUpmSayurMaturity(crop: CropKnowledge): CropKnowledge {
  if (crop.kategori !== 'sayur' && crop.id !== 'serai') return crop;

  const upm = imported.byCrop[crop.id];
  if (!upm) return crop;

  const matangMax = upm.tempohMatangHari.max;
  const matangMin = upm.tempohMatangHari.min;
  const fasa = rescalePhases(crop.fasa, matangMax);
  const tugasan = rescaleTasks(crop.tugasan, matangMax);

  const semaiNote =
    upm.hariSemaianSebelumLadang && upm.hariSemaianSebelumLadang > 0
      ? ` · semai ${upm.hariSemaianSebelumLadang} hari sebelum ladang`
      : '';

  return {
    ...crop,
    tempohMatangHari: { min: matangMin, max: matangMax },
    musimTanam: crop.musimTanam.includes('UPM') ? crop.musimTanam : `${crop.musimTanam} (rujuk UPM)`,
    catatan: [upm.nota, upm.petikanUpm, crop.catatan].filter(Boolean).join(' · '),
    fasa,
    tugasan,
    sumber: [
      ...crop.sumber.filter((s) => s.key !== 'upm_sayur'),
      {
        key: 'upm_sayur',
        label: imported.meta.sumber,
        digunakanUntuk: `Tempoh matang ${matangMin}–${matangMax} hari${semaiNote}`,
      },
    ],
  };
}
