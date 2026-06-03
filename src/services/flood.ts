import { INFOBANJIR_PORTAL } from '../config/locations';
import type { Alert, AlertLevel } from '../data/types';
import type { WeatherBundle } from './weather';

interface MetWarningRow {
  text_bm: string;
  warning_issue: { title_bm: string; issued: string };
  valid_to: string;
}

function warningAffectsState(text: string, negeri: string): boolean {
  const t = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    Selangor: ['selangor'],
    'Negeri Sembilan': ['n. sembilan', 'negeri sembilan'],
    Johor: ['johor'],
    Pahang: ['pahang'],
    Kedah: ['kedah', 'perlis'],
    Perlis: ['perlis', 'kedah'],
    'Pulau Pinang': ['pulau pinang', 'penang'],
    Melaka: ['melaka'],
    Sabah: ['sabah'],
    Sarawak: ['sarawak'],
    Terengganu: ['terengganu'],
    Kelantan: ['kelantan'],
    Perak: ['perak'],
  };
  const keys = aliases[negeri] ?? [negeri.toLowerCase()];
  return keys.some((k) => t.includes(k));
}

function rainRiskFromForecast(hujanPct: number): AlertLevel {
  if (hujanPct >= 75) return 'sederhana';
  if (hujanPct >= 55) return 'rendah';
  return 'rendah';
}

/** Amaran banjir MVP: MET warnings + risiko hujan + pautan InfoBanjir */
export function buildFloodAndWeatherAlerts(
  negeri: string,
  weather: WeatherBundle,
  existing: Alert[]
): Alert[] {
  const fromApi: Alert[] = [];
  const warnings = weather.warnings as MetWarningRow[];

  warnings.forEach((w, i) => {
    if (!warningAffectsState(w.text_bm, negeri)) return;
    const isHeavyRain = /hujan lebat|ribut|angin kencang/i.test(w.text_bm);
    fromApi.push({
      id: `met-warn-${i}`,
      kategori: isHeavyRain ? 'banjir' : 'cuaca',
      tajuk: w.warning_issue.title_bm,
      tahap: isHeavyRain ? 'sederhana' : 'rendah',
      keterangan: w.text_bm,
      tindakan: isHeavyRain
        ? 'Semak paras air di InfoBanjir & pastikan saliran sawah lancar.'
        : 'Pantau kemaskini METMalaysia.',
      masa: new Date(w.warning_issue.issued).toLocaleString('ms-MY', { dateStyle: 'short', timeStyle: 'short' }),
      ikon: isHeavyRain ? '🌊' : '⛈️',
    });
  });

  const maxRain = Math.max(...weather.forecast.map((f) => f.hujan), 0);
  if (maxRain >= 60) {
    fromApi.push({
      id: 'rain-risk-forecast',
      kategori: 'banjir',
      tajuk: 'Risiko Hujan Tinggi (Ramalan 7 Hari)',
      tahap: rainRiskFromForecast(maxRain),
      keterangan: `Kebarangkalian hujan mencapai ${maxRain}% dalam ramalan METMalaysia/Open-Meteo.`,
      tindakan: `Semak paras sungai di portal InfoBanjir JPS.`,
      masa: 'Ramalan semasa',
      ikon: '🌧️',
    });
  }

  fromApi.push({
    id: 'infobanjir-link',
    kategori: 'banjir',
    tajuk: 'Semak Paras Air Sungai — InfoBanjir JPS',
    tahap: 'rendah',
    keterangan: 'Data paras air masa nyata (~500 stesen) melalui portal rasmi JPS.',
    tindakan: `Buka ${INFOBANJIR_PORTAL}`,
    masa: 'Sumber: publicinfobanjir.water.gov.my',
    ikon: '📡',
  });

  const merged = [...fromApi];
  existing.forEach((a) => {
    if (a.kategori === 'penyakit' || a.kategori === 'perosak') merged.push(a);
  });

  return merged;
}

export { INFOBANJIR_PORTAL };
