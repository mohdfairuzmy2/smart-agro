#!/usr/bin/env node
/**
 * Import PlantVillage — 38 kelas rasmi (TensorFlow Datasets / crowdAI)
 * Output: src/data/cropKnowledge/imports/plantVillageByCrop.json
 *
 * Sumber: https://www.tensorflow.org/datasets/catalog/plant_village
 *         https://github.com/spMohanty/PlantVillage-Dataset
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/data/cropKnowledge/imports/plantVillageByCrop.json');

/** 38 label rasmi PlantVillage */
const PLANT_VILLAGE_LABELS = [
  'Apple___Apple_scab',
  'Apple___Black_rot',
  'Apple___Cedar_apple_rust',
  'Apple___healthy',
  'Blueberry___healthy',
  'Cherry___healthy',
  'Cherry___Powdery_mildew',
  'Corn___Cercospora_leaf_spot Gray_leaf_spot',
  'Corn___Common_rust',
  'Corn___healthy',
  'Corn___Northern_Leaf_Blight',
  'Grape___Black_rot',
  'Grape___Esca_(Black_Measles)',
  'Grape___healthy',
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  'Orange___Haunglongbing_(Citrus_greening)',
  'Peach___Bacterial_spot',
  'Peach___healthy',
  'Pepper,_bell___Bacterial_spot',
  'Pepper,_bell___healthy',
  'Potato___Early_blight',
  'Potato___healthy',
  'Potato___Late_blight',
  'Raspberry___healthy',
  'Soybean___healthy',
  'Squash___Powdery_mildew',
  'Strawberry___healthy',
  'Strawberry___Leaf_scorch',
  'Tomato___Bacterial_spot',
  'Tomato___Early_blight',
  'Tomato___healthy',
  'Tomato___Late_blight',
  'Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot',
  'Tomato___Spider_mites Two-spotted_spider_mite',
  'Tomato___Target_Spot',
  'Tomato___Tomato_mosaic_virus',
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
];

/** Pemetaan spesies PlantVillage → cropId SMART AGRO */
const SPECIES_TO_CROPS = {
  'Pepper,_bell': ['cili-merah', 'cili-padi'],
  Tomato: ['tomato'],
  Potato: ['ubi-kentang'],
  Corn: ['jagung-manis'],
  Orange: ['limau-purut'],
  Grape: ['rockmelon'],
  Squash: ['labu-manis', 'labu-kuning'],
  Soybean: ['kacang-tanah'],
  Cherry: ['tomato'],
  Peach: ['tomato'],
  Apple: ['tomato'],
  Blueberry: [],
  Raspberry: [],
  Strawberry: ['tomato'],
};

