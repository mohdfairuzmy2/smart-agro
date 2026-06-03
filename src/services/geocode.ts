import { lookupTownCoords } from '../config/locationCoords';
import type { FarmProfile } from './farmProfile';

export interface MapCoordinates {
  lat: number;
  lon: number;
  source: 'gps' | 'preset' | 'nominatim';
}

const cache = new Map<string, MapCoordinates>();

function cacheKey(lokasi: string, negeri: string): string {
  return `${lokasi}|${negeri}`.toLowerCase();
}

/** Nominatim OSM — 1 req/s; User-Agent wajib */
async function geocodeNominatim(query: string): Promise<MapCoordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=my&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'ms', 'User-Agent': 'SMART-AGRO/1.0 (pertanian; dev)' },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat: string; lon: string }[];
  if (!data[0]) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    source: 'nominatim',
  };
}

export async function resolveFarmCoordinates(profile: Pick<FarmProfile, 'lat' | 'lon' | 'lokasi' | 'negeri'>): Promise<MapCoordinates> {
  if (profile.lat != null && profile.lon != null) {
    return { lat: profile.lat, lon: profile.lon, source: 'gps' };
  }

  const key = cacheKey(profile.lokasi, profile.negeri);
  const hit = cache.get(key);
  if (hit) return hit;

  const preset = lookupTownCoords(profile.lokasi, profile.negeri);
  if (preset) {
    const coords = { ...preset, source: 'preset' as const };
    cache.set(key, coords);
    return coords;
  }

  const query = `${profile.lokasi}, ${profile.negeri}, Malaysia`;
  const geo = await geocodeNominatim(query);
  if (geo) {
    cache.set(key, geo);
    return geo;
  }

  const fallback = { lat: 2.9927, lon: 101.7909, source: 'preset' as const };
  cache.set(key, fallback);
  return fallback;
}

export function buildOsmEmbedUrl(lat: number, lon: number, delta = 0.018): string {
  const minLon = lon - delta;
  const minLat = lat - delta * 0.7;
  const maxLon = lon + delta;
  const maxLat = lat + delta * 0.7;
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`;
}

export function buildOsmExternalUrl(lat: number, lon: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}`;
}
