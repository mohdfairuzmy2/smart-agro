/** Pemetaan negeri → MET Malaysia location_id (data.gov.my) */
export const NEGERI_TO_MET_STATE_ID: Record<string, string> = {
  Perlis: 'St001',
  Kedah: 'St002',
  'Pulau Pinang': 'St003',
  Perak: 'St004',
  Kelantan: 'St005',
  Terengganu: 'St006',
  Pahang: 'St007',
  Selangor: 'St008',
  'Wilayah Persekutuan Kuala Lumpur': 'St009',
  'WP Kuala Lumpur': 'St009',
  'Kuala Lumpur': 'St009',
  'Wilayah Persekutuan Putrajaya': 'St010',
  Putrajaya: 'St010',
  'Negeri Sembilan': 'St011',
  Melaka: 'St012',
  Johor: 'St013',
  Sarawak: 'St014',
  Sabah: 'St015',
  'Wilayah Persekutuan Labuan': 'St016',
  Labuan: 'St016',
};

/** Koordinat lalai — Kajang, Selangor */
export const DEFAULT_COORDS = { lat: 2.99, lon: 101.79, label: 'Kajang, Selangor' };

export const INFOBANJIR_STATE_CODE = 'SEL';

export const INFOBANJIR_PORTAL = 'https://publicinfobanjir.water.gov.my/aras-air/data-paras-air/?state=SEL&lang=my';