const META_BM = {
  'Apple___Apple_scab': { nama: 'Apple Scab (Kudis)', simptom: 'Bintik zaitun pada daun dan buah', tindakan: 'Fungisid; buang daun teruk', tahap: 'sederhana' },
  'Apple___Black_rot': { nama: 'Apple Black Rot', simptom: 'Daun dan buah reput hitam', tindakan: 'Sanitasi canopi; fungisan', tahap: 'sederhana' },
  'Apple___Cedar_apple_rust': { nama: 'Cedar Apple Rust', simptom: 'Bintik jingga pada daun', tindakan: 'Buang hospes alternatif', tahap: 'rendah' },
  'Apple___healthy': { nama: 'Daun Sihat (Apple)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Blueberry___healthy': { nama: 'Daun Sihat (Blueberry)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Cherry___healthy': { nama: 'Daun Sihat (Cherry)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Cherry___Powdery_mildew': { nama: 'Powdery Mildew', simptom: 'Serbuk putih pada daun', tindakan: 'Fungisid sulfur', tahap: 'sederhana' },
  'Corn___Cercospora_leaf_spot Gray_leaf_spot': { nama: 'Cercospora / Gray Leaf Spot', simptom: 'Bintik kelabu memanjang', tindakan: 'Varieti tahan; fungisan', tahap: 'sederhana' },
  'Corn___Common_rust': { nama: 'Common Rust (Karat)', simptom: 'Pustul jingga pada daun', tindakan: 'Fungisid; varieti tahan', tahap: 'sederhana' },
  'Corn___healthy': { nama: 'Daun Sihat (Jagung)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Corn___Northern_Leaf_Blight': { nama: 'Northern Leaf Blight', simptom: 'Lesion memanjang coklat', tindakan: 'Fungisid; rotasi', tahap: 'sederhana' },
  'Grape___Black_rot': { nama: 'Grape Black Rot', simptom: 'Bintik cekung hitam pada daun', tindakan: 'Fungisid kuprum', tahap: 'sederhana' },
  'Grape___Esca_(Black_Measles)': { nama: 'Esca (Black Measles)', simptom: 'Daun layu, bintik pada batang', tindakan: 'Pangkas; sanitasi', tahap: 'tinggi' },
  'Grape___healthy': { nama: 'Daun Sihat (Anggur)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': { nama: 'Isariopsis Leaf Spot', simptom: 'Bintik coklat pada daun', tindakan: 'Fungisid', tahap: 'rendah' },
  'Orange___Haunglongbing_(Citrus_greening)': { nama: 'Huanglongbing (Citrus Greening)', simptom: 'Daun kuning tidak seragam, buah kecil', tindakan: 'Kawalan vektor psylla; pokok dijangkiti dibuang', tahap: 'tinggi' },
  'Peach___Bacterial_spot': { nama: 'Bacterial Spot', simptom: 'Bintik kecil pada daun dan buah', tindakan: 'Racun kuprum; varieti tahan', tahap: 'sederhana' },
  'Peach___healthy': { nama: 'Daun Sihat (Peach)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Pepper,_bell___Bacterial_spot': { nama: 'Bacterial Spot (Cili)', simptom: 'Bintik berminyak pada daun', tindakan: 'Racun kuprum; benih sihat', tahap: 'sederhana' },
  'Pepper,_bell___healthy': { nama: 'Daun Sihat (Cili)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Potato___Early_blight': { nama: 'Early Blight', simptom: 'Bintik coklat berkoncentrik', tindakan: 'Fungisid; rotasi', tahap: 'sederhana' },
  'Potato___healthy': { nama: 'Daun Sihat (Kentang)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Potato___Late_blight': { nama: 'Late Blight (Hawar Belakang)', simptom: 'Bercak hitam lembap pada daun', tindakan: 'Fungisid sistemik segera', tahap: 'tinggi' },
  'Raspberry___healthy': { nama: 'Daun Sihat (Raspberry)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Soybean___healthy': { nama: 'Daun Sihat (Kacang Soja)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Squash___Powdery_mildew': { nama: 'Powdery Mildew (Labu)', simptom: 'Serbuk putih pada daun', tindakan: 'Fungisid; jarak tanam', tahap: 'sederhana' },
  'Strawberry___healthy': { nama: 'Daun Sihat (Strawberry)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Strawberry___Leaf_scorch': { nama: 'Leaf Scorch', simptom: 'Hujung daun kering kehitaman', tindakan: 'Kawal penyiraman', tahap: 'sederhana' },
  'Tomato___Bacterial_spot': { nama: 'Bacterial Spot (Tomato)', simptom: 'Bintik kecil hitam pada daun', tindakan: 'Racun kuprum', tahap: 'sederhana' },
  'Tomato___Early_blight': { nama: 'Early Blight (Tomato)', simptom: 'Bintik coklat berkoncentrik', tindakan: 'Fungisid; buang daun bawah', tahap: 'sederhana' },
  'Tomato___healthy': { nama: 'Daun Sihat (Tomato)', simptom: 'Tiada simptom', tindakan: 'Teruskan pemantauan', tahap: 'rendah' },
  'Tomato___Late_blight': { nama: 'Late Blight (Tomato)', simptom: 'Bercak hitam lembap, reput cepat', tindakan: 'Fungisid segera; ventilasi', tahap: 'tinggi' },
  'Tomato___Leaf_Mold': { nama: 'Leaf Mold', simptom: 'Hijau pucat pada permukaan atas', tindakan: 'Kurangkan kelembapan rumah', tahap: 'sederhana' },
  'Tomato___Septoria_leaf_spot': { nama: 'Septoria Leaf Spot', simptom: 'Bintik bulat kelabu kecil', tindakan: 'Fungisid; buang daun bawah', tahap: 'sederhana' },
  'Tomato___Spider_mites Two-spotted_spider_mite': { nama: 'Spider Mites', simptom: 'Daun bertompok kuning, jaring halus', tindakan: 'Racun mitisida; kelembapan', tahap: 'sederhana' },
  'Tomato___Target_Spot': { nama: 'Target Spot', simptom: 'Bintik berkoncentrik seperti sasaran', tindakan: 'Fungisid', tahap: 'sederhana' },
  'Tomato___Tomato_mosaic_virus': { nama: 'Mosaic Virus', simptom: 'Corak mozek hijau-kuning', tindakan: 'Basmi pokok; kawal vektor', tahap: 'tinggi' },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': { nama: 'Yellow Leaf Curl Virus', simptom: 'Daun keriting kuning ke atas', tindakan: 'Kawal whitefly; varieti tahan', tahap: 'tinggi' },
};

function speciesFromLabel(label) {
  const idx = label.indexOf('___');
  return idx === -1 ? label : label.slice(0, idx);
}

function diseaseIdFromLabel(label) {
  return label.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase().slice(0, 48);
}

const byCrop = {};

for (const label of PLANT_VILLAGE_LABELS) {
  const species = speciesFromLabel(label);
  const cropIds = SPECIES_TO_CROPS[species] ?? [];
  const meta = META_BM[label] ?? {
    nama: label.split('___').pop()?.replace(/_/g, ' ') ?? label,
    simptom: 'Rujuk dataset PlantVillage',
    tindakan: 'Pantau & rujuk pakar pertanian',
    tahap: 'sederhana',
  };
  const isHealthy = label.endsWith('healthy');

  const entry = {
    id: `pv-${diseaseIdFromLabel(label)}`,
    nama: meta.nama,
    simptom: meta.simptom,
    tahapRisiko: meta.tahap,
    tindakan: meta.tindakan,
    plantVillageLabel: label,
    sumber: 'plantvillage',
    isHealthy,
    pemicu: isHealthy ? [] : ['hujan', 'kelembapan'],
  };

  for (const cropId of cropIds) {
    if (!byCrop[cropId]) byCrop[cropId] = [];
    byCrop[cropId].push(entry);
  }
}

const output = {
  meta: {
    sumber: 'PlantVillage Dataset',
    url: 'https://www.tensorflow.org/datasets/catalog/plant_village',
    versi: '1.0.2',
    jumlahKelas: PLANT_VILLAGE_LABELS.length,
    dikemaskini: new Date().toISOString().slice(0, 10),
    nota: '38 kelas rasmi; dipetakan ke cropId SMART AGRO mengikut spesies',
  },
  byCrop,
  labels: PLANT_VILLAGE_LABELS,
};

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
console.log(`✓ PlantVillage import: ${PLANT_VILLAGE_LABELS.length} kelas → ${Object.keys(byCrop).length} tanaman`);
console.log(`  Fail: ${OUT}`);
