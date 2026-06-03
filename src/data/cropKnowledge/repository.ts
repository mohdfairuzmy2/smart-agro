import type { Alert, AlertLevel, CropPlan, CropRecommendation, CropPhase, CalendarTask } from '../types';
import type { CropKnowledge, CropRepositoryMeta, CropSourceRef } from './types';
import { CROP_KNOWLEDGE } from './cropsData';
import { mergeDoaPerakSop, getDoaPerakMeta } from './imports/doaPerakMerge';
import { getGeotanihSoilScore, mergeGeotanihSoil, getGeotanihMeta } from './imports/geotanihMerge';
import { mergeMardiTugasan, getMardiMeta } from './imports/mardiMerge';
import { getPlantVillageMeta, mergePlantVillagePenyakit } from './imports/plantVillageMerge';
import { getUpmSayurMeta, mergeUpmSayurMaturity } from './imports/upmSayurMerge';

const CROPS_ENRICHED = CROP_KNOWLEDGE.map(mergePlantVillagePenyakit)
  .map(mergeDoaPerakSop)
  .map(mergeMardiTugasan)
  .map(mergeGeotanihSoil)
  .map(mergeUpmSayurMaturity);

const MS_DAY = 86400000;

const REPO_SOURCES: CropSourceRef[] = [
  { key: 'upm_sayur', label: 'UPM Manual Penanaman Sayur', digunakanUntuk: 'Tempoh matang sayur' },
  { key: 'doa_perak', label: 'DOA Perak (Panduan Tanaman)', digunakanUntuk: 'SOP & jarak tanam' },
  { key: 'mardi_myagri', label: 'MARDI myAgriManager', digunakanUntuk: 'Jadual aktiviti' },
  { key: 'geotanih', label: 'GeoTanih DOA', digunakanUntuk: 'Kesesuaian tanah' },
  { key: 'plantvillage', label: 'PlantVillage', digunakanUntuk: 'Penyakit & simptom' },
  { key: 'met', label: 'METMalaysia', digunakanUntuk: 'Pemicu cuaca penyakit' },
  { key: 'fama', label: 'FAMA', digunakanUntuk: 'Harga pasaran (fasa 2)' },
];

export function getRepositoryMeta(): CropRepositoryMeta {
  const pv = getPlantVillageMeta();
  const upm = getUpmSayurMeta();
  const doa = getDoaPerakMeta();
  const mardi = getMardiMeta();
  const geo = getGeotanihMeta();
  return {
    versi: '1.3.0-agencies',
    dikemaskini: upm.dikemaskini,
    jumlahTanaman: CROPS_ENRICHED.length,
    sumberUtama: [
      ...REPO_SOURCES.filter((s) => s.key !== 'fama'),
      { key: 'fama', label: 'FAMA (imported)', digunakanUntuk: 'Harga pasaran rujukan' },
      {
        key: 'plantvillage_import',
        label: 'PlantVillage (imported)',
        digunakanUntuk: `${pv.jumlahKelas} kelas penyakit`,
      },
      {
        key: 'upm_sayur',
        label: 'UPM (imported)',
        digunakanUntuk: `${upm.jumlahSayurDalamRepo} sayur — tempoh matang`,
      },
      {
        key: 'doa_perak',
        label: 'DOA Perak (imported)',
        digunakanUntuk: `SOP · ${doa.dikemaskini}`,
      },
      {
        key: 'mardi_myagri',
        label: 'MARDI (imported)',
        digunakanUntuk: `Jadual aktiviti · ${mardi.dikemaskini}`,
      },
      {
        key: 'geotanih',
        label: 'GeoTanih (imported)',
        digunakanUntuk: `Kesesuaian tanah · ${geo.dikemaskini}`,
      },
    ],
  };
}

export function getAllCrops(): CropKnowledge[] {
  return CROPS_ENRICHED;
}

export function getCropById(id: string): CropKnowledge | undefined {
  return CROPS_ENRICHED.find((c) => c.id === id);
}

export function resolveCropIdFromLabel(label: string): string {
  const norm = label.toLowerCase();
  const hit = CROPS_ENRICHED.find(
    (c) =>
      c.id === norm ||
      c.nama.toLowerCase() === norm ||
      c.nama.toLowerCase().includes(norm) ||
      norm.includes(c.nama.toLowerCase().split(' ')[0])
  );
  if (hit) return hit.id;
  if (norm.includes('padi') || norm.includes('mr297')) return 'padi-mr297';
  if (norm.includes('cili')) return 'cili-merah';
  return 'padi-mr297';
}

function soilScore(crop: CropKnowledge, jenisTanah: string): number {
  const geo = getGeotanihSoilScore(crop.id, jenisTanah);
  if (geo != null) {
    let score = geo;
    if (crop.negeriSesuai?.length) score += 5;
    return Math.min(98, Math.max(35, score));
  }
  const t = jenisTanah.toLowerCase();
  const match = crop.tanahSesuai.some((s) => t.includes(s.toLowerCase().slice(0, 8)) || s.toLowerCase().includes(t.slice(0, 6)));
  const bad = crop.tanahKurangSesuai.some((s) => t.includes(s.toLowerCase().slice(0, 8)));
  let score = match ? 88 : 62;
  if (bad) score -= 25;
  if (crop.negeriSesuai?.length) score += 5;
  return Math.min(98, Math.max(35, score));
}

