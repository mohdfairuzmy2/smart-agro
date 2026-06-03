/** Koordinat rujukan bandar/ladang (lat, lon) — OpenStreetMap */
export const TOWN_COORDS: Record<string, { lat: number; lon: number }> = {
  'kajang,selangor': { lat: 2.9927, lon: 101.7909 },
  kajang: { lat: 2.9927, lon: 101.7909 },
  'shah alam,selangor': { lat: 3.0733, lon: 101.5185 },
  'petaling jaya,selangor': { lat: 3.1073, lon: 101.6067 },
  'kuala lumpur,selangor': { lat: 3.139, lon: 101.6869 },
  'wilayah persekutuan kuala lumpur': { lat: 3.139, lon: 101.6869 },
  'seremban,negeri sembilan': { lat: 2.7258, lon: 101.9424 },
  'ipoh,perak': { lat: 4.5975, lon: 101.0901 },
  'alor setar,kedah': { lat: 6.1248, lon: 100.3678 },
  'kota bharu,kelantan': { lat: 6.1254, lon: 102.2381 },
  'kuching,sarawak': { lat: 1.5535, lon: 110.3593 },
  'kota kinabalu,sabah': { lat: 5.9804, lon: 116.0735 },
  'melaka,melaka': { lat: 2.1896, lon: 102.2501 },
  'johor bahru,johor': { lat: 1.4927, lon: 103.7414 },
};

export function lookupTownCoords(lokasi: string, negeri: string): { lat: number; lon: number } | null {
  const a = `${lokasi},${negeri}`.toLowerCase().replace(/\s+/g, ' ').trim();
  if (TOWN_COORDS[a]) return TOWN_COORDS[a];
  const b = lokasi.toLowerCase().trim();
  if (TOWN_COORDS[b]) return TOWN_COORDS[b];
  return null;
}
