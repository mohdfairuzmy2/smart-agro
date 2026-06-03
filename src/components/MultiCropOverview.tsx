import DataSourceBadge from './DataSourceBadge';
import type { DataSourceKind } from '../lib/dataSourceLabels';
import type { LadangPlot } from '../services/farmProfile';
import { cn } from '../lib/ui';

interface Props {
  plots: LadangPlot[];
  title?: string;
  compact?: boolean;
  sumber?: DataSourceKind;
}

export default function MultiCropOverview({ plots, title = 'Tanaman di Ladang', compact, sumber }: Props) {
  if (!plots.length) return null;

  return (
    <section className={cn(!compact && 'card p-4 md:p-5')}>
      <div className={cn('flex flex-wrap items-center gap-2', !compact && 'mb-3')}>
        <h2 className={cn('font-bold text-agro-800', compact ? 'text-sm' : 'section-title')}>{title}</h2>
        {sumber && <DataSourceBadge kind={sumber} />}
      </div>
      <p className={cn('text-agro-900/55', compact ? 'mb-2 text-[11px]' : 'mb-3 text-xs')}>
        Jumlah {plots.length} jenis · {plots.reduce((s, p) => s + p.keluasanHa, 0).toFixed(2)} ha
      </p>
      <div className={cn('grid gap-2', compact ? 'grid-cols-2 sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3')}>
        {plots.map((p) => (
          <div
            key={p.cropId}
            className="rounded-xl border border-agro-100 bg-agro-50/80 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{p.ikon}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-agro-600">
                {p.keluasanHa} ha
              </span>
            </div>
            <p className="mt-1 font-bold text-agro-800">{p.nama}</p>
            <p className="text-[10px] font-semibold text-agro-500">{p.blok}</p>
            <p className="mt-1 text-[11px] text-agro-900/60">{p.catatan}</p>
            <div className="mt-2">
              <div className="flex justify-between text-[10px] font-semibold text-agro-700">
                <span>{p.fasaSemasa}</span>
                <span>{p.peratusKemajuan}%</span>
              </div>
              <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-agro-100">
                <div
                  className="h-full rounded-full bg-agro-500"
                  style={{ width: `${p.peratusKemajuan}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-agro-900/45">Tuaian ~{p.hariKeTuaian} hari</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