function demandScore(level: AlertLevel): number {
  if (level === 'tinggi') return 12;
  if (level === 'sederhana') return 5;
  return 0;
}

export function recommendCrops(input: {
  jenisTanah: string;
  negeri: string;
  tanamanUtama?: string;
  maxRainPct?: number;
}): CropRecommendation[] {
  const excludeId = input.tanamanUtama ? resolveCropIdFromLabel(input.tanamanUtama) : null;

  return CROPS_ENRICHED.filter((c) => c.id !== excludeId)
    .map((crop) => {
      let kesesuaian = soilScore(crop, input.jenisTanah) + demandScore(crop.permintaanPasaran);
      if (crop.negeriSesuai?.includes(input.negeri)) kesesuaian += 8;
      if (input.maxRainPct && input.maxRainPct > 75 && crop.kategori === 'sayur') kesesuaian -= 8;
      kesesuaian = Math.min(98, Math.max(40, Math.round(kesesuaian)));

      return {
        cropId: crop.id,
        nama: crop.nama,
        ikon: crop.ikon,
        kesesuaian,
        musim: crop.musimTanam,
        tempohMatang: `${crop.tempohMatangHari.min}–${crop.tempohMatangHari.max} hari`,
        anggaranHasil: crop.anggaranHasil,
        permintaan: crop.permintaanPasaran,
        catatan:
          crop.catatan ??
          `Sesuai tanah: ${crop.tanahSesuai.slice(0, 2).join(', ')}. Skor GeoTanih/DOA.`,
      };
    })
    .sort((a, b) => b.kesesuaian - a.kesesuaian)
    .slice(0, 8);
}

function formatTarikh(d: Date): string {
  return d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' });
}

export function buildCropPlan(cropId: string, tarikhTanam?: Date, varietiOverride?: string): CropPlan | null {
  const crop = getCropById(cropId);
  if (!crop) return null;

  const tanam = tarikhTanam ?? new Date(Date.now() - 52 * MS_DAY);
  const hariSemasa = Math.floor((Date.now() - tanam.getTime()) / MS_DAY);
  const matang = crop.fasa[crop.fasa.length - 1].hariTamat;

  const fasa: CropPhase[] = crop.fasa.map((f) => ({
    nama: f.nama,
    julatHari: `Hari ${f.hariMula}–${f.hariTamat}`,
    selesai: hariSemasa > f.hariTamat,
    aktif: hariSemasa >= f.hariMula && hariSemasa <= f.hariTamat,
  }));

  const fasaAktif = fasa.find((f) => f.aktif);
  const peratusKemajuan = Math.min(100, Math.round((hariSemasa / matang) * 100));
  const hariKeTuaian = Math.max(0, matang - hariSemasa);

  const tugasan: CalendarTask[] = crop.tugasan.map((t) => {
    const due = new Date(tanam.getTime() + t.hariRelatif * MS_DAY);
    return {
      tarikh: formatTarikh(due),
      aktiviti: t.aktiviti,
      jenis: t.jenis,
      selesai: due.getTime() < Date.now() - MS_DAY,
      catatan: t.catatan,
    };
  });

  tugasan.sort((a, b) => {
    const da = new Date(`${a.tarikh} 2026`);
    const db = new Date(`${b.tarikh} 2026`);
    return da.getTime() - db.getTime();
  });

  return {
    tanaman: crop.nama.split('(')[0].trim(),
    varieti: varietiOverride ?? crop.varietiDisyorkan[0],
    tarikhTanam: tanam.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }),
    fasaSemasa: fasaAktif?.nama ?? 'Penyediaan',
    peratusKemajuan,
    hariKeTuaian,
    fasa,
    tugasan,
  };
}

export function buildDiseaseAlerts(
  cropId: string,
  ctx?: { kelembapan?: number; hujanPct?: number }
): Alert[] {
  const crop = getCropById(cropId);
  if (!crop) return [];

  return crop.penyakit.map((p) => {
    let tahap = p.tahapRisiko;
    if (ctx?.kelembapan && ctx.kelembapan > 70 && p.pemicu?.includes('kelembapan')) {
      tahap = tahap === 'rendah' ? 'sederhana' : tahap;
    }
    if (ctx?.hujanPct && ctx.hujanPct > 65 && p.pemicu?.includes('hujan')) {
      tahap = tahap === 'rendah' ? 'sederhana' : tahap === 'sederhana' ? 'tinggi' : tahap;
    }

    return {
      id: `repo-${cropId}-${p.id}`,
      kategori: 'penyakit' as const,
      tajuk: `${p.nama} — ${crop.nama}`,
      tahap,
      keterangan: p.simptom + (p.plantVillageLabel ? ` (PlantVillage: ${p.plantVillageLabel})` : ''),
      tindakan: p.tindakan,
      masa: 'Crop Knowledge Repository',
      ikon: '🦠',
    };
  });
}

export function searchCrops(query: string): CropKnowledge[] {
  const q = query.toLowerCase().trim();
  if (!q) return CROPS_ENRICHED;
  return CROPS_ENRICHED.filter(
    (c) =>
      c.nama.toLowerCase().includes(q) ||
      c.id.includes(q) ||
      c.kategori.includes(q) ||
      c.varietiDisyorkan.some((v) => v.toLowerCase().includes(q))
  );
}

export function getCropsByCategory(kategori: CropKnowledge['kategori']): CropKnowledge[] {
  return CROPS_ENRICHED.filter((c) => c.kategori === kategori);
}
