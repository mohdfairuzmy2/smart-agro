import type { CropKnowledge, CropSopStep } from '../types';
import doaData from './doaPerakByCrop.json';

interface DoaEntry {
  jarakTanam: string;
  kedalamanBenih?: string;
  penyediaanTanah: string;
  sop: CropSopStep[];
  sumber: string;
}

const imported = doaData as {
  meta: { sumber: string; url: string; dikemaskini: string };
  byCrop: Record<string, DoaEntry>;
};

export function getDoaPerakMeta() {
  return imported.meta;
}

export function getDoaEntry(cropId: string): DoaEntry | undefined {
  return imported.byCrop[cropId];
}

export function mergeDoaPerakSop(crop: CropKnowledge): CropKnowledge {
  const doa = imported.byCrop[crop.id];
  if (!doa) return crop;

  const sop = doa.sop.map((s) => ({ ...s, sumber: 'doa_perak' as const }));
  const jarakNote = `Jarak: ${doa.jarakTanam}`;

  return {
    ...crop,
    sop,
    catatan: [crop.catatan, jarakNote, doa.penyediaanTanah].filter(Boolean).join(' · '),
    sumber: [
      ...crop.sumber.filter((s) => s.key !== 'doa_perak'),
      {
        key: 'doa_perak',
        label: imported.meta.sumber,
        digunakanUntuk: jarakNote,
      },
    ],
  };
}
