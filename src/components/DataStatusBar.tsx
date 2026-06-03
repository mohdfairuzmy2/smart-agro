import { useData } from '../context/DataContext';
import DataSourceLegend from './DataSourceLegend';
import { cn } from '../lib/ui';

export default function DataStatusBar() {
  const { meta, refresh } = useData();

  if (meta.loading) {
    return (
      <div className="border-b border-agro-100 bg-agro-100/80 px-4 py-2 text-center text-xs font-medium text-agro-700 md:px-6">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-agro-400 border-t-agro-700" />
          Memuatkan data METMalaysia, OpenDOSM…
        </span>
      </div>
    );
  }

  const badges = [
    { label: 'Cuaca', ok: meta.weather === 'live', hint: meta.weather },
    { label: 'Pasaran', ok: meta.market === 'fama' || meta.market === 'live', hint: meta.market },
    { label: 'Amaran', ok: meta.alerts === 'hybrid' || meta.alerts === 'live', hint: meta.alerts },
    { label: 'Kalendar', ok: meta.calendar === 'live', hint: 'live' },
    { label: 'Repositori', ok: meta.repository === 'live', hint: 'live' },
  ];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-[11px] md:px-6',
        meta.error ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-agro-100 bg-agro-50/90 text-agro-800'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Sumber data:</span>
        {badges.map((b) => (
          <span
            key={b.label}
            className={cn(
              'rounded-full px-2 py-0.5 font-semibold',
              b.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-agro-100 text-agro-600'
            )}
          >
            {b.label} {b.ok ? '● live' : `○ ${b.hint}`}
          </span>
        ))}
        {meta.lastSync && (
          <span className="text-agro-900/45">
            · {new Date(meta.lastSync).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => void refresh()}
        className="font-semibold text-agro-600 hover:text-agro-800"
      >
        Muat semula ↻
      </button>
      <p className="w-full text-agro-700/70">
        Data ladang: Haji Razali · 6 jenis sayur (cili, sawi, kangkung, bayam, terung, timun) · 2.4 ha
      </p>
      <DataSourceLegend />
      {meta.error && <p className="w-full text-amber-800">⚠️ {meta.error} — cuaca/pasaran live tidak tersedia; data demonstrasi penuh digunakan.</p>}
    </div>
  );
}
