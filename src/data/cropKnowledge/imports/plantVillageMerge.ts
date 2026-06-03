import type { CropDisease, CropKnowledge } from '../types';
import plantVillageData from './plantVillageByCrop.json';

interface PvEntry {
  id: string;
  nama: string;
  simptom: string;
  tahapRisiko: 'rendah' | 'sederhana' | 'tinggi';
  tindakan: string;
  plantVillageLabel: string;
  sumber: string;
  isHealthy?: boolean;
  pemicu?: string[];
}

const imported = plantVillageData as {
  meta: { sumber: string; jumlahKelas: number; dikemaskini: string };
  byCrop: Record<string, PvEntry[]>;
};

export function getPlantVillageMeta() {
  return imported.meta;
}

function toCropDisease(e: PvEntry): CropDisease {
  return {
    id: e.id,
    nama: e.nama,
    simptom: e.simptom,
    tahapRisiko: e.tahapRisiko,
    tindakan: e.tindakan,
    plantVillageLabel: e.plantVillageLabel,
    pemicu: e.pemicu,
  };
}

/** Gabung penyakit PlantVillage — ganti rekod manual jika label PV wujud */
export function mergePlantVillagePenyakit(crop: CropKnowledge): CropKnowledge {
  const pvList = imported.byCrop[crop.id];
  if (!pvList?.length) return crop;

  const diseases = pvList.filter((e) => !e.isHealthy).map(toCropDisease);
  const healthy = pvList.find((e) => e.isHealthy);

  const merged: CropDisease[] = [...diseases];
  if (healthy) merged.push(toCropDisease(healthy));

  const manualOnly = crop.penyakit.filter(
    (p) => !p.plantVillageLabel && !merged.some((m) => m.nama === p.nama)
  );

  return {
    ...crop,
    penyakit: [...merged, ...manualOnly],
    sumber: [
      ...crop.sumber.filter((s) => s.key !== 'plantvillage'),
      {
        key: 'plantvillage',
        label: 'PlantVillage Dataset',
        digunakanUntuk: `Import ${imported.meta.jumlahKelas} kelas penyakit`,
      },
    ],
  };
}

export function getPlantVillageLabelsForCrop(cropId: string): string[] {
  return (imported.byCrop[cropId] ?? []).map((e) => e.plantVillageLabel);
}

export function matchPlantVillageDiagnosis(cropId: string, uploadedLabelHint?: string): PvEntry | null {
  const list = imported.byCrop[cropId] ?? [];
  if (!list.length) return null;
  if (uploadedLabelHint) {
    const hit = list.find((e) => e.plantVillageLabel.includes(uploadedLabelHint));
    if (hit) return hit;
  }
  const diseases = list.filter((e) => !e.isHealthy);
  return diseases[Math.floor(Math.random() * diseases.length)] ?? list[0];
}
