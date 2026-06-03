import FarmLocationMap from '../components/FarmLocationMap';
import PageHeader from '../components/PageHeader';
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { DropIcon, LeafIcon, MapPinIcon, TrendDownIcon, TrendUpIcon, WindIcon } from '../components/icons';
import type { NavigateOptions, TabId } from '../components/navConfig';
import { cn, formatRM, levelStyles } from '../lib/ui';
import Sparkline from '../components/Sparkline';
import MultiCropOverview from '../components/MultiCropOverview';
import DataSourceBadge from '../components/DataSourceBadge';
import { buildFarmAnalysis } from '../services/farmAnalysis';
import {
  alertsListSourceKind,
  marketPricesSourceKind,
  weatherSourceKind,
} from '../lib/dataSourceLabels';

interface Props {
  onNavigate: (tab: TabId, options?: NavigateOptions) => void;
}

export default function Home({ onNavigate }: Props) {
  const {
    farmer,
    cropPlan,
    currentWeather,
    forecast,
    alerts,
    marketPrices,
    soilSensor,
    ladangPlots,
    plotCalendars,
    cropRecommendations,
    supplyDemand,
    meta,
  } = useData();

  const activeAlertCount = alerts.filter((a) => a.tahap !== 'rendah').length;

  const analysisRingkas = useMemo(
    () =>
      buildFarmAnalysis({
        farmer,
        cropPlan,
        forecast,
        currentWeather,
        alerts,
        cropRecommendations,
        marketPrices,
        supplyDemand,
        ladangPlots,
      }),
    [
      farmer,
      cropPlan,
      forecast,
      currentWeather,
      alerts,
      cropRecommendations,
      marketPrices,
      supplyDemand,
      ladangPlots,
    ]
  );

  const healthColor =
    analysisRingkas.kesihatan.status === 'baik'
      ? 'text-emerald-600'
      : analysisRingkas.kesihatan.status === 'sederhana'
        ? 'text-amber-600'
        : 'text-rose-600';

  const desktopStats = [
    { label: 'Keluasan Ladang', value: `${farmer.keluasan} ha`, ikon: '🌾', tab: null as TabId | null },
    {
      label: 'Tanaman Aktif',
      value: ladangPlots.length ? `${ladangPlots.length} jenis` : cropPlan.fasaSemasa,
      ikon: '🥬',
      tab: 'kalendar' as TabId | null,
    },
    { label: 'Hari ke Tuaian', value: `${cropPlan.hariKeTuaian} hari`, ikon: '⏳', tab: 'kalendar' as TabId | null },
    {
      label: 'Amaran Aktif',
      value: `${activeAlertCount}`,
      ikon: '⚠️',
      tab: 'amaran' as TabId | null,
      amaranAktif: true,
    },
  ];

  const topAlert =
    alerts.find((a) => a.kategori === 'penyakit' || a.kategori === 'perosak') ?? alerts[0];
  const topPrice =
    marketPrices.find((m) => m.komoditi.toLowerCase().includes('cili')) ??
    marketPrices[0];
  const nextTask = useMemo(() => {
    if (plotCalendars.length) {
      const parseMs = (tarikh: string) => new Date(`${tarikh} 2026`).getTime();
      const upcoming = plotCalendars.flatMap((e) =>
        e.plan.tugasan
          .filter((t) => !t.selesai)
          .map((t) => ({ task: t, sayur: e.plot.nama.split('(')[0].trim() }))
      );
      upcoming.sort((a, b) => parseMs(a.task.tarikh) - parseMs(b.task.tarikh));
      return upcoming[0];
    }
    const t = cropPlan.tugasan.find((x) => !x.selesai);
    return t ? { task: t, sayur: cropPlan.tanaman } : undefined;
  }, [plotCalendars, cropPlan]);

  return (
    <div className="page-shell">
      <PageHeader
        title="Dashboard Pemantauan"
        subtitle="Ringkasan cuaca, tanaman, amaran & harga pasaran"
        sumber={['campuran', 'demo']}
        hideOnMobile
      />

      {/* Greeting + peta lokasi */}
      <div className="overflow-hidden rounded-2xl border border-agro-100 bg-white shadow-card md:grid md:grid-cols-2 md:gap-0">
        <div className="flex items-center justify-between gap-3 p-4 md:p-5">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-agro-900/60 md:text-base">Selamat pagi,</p>
            <h2 className="text-xl font-extrabold text-agro-800 md:text-2xl">{farmer.nama} 👋</h2>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-agro-900/60 md:text-sm">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
              {farmer.lokasi}, {farmer.negeri} · Ladang {farmer.keluasan} ha
            </p>
            {farmer.lat != null && (
              <p className="mt-1 text-[11px] text-agro-500">
                GPS: {farmer.lat.toFixed(4)}, {farmer.lon?.toFixed(4)}
              </p>
            )}
          </div>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-agro-100 text-2xl md:h-14 md:w-14 md:text-3xl">
            {farmer.avatar}
          </div>
        </div>
        <FarmLocationMap farmer={farmer} showHeader={false} className="rounded-none border-0 border-t border-agro-100 md:border-l md:border-t-0" />
      </div>

      {activeAlertCount > 0 && (
        <button
          type="button"
          onClick={() => onNavigate('amaran', { amaranAktif: true })}
          className="card flex w-full items-center justify-between border-amber-200 bg-amber-50/90 p-3 text-left md:hidden"
        >
          <span className="text-sm font-semibold text-amber-900">
            ⚠️ {activeAlertCount} amaran aktif — ketik untuk lihat
          </span>
          <span className="text-xs font-bold text-amber-700">→</span>
        </button>
      )}

      {/* Desktop KPI strip */}
      <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-4">
        {desktopStats.map((s) => {
          const clickable = s.tab != null && (s.label !== 'Amaran Aktif' || activeAlertCount > 0);
          const inner = (
            <>
              <span className="text-2xl">{s.ikon}</span>
              <div>
                <p className="text-[11px] font-semibold uppercase text-agro-900/45">{s.label}</p>
                <p className="text-lg font-extrabold text-agro-800">{s.value}</p>
                {s.label === 'Amaran Aktif' && activeAlertCount > 0 && (
                  <p className="text-[10px] font-semibold text-agro-600">Lihat amaran →</p>
                )}
              </div>
            </>
          );
          if (!clickable) {
            return (
              <div key={s.label} className="card flex items-center gap-3 p-4">
                {inner}
              </div>
            );
          }
          return (
            <button
              key={s.label}
              type="button"
              onClick={() =>
                onNavigate(s.tab!, s.amaranAktif ? { amaranAktif: true } : undefined)
              }
              className={cn(
                'card flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-agro-50/80',
                s.label === 'Amaran Aktif' && 'ring-2 ring-amber-200 hover:ring-amber-300'
              )}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {ladangPlots.length > 0 && (
        <MultiCropOverview plots={ladangPlots} title="Tanaman di Ladang (6 Blok)" sumber="demo" />
      )}

      <button
        type="button"
        onClick={() => onNavigate('analisis')}
        className="card flex w-full items-stretch justify-between gap-3 p-4 text-left transition-colors hover:bg-agro-50/60 md:p-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-title">Analisis Keputusan Ladang</p>
            <DataSourceBadge kind="campuran" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-lg bg-agro-50 px-2.5 py-1 text-xs font-bold', healthColor)}>
              Skor {analysisRingkas.kesihatan.keseluruhan}/100 · {analysisRingkas.kesihatan.status}
            </span>
            {analysisRingkas.ladangCampuran && (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Untung anggaran RM
                {analysisRingkas.ladangKewangan.untungBersih.toLocaleString('ms-MY')} ({analysisRingkas.blokAnalisis.length}{' '}
                blok)
              </span>
            )}
            {!analysisRingkas.ladangCampuran && analysisRingkas.rumusan.anggaranUntungRm != null && (
              <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Untung anggaran RM{analysisRingkas.rumusan.anggaranUntungRm.toLocaleString('ms-MY')}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-agro-900/65">
            {analysisRingkas.rumusan.cadangan[0] ??
              'Pemilihan tanaman, jadual ikut cuaca, risiko & pasaran — satu paparan'}
          </p>
          {analysisRingkas.ladangCampuran && analysisRingkas.penyakitPerBlok.length > 0 && (
            <p className="mt-1.5 text-xs text-agro-700/80">
              🦠 Penyakit: {analysisRingkas.penyakitAi.penyakit.split(' (')[0]} —{' '}
              {analysisRingkas.penyakitPerBlok.filter((b) => b.tahap !== 'rendah').length} blok pantau
            </p>
          )}
        </div>
        <span className="shrink-0 self-center text-2xl">📊</span>
      </button>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
        {/* Weather hero */}
        <button
          type="button"
          onClick={() => onNavigate('amaran')}
          className="block w-full overflow-hidden rounded-2xl bg-gradient-to-br from-agro-600 to-agro-500 p-4 text-left text-white shadow-card md:p-5 lg:col-span-7"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-white/70 md:text-sm">Cuaca Semasa</p>
                <DataSourceBadge kind={weatherSourceKind(meta.weather)} className="!bg-white/20 !text-white ring-white/40" />
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-extrabold leading-none md:text-5xl">{currentWeather.suhu}°</span>
                <span className="pb-1 text-sm font-medium text-white/90 md:text-base">{currentWeather.keadaan}</span>
              </div>
              <p className="mt-1 text-xs text-white/70 md:text-sm">{currentWeather.lokasi} · {currentWeather.dikemaskini}</p>
            </div>
            <span className="text-5xl md:text-6xl">{currentWeather.ikon}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1.5 md:px-3 md:py-2">
              <DropIcon className="h-4 w-4" /> {currentWeather.kelembapan}% lembap
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1.5 md:px-3 md:py-2">
              <WindIcon className="h-4 w-4" /> {currentWeather.angin} km/j
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-2 py-1.5 md:px-3 md:py-2">
              🌧️ {currentWeather.hujan}% hujan
            </div>
          </div>
          <div className="mt-3 flex justify-between gap-1 border-t border-white/15 pt-3 md:gap-2">
            {forecast.map((d) => (
              <div key={d.hari} className="flex flex-1 flex-col items-center gap-0.5">
                <span className="text-[11px] text-white/70 md:text-xs">{d.hari}</span>
                <span className="text-base md:text-lg">{d.ikon}</span>
                <span className="text-[11px] font-semibold md:text-xs">{d.suhuMax}°</span>
              </div>
            ))}
          </div>
        </button>

        {/* IoT tanah */}
        <div className="card p-4 md:p-5 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-title">Sensor IoT Tanah</span>
              <DataSourceBadge kind="demo" />
            </div>
            <span className="text-[10px] font-semibold text-agro-500">{soilSensor.sensorId}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-agro-900/50">{soilSensor.dikemaskini}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-lg bg-agro-50 p-2">
              <p className="text-[10px] text-agro-900/45">Lembap tanah</p>
              <p className="font-extrabold text-agro-700">{soilSensor.kelembapanTanah}%</p>
            </div>
            <div className="rounded-lg bg-agro-50 p-2">
              <p className="text-[10px] text-agro-900/45">pH</p>
              <p className="font-extrabold text-agro-700">{soilSensor.ph}</p>
            </div>
            <div className="rounded-lg bg-agro-50 p-2">
              <p className="text-[10px] text-agro-900/45">Paras air</p>
              <p className="font-extrabold text-agro-700">
                {soilSensor.parasAirSawah} {soilSensor.unitAir}
              </p>
            </div>
            <div className="rounded-lg bg-agro-50 p-2">
              <p className="text-[10px] text-agro-900/45">N-P-K</p>
              <p className="text-xs font-bold text-agro-700">
                {soilSensor.nitrogen}-{soilSensor.fosforus}-{soilSensor.kalium}
              </p>
            </div>
          </div>
          <p className="mt-2 text-xs text-agro-700">{soilSensor.nota}</p>
        </div>

        {/* Crop calendar summary */}
        <button
          type="button"
          onClick={() => onNavigate('kalendar')}
          className="card block w-full p-4 text-left md:p-5 lg:col-span-7"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-title">Kalendar Tanaman</span>
              <DataSourceBadge kind="rujukan" />
            </div>
            <span className="text-xs font-semibold text-agro-500">
              {ladangPlots.length ? `${ladangPlots.length} kalendar →` : 'Lihat semua →'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-agro-100 text-agro-600 md:h-14 md:w-14">
              <LeafIcon className="h-7 w-7 md:h-8 md:w-8" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-agro-800 md:text-lg">
                {cropPlan.tanaman} · {cropPlan.varieti}
              </p>
              <p className="text-xs text-agro-900/60 md:text-sm">
                {cropPlan.fasaSemasa} · tuaian terdekat {cropPlan.hariKeTuaian} hari
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-agro-100 md:h-2.5">
              <div className="h-full rounded-full bg-agro-500" style={{ width: `${cropPlan.peratusKemajuan}%` }} />
            </div>
            {nextTask && (
              <p className="mt-2 rounded-lg bg-agro-50 px-2.5 py-1.5 text-xs text-agro-700 md:text-sm">
                ⏭️ [{nextTask.sayur}] <span className="font-semibold">{nextTask.task.aktiviti}</span>
                {nextTask.task.catatan && (
                  <span className="text-agro-900/55"> · {nextTask.task.catatan}</span>
                )}
              </p>
            )}
          </div>
        </button>

        {/* Disease/pest alert */}
        <button
          type="button"
          onClick={() =>
            onNavigate('amaran', {
              amaranAktif: activeAlertCount > 0 || (topAlert?.tahap !== 'rendah' && !!topAlert),
            })
          }
          className="card block w-full p-4 text-left md:p-5 lg:col-span-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="section-title">Amaran Penyakit / Perosak</span>
              <DataSourceBadge kind={alertsListSourceKind(meta.alerts)} />
            </div>
            {topAlert ? (
              <span className={cn('pill', levelStyles[topAlert.tahap].bg, levelStyles[topAlert.tahap].text)}>
                <span className={cn('h-1.5 w-1.5 rounded-full', levelStyles[topAlert.tahap].dot)} />
                {levelStyles[topAlert.tahap].label}
              </span>
            ) : (
              <span className="pill bg-agro-100 text-agro-600">Memuatkan…</span>
            )}
          </div>
          <div className="mt-2 flex items-start gap-3">
            <span className="text-2xl md:text-3xl">{topAlert?.ikon ?? '🦠'}</span>
            <div>
              <p className="font-bold text-agro-800 md:text-lg">
                {topAlert?.tajuk ?? 'Memuatkan amaran cuaca & penyakit…'}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-agro-900/60 md:text-sm">
                {topAlert?.tindakan ?? 'Sila tunggu sambungan METMalaysia & repositori tanaman.'}
              </p>
            </div>
          </div>
        </button>

        {/* Market price */}
        {topPrice && (
          <button
            type="button"
            onClick={() => onNavigate('pasaran')}
            className="card block w-full p-4 text-left md:p-5 lg:col-span-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-title">Harga Hasil Tani</span>
                <DataSourceBadge kind={marketPricesSourceKind(meta.market)} />
              </div>
              <span className="text-xs font-semibold text-agro-500">Lihat pasaran →</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="font-bold text-agro-800 md:text-lg">{topPrice.komoditi}</p>
                <p className="text-lg font-extrabold text-agro-700 md:text-2xl">{formatRM(topPrice.harga, topPrice.unit)}</p>
                <p className="text-[11px] text-agro-900/50 md:text-xs">{topPrice.sumber} · {topPrice.pasar}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn('inline-flex items-center gap-1 text-sm font-bold md:text-base', topPrice.perubahan >= 0 ? 'text-emerald-600' : 'text-rose-500')}>
                  {topPrice.perubahan >= 0 ? <TrendUpIcon className="h-4 w-4" /> : <TrendDownIcon className="h-4 w-4" />}
                  {topPrice.perubahan >= 0 ? '+' : ''}{topPrice.perubahan}%
                </span>
                <Sparkline data={topPrice.sejarah} positive={topPrice.perubahan >= 0} width={96} height={32} />
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
