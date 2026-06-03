import { DEFAULT_COORDS, NEGERI_TO_MET_STATE_ID } from '../config/locations';
import type { CurrentWeather, ForecastDay } from '../data/types';
import { dataGovMy, fetchJson } from './apiClient';

export type DataSourceTag = 'live' | 'mock' | 'hybrid';

interface MetForecastRow {
  location: { location_id: string; location_name: string };
  date: string;
  summary_forecast: string;
  summary_when?: string;
  min_temp: number;
  max_temp: number;
  morning_forecast?: string;
  afternoon_forecast?: string;
}

interface MetWarningRow {
  warning_issue: { issued: string; title_bm: string; title_en: string };
  valid_from: string;
  valid_to: string;
  text_bm: string;
  text_en: string;
}

interface OpenMeteoCurrent {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    precipitation_probability: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

const HARI_MS = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];

function forecastIcon(text: string, code?: number): string {
  const t = text.toLowerCase();
  if (t.includes('ribut') || t.includes('petir')) return '⛈️';
  if (t.includes('hujan lebat') || t.includes('hujan di kebanyakan')) return '🌧️';
  if (t.includes('hujan')) return '🌦️';
  if (t.includes('tiada hujan') || t.includes('tiada')) return '☀️';
  if (code !== undefined) {
    if (code >= 95) return '⛈️';
    if (code >= 61) return '🌧️';
    if (code >= 51) return '🌦️';
    if (code >= 3) return '⛅';
  }
  return '⛅';
}

function currentIcon(code: number): string {
  if (code >= 95) return '⛈️';
  if (code >= 61) return '🌧️';
  if (code >= 51) return '🌦️';
  if (code <= 2) return '☀️';
  return '⛅';
}

function dayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Esok';
  return HARI_MS[d.getDay()];
}

export async function fetchMetForecast(stateId: string): Promise<MetForecastRow[]> {
  const url = dataGovMy('/weather/forecast', {
    contains: `${stateId}@location__location_id`,
    limit: 14,
  });
  return fetchJson<MetForecastRow[]>(url);
}

export async function fetchMetWarnings(limit = 10): Promise<MetWarningRow[]> {
  return fetchJson<MetWarningRow[]>(dataGovMy('/weather/warning', { limit }));
}

export async function fetchOpenMeteo(lat: number, lon: number): Promise<OpenMeteoCurrent> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
    timezone: 'Asia/Kuala_Lumpur',
    forecast_days: '7',
  });
  return fetchJson<OpenMeteoCurrent>(`https://api.open-meteo.com/v1/forecast?${params}`);
}

export function resolveStateId(negeri: string): string {
  return NEGERI_TO_MET_STATE_ID[negeri] ?? 'St008';
}

export async function loadWeatherBundle(negeri: string, lat?: number, lon?: number) {
  const stateId = resolveStateId(negeri);
  const coords = {
    lat: lat ?? DEFAULT_COORDS.lat,
    lon: lon ?? DEFAULT_COORDS.lon,
  };

  const [metRows, openMeteo, warnings] = await Promise.all([
    fetchMetForecast(stateId),
    fetchOpenMeteo(coords.lat, coords.lon),
    fetchMetWarnings(8),
  ]);

  const byDate = new Map<string, MetForecastRow>();
  metRows.forEach((r) => {
    if (!byDate.has(r.date) || r.location.location_id === stateId) {
      byDate.set(r.date, r);
    }
  });
  const sortedMet = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

  const todayMet = sortedMet[0];
  const locationName = todayMet?.location.location_name ?? negeri;

  const current: CurrentWeather = {
    suhu: Math.round(openMeteo.current.temperature_2m),
    keadaan: todayMet?.summary_forecast ?? 'Tiada data',
    ikon: currentIcon(openMeteo.current.weather_code),
    kelembapan: Math.round(openMeteo.current.relative_humidity_2m),
    angin: Math.round(openMeteo.current.wind_speed_10m),
    hujan: Math.round(openMeteo.current.precipitation_probability),
    lokasi: `${locationName}, ${negeri}`,
    dikemaskini: `METMalaysia + Open-Meteo · ${new Date().toLocaleString('ms-MY', { hour: '2-digit', minute: '2-digit' })}`,
  };

  const forecast: ForecastDay[] = openMeteo.daily.time.slice(0, 7).map((date, i) => {
    const met = sortedMet.find((r) => r.date === date);
    const summary = met?.summary_forecast ?? '';
    return {
      hari: dayLabel(date),
      ikon: forecastIcon(summary, openMeteo.daily.weather_code[i]),
      suhuMin: Math.round(openMeteo.daily.temperature_2m_min[i]),
      suhuMax: Math.round(openMeteo.daily.temperature_2m_max[i]),
      hujan: Math.round(openMeteo.daily.precipitation_probability_max[i]),
    };
  });

  return { current, forecast, warnings, source: 'hybrid' as DataSourceTag };
}

export type WeatherBundle = Awaited<ReturnType<typeof loadWeatherBundle>>;
