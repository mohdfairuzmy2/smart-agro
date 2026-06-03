import { useEffect, useMemo, useRef, useState } from 'react';
import type { Alert, AlertLevel } from '../data/types';
import DataSourceBadge from '../components/DataSourceBadge';
import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import { useData } from '../context/DataContext';
import { alertsListSourceKind, getAlertSourceKind, weatherSourceKind } from '../lib/dataSourceLabels';
import { matchPlantVillageDiagnosis } from '../data/cropKnowledge/imports/plantVillageMerge';
import { INFOBANJIR_PORTAL } from '../services/flood';
import { CameraIcon } from '../components/icons';
import { cn, levelStyles } from '../lib/ui';

const kategoriLabel: Record<Alert['kategori'], string> = {
  cuaca: 'Cuaca',
  banjir: 'Banjir',
  penyakit: 'Penyakit',
  perosak: 'Perosak',
};

interface Diagnosis {
  penyakit: string;
  keyakinan: number;
  tahap: AlertLevel;
  saranan: string;
}

type AlertFilter = 'semua' | 'aktif' | Alert['kategori'];

interface AlertsProps {
  initialAktifOnly?: boolean;
  onLeaveAktifFilter?: () => void;
}

export default function Alerts({ initialAktifOnly = false, onLeaveAktifFilter }: AlertsProps) {
  const { alerts, forecast, farmer, meta } = useData();
  const [filter, setFilter] = useState<AlertFilter>(initialAktifOnly ? 'aktif' : 'semua');
  const activeCount = alerts.filter((a) => a.tahap !== 'rendah').length;

  useEffect(() => {
    if (initialAktifOnly) setFilter('aktif');
  }, [initialAktifOnly]);

  const setFilterAndNotify = (f: AlertFilter) => {
    if (f !== 'aktif') onLeaveAktifFilter?.();
    setFilter(f);
  };
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const senarai = useMemo(() => {
    if (filter === 'aktif') return alerts.filter((a) => a.tahap !== 'rendah');
    if (filter === 'semua') return alerts;
    return alerts.filter((a) => a.kategori === filter);
  }, [alerts, filter]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setScanning(true);
    setTimeout(() => {
      const cropId = farmer.cropId ?? 'cili-merah';
      const pv = matchPlantVillageDiagnosis(cropId);
      if (pv) {
        setResult({
          penyakit: pv.nama,
          keyakinan: pv.isHealthy ? 88 + Math.floor(Math.random() * 10) : 76 + Math.floor(Math.random() * 20),
          tahap: pv.tahapRisiko,
          saranan: `${pv.tindakan} [PlantVillage: ${pv.plantVillageLabel}]`,
        });
      } else {
        setResult({
          penyakit: 'Tiada padanan PlantVillage',
          keyakinan: 70,
          tahap: 'rendah',
          saranan: 'Tanaman ini menggunakan data penyakit tempatan (MARDI/DOA). Teruskan pemantauan.',
        });
      }
      setScanning(false);
    }, 1800);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Amaran & Risiko"
        subtitle="Amaran awal cuaca, banjir, penyakit & perosak tanaman"
        sumber={alertsListSourceKind(meta.alerts)}
        hideOnMobile
      />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Image upload — semakan penyakit AI */}
        <section className="card overflow-hidden">
          <div className="bg-gradient-to-br from-agro-600 to-agro-500 p-4 text-white md:p-5">
            <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold md:text-base">
              <CameraIcon className="h-5 w-5" /> Semakan Awal Penyakit (AI)
              <DataSourceBadge kind="demo" className="!bg-white/20 !text-white ring-white/40" />
            </h2>
            <p className="mt-0.5 text-xs text-white/80 md:text-sm">
            Muat naik gambar — diagnosis rujuk PlantVillage & repositori {farmer.tanamanUtama}.
          </p>
          </div>
          <div className="p-4 md:p-5">
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
            {!preview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-agro-200 bg-agro-50 py-7 text-agro-600 transition-colors hover:border-agro-400 md:py-12"
              >
                <CameraIcon className="h-8 w-8 md:h-10 md:w-10" />
                <span className="text-sm font-semibold md:text-base">Ambil / Muat Naik Gambar</span>
                <span className="text-[11px] text-agro-900/50">JPG atau PNG · maks 10MB</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-xl">
                  <img src={preview} alt="Gambar tanaman" className="h-44 w-full object-cover md:h-64" />
                  {scanning && (
                    <div className="absolute inset-0 grid place-items-center bg-agro-900/40 text-white">
                      <div className="flex flex-col items-center gap-2">
                        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        <span className="text-xs font-semibold md:text-sm">Menganalisa imej…</span>
                      </div>
                    </div>
                  )}
                </div>
                {result && (
                  <div className="rounded-xl bg-agro-50 p-3 md:p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-agro-800 md:text-lg">{result.penyakit}</p>
                      <span className={cn('pill', levelStyles[result.tahap].bg, levelStyles[result.tahap].text)}>
                        {levelStyles[result.tahap].label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-agro-900/60 md:text-sm">Keyakinan model: {result.keyakinan}%</p>
                    <p className="mt-2 text-sm text-agro-700 md:text-base">💡 {result.saranan}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="w-full rounded-xl border border-agro-200 py-2 text-sm font-semibold text-agro-600"
                >
                  Gambar Lain
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 7-day forecast */}
        <section className="card p-4 md:p-5">
          <SectionTitle
            title="Ramalan 7 Hari · METMalaysia"
            sumber={weatherSourceKind(meta.weather)}
            className="mb-3"
          />
          <div className="-mx-1 flex gap-2 overflow-x-auto no-scrollbar pb-1 md:grid md:grid-cols-7 md:overflow-visible md:gap-2">
            {forecast.map((d) => (
              <div
                key={d.hari}
                className="flex min-w-[58px] flex-col items-center gap-1 rounded-xl bg-agro-50 px-2 py-2.5 md:min-w-0 md:py-3"
              >
                <span className="text-[11px] font-semibold text-agro-900/60">{d.hari}</span>
                <span className="text-xl md:text-2xl">{d.ikon}</span>
                <span className="text-xs font-bold text-agro-800">
                  {d.suhuMax}°<span className="font-normal text-agro-900/40">/{d.suhuMin}°</span>
                </span>
                <span className="text-[10px] text-sky-600">💧{d.hujan}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {filter === 'aktif' && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Memaparkan <span className="font-bold">{activeCount} amaran aktif</span> (tahap sederhana &
            tinggi) — sama seperti KPI di Utama.
          </p>
        )}
        <div className="flex flex-wrap gap-2 md:gap-3">
          {(
            [
              { id: 'aktif' as const, label: `Aktif (${activeCount})` },
              { id: 'semua' as const, label: 'Semua' },
              { id: 'cuaca' as const, label: kategoriLabel.cuaca },
              { id: 'banjir' as const, label: kategoriLabel.banjir },
              { id: 'penyakit' as const, label: kategoriLabel.penyakit },
              { id: 'perosak' as const, label: kategoriLabel.perosak },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterAndNotify(f.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors md:px-4 md:py-2 md:text-sm',
                filter === f.id ? 'bg-agro-600 text-white' : 'border border-agro-100 bg-white text-agro-700',
                f.id === 'aktif' && activeCount > 0 && filter !== 'aktif' && 'border-amber-300 text-amber-800'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <SectionTitle
        title="Senarai Amaran"
        subtitle="Setiap kad menunjukkan jenis sumber data"
        sumber={alertsListSourceKind(meta.alerts)}
        className="px-1"
      />

      {/* Alert list */}
      <section className="grid gap-3 md:grid-cols-2">
        {senarai.length === 0 && (
          <p className="card col-span-full p-4 text-center text-sm text-agro-900/55 md:p-6">
            Tiada amaran untuk penapis ini.
          </p>
        )}
        {senarai.map((a) => {
          const lv = levelStyles[a.tahap];
          return (
            <article
              key={a.id}
              className={cn(
                'card border-l-4 p-4 md:p-5',
                a.tahap === 'tinggi' ? 'border-l-rose-500' : a.tahap === 'sederhana' ? 'border-l-amber-400' : 'border-l-emerald-400'
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl md:text-3xl">{a.ikon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-agro-800 md:text-lg">{a.tajuk}</p>
                    <span className={cn('pill shrink-0', lv.bg, lv.text)}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', lv.dot)} />
                      {lv.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-agro-900/65 md:text-sm">{a.keterangan}</p>
                  <p className="mt-2 rounded-lg bg-agro-50 px-2.5 py-1.5 text-xs text-agro-700 md:text-sm">
                    ✅ <span className="font-semibold">Tindakan:</span>{' '}
                    {a.id === 'infobanjir-link' ? (
                      <a
                        href={INFOBANJIR_PORTAL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-agro-600 underline"
                      >
                        Buka portal InfoBanjir JPS
                      </a>
                    ) : (
                      a.tindakan
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-agro-900/40">{kategoriLabel[a.kategori]} · {a.masa}</p>
                    <DataSourceBadge kind={getAlertSourceKind(a)} />
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
