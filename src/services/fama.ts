import type { MarketPrice } from '../data/types';
import famaData from '../data/cropKnowledge/imports/famaPricesByCrop.json';

interface FamaCropPrice {
  cropId: string;
  komoditi: string;
  hargaRm: number;
  unit: string;
  gred: string;
  pasar: string;
  peringkat: string;
  perubahanPct: number;
  sejarah: number[];
  sumber: string;
}

const imported = famaData as {
  meta: { sumber: string; url: string; nota?: string; dikemaskini: string };
  byCrop: Record<string, Omit<FamaCropPrice, 'cropId'>>;
};

export function getFamaMeta() {
  return imported.meta;
}

/** Harga pasaran dari import FAMA (MyHargaTani / data terbuka — kurasi MVP) */
export async function fetchMarketPricesFromFama(): Promise<MarketPrice[]> {
  return Object.entries(imported.byCrop).map(([, row]) => ({
    komoditi: row.komoditi,
    gred: row.gred,
    harga: row.hargaRm,
    unit: row.unit,
    perubahan: row.perubahanPct,
    pasar: row.pasar,
    sumber: `FAMA · ${imported.meta.dikemaskini}`,
    sejarah: row.sejarah,
  }));
}

export function getFamaPriceForCrop(cropId: string): FamaCropPrice | null {
  const row = imported.byCrop[cropId];
  if (!row) return null;
  return { ...row, cropId };
}
