import type { AlertLevel } from '../types';

/** Rujukan sumber data rasmi / akademik (prioriti pembangunan) */
export type CropSourceKey =
  | 'upm_sayur'
  | 'doa_perak'
  | 'mardi_myagri'
  | 'geotanih'
  | 'met'
  | 'fama'
  | 'plantvillage'
  | 'plantvillage_import';

export type CropCategory =
  | 'sayur'
  | 'buah'
  | 'padi'
  | 'tanaman_industri'
  | 'rempah'
  | 'herba';

export type TaskJenis = 'baja' | 'siraman' | 'racun' | 'tuaian' | 'tanam' | 'pemantauan';

export interface CropSourceRef {
  key: CropSourceKey;
  label: string;
  digunakanUntuk: string;
}

export interface CropPhaseDef {
  nama: string;
  hariMula: number;
  hariTamat: number;
}

export interface CropTaskTemplate {
  hariRelatif: number;
  aktiviti: string;
  jenis: TaskJenis;
  catatan?: string;
  sumber?: CropSourceKey;
}

export interface CropDisease {
  id: string;
  nama: string;
  simptom: string;
  tahapRisiko: AlertLevel;
  tindakan: string;
  plantVillageLabel?: string;
  pemicu?: string[];
}

export interface CropSopStep {
  langkah: number;
  tajuk: string;
  keterangan: string;
  sumber?: CropSourceKey;
}

export interface CropKnowledge {
  id: string;
  nama: string;
  namaSaintifik?: string;
  ikon: string;
  kategori: CropCategory;
  /** Varieti / kultivar popular di Malaysia */
  varietiDisyorkan: string[];
  tempohMatangHari: { min: number; max: number };
  anggaranHasil: string;
  musimTanam: string;
  permintaanPasaran: AlertLevel;
  /** GeoTanih / DOA — jenis tanah sesuai */
  tanahSesuai: string[];
  tanahKurangSesuai: string[];
  negeriSesuai?: string[];
  sumber: CropSourceRef[];
  fasa: CropPhaseDef[];
  tugasan: CropTaskTemplate[];
  penyakit: CropDisease[];
  sop: CropSopStep[];
  catatan?: string;
}

export interface CropRepositoryMeta {
  versi: string;
  dikemaskini: string;
  jumlahTanaman: number;
  sumberUtama: CropSourceRef[];
}
