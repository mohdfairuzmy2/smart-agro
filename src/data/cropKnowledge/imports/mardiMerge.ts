import type { CropKnowledge, CropTaskTemplate } from '../types';
import mardiData from './mardiTugasanByCrop.json';

interface MardiEntry {
  varieti?: string | null;
  tugasan: CropTaskTemplate[];
  sumber?: string;
}

const imported = mardiData as {
  meta: { sumber: string; url: string; dikemaskini: string };
  byCrop: Record<string, MardiEntry>;
};

export function getMardiMeta() {
  return imported.meta;
}

export function getMardiEntry(cropId: string): MardiEntry | undefined {
  return imported.byCrop[cropId];
}

export function mergeMardiTugasan(crop: CropKnowledge): CropKnowledge {
  const mardi = imported.byCrop[crop.id];
  if (!mardi?.tugasan?.length) return crop;

  const tugasan = mardi.tugasan.map((t) => ({
    ...t,
    sumber: (t.sumber ?? 'mardi_myagri') as CropTaskTemplate['sumber'],
  }));

  const varieti =
    mardi.varieti && !crop.varietiDisyorkan.includes(mardi.varieti)
      ? [mardi.varieti, ...crop.varietiDisyorkan]
      : crop.varietiDisyorkan;

  return {
    ...crop,
    varietiDisyorkan: varieti,
    tugasan,
    sumber: [
      ...crop.sumber.filter((s) => s.key !== 'mardi_myagri'),
      {
        key: 'mardi_myagri',
        label: imported.meta.sumber,
        digunakanUntuk: `${tugasan.length} aktiviti jadual`,
      },
    ],
  };
}
