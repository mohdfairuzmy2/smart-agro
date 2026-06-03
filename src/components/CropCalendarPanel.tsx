import type { CropPlan, CalendarTask } from '../data/types';
import type { LadangPlot } from '../services/farmProfile';
import { getCropById } from '../data/cropKnowledge/repository';
import { getDoaEntry } from '../data/cropKnowledge/imports/doaPerakMerge';
import SectionTitle from './SectionTitle';
import { cn } from '../lib/ui';

const taskMeta: Record<CalendarTask['jenis'], { ikon: string; warna: string }> = {
  baja: { ikon: '🧪', warna: 'bg-amber-100 text-amber-700' },
  siraman: { ikon: '💧', warna: 'bg-sky-100 text-sky-700' },
  racun: { ikon: '🛡️', warna: 'bg-rose-100 text-rose-700' },
  tuaian: { ikon: '🌾', warna: 'bg-agro-100 text-agro-700' },
  tanam: { ikon: '🌱', warna: 'bg-emerald-100 text-emerald-700' },
  pemantauan: { ikon: '👁️', warna: 'bg-violet-100 text-violet-700' },
};

interface Props {
  plot: LadangPlot;
  plan: CropPlan;
  tasks: CalendarTask[];
  onTasksChange: (tasks: CalendarTask[]) => void;
}

export default function CropCalendarPanel({ plot, plan, tasks, onTasksChange }: Props) {
  const crop = getCropById(plot.cropId);
  const doa = crop ? getDoaEntry(crop.id) : undefined;
  const akanDatang = tasks.filter((t) => !t.selesai);
  const selesai = tasks.filter((t) => t.selesai);

  const toggle = (idx: number) =>
    onTasksChange(tasks.map((t, i) => (i === idx ? { ...t, selesai: !t.selesai } : t)));

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="space-y-4">
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{plot.ikon}</span>
              <div>
                <p className="text-lg font-extrabold text-agro-800 md:text-xl">
                  {plan.tanaman} · {plan.varieti}
                </p>
                <p className="text-xs text-agro-900/60">
                  {plot.blok} · {plot.keluasanHa} ha · Ditanam {plan.tarikhTanam}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-agro-50 px-3 py-2 text-center">
              <p className="text-xl font-extrabold text-agro-600">{plan.hariKeTuaian}</p>
              <p className="text-[10px] font-semibold uppercase text-agro-900/50">hari ke tuaian</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs font-semibold text-agro-700 md:text-sm">
              <span>Fasa: {plan.fasaSemasa}</span>
              <span>{plan.peratusKemajuan}%</span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-agro-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-agro-400 to-agro-600"
                style={{ width: `${plan.peratusKemajuan}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-agro-700">{plot.catatan}</p>
        </div>

        <section className="card p-4 md:p-5">
          <SectionTitle title={`Fasa Tumbesaran — ${plot.nama}`} sumber="rujukan" className="mb-3" />
          <ol className="relative ml-3 space-y-4 border-l-2 border-agro-100">
            {plan.fasa.map((f) => (
              <li key={f.nama} className="relative pl-5">
                <span
                  className={cn(
                    'absolute -left-[9px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-white',
                    f.selesai ? 'bg-agro-500' : f.aktif ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-agro-200'
                  )}
                >
                  {f.selesai && <span className="text-[8px] text-white">✓</span>}
                </span>
                <p className={cn('text-sm font-semibold md:text-base', f.aktif ? 'text-amber-600' : 'text-agro-800')}>
                  {f.nama}
                  {f.aktif && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">
                      Semasa
                    </span>
                  )}
                </p>
                <p className="text-xs text-agro-900/55">{f.julatHari}</p>
              </li>
            ))}
          </ol>
        </section>

        {crop && crop.sop.length > 0 && (
          <section className="card p-4 md:p-5">
            <SectionTitle title={`SOP DOA — ${plot.nama}`} sumber="rujukan" className="mb-2" />
            {doa?.penyediaanTanah && (
              <p className="mb-2 text-xs text-agro-900/55">{doa.penyediaanTanah}</p>
            )}
            <ol className="space-y-2">
              {crop.sop.map((s) => (
                <li key={s.langkah} className="rounded-lg bg-agro-50 px-3 py-2 text-sm">
                  <span className="font-bold text-agro-700">
                    {s.langkah}. {s.tajuk}
                  </span>
                  <p className="text-xs text-agro-900/60">{s.keterangan}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="space-y-4">
        <section>
          <SectionTitle title="Tugasan Akan Datang" sumber="demo" className="mb-2 px-1" />
          <div className="space-y-2">
            {akanDatang.length === 0 && (
              <p className="card p-4 text-sm text-agro-900/55">Tiada tugasan tertunggak untuk {plot.nama}.</p>
            )}
            {akanDatang.map((t) => {
              const idx = tasks.indexOf(t);
              const meta = taskMeta[t.jenis];
              return (
                <div key={`${t.tarikh}-${t.aktiviti}`} className="card flex items-center gap-3 p-3 md:p-4">
                  <div className="flex w-12 flex-col items-center rounded-lg bg-agro-50 px-1 py-1.5 text-center">
                    <span className="text-[10px] font-semibold uppercase text-agro-900/50">
                      {t.tarikh.split(' ')[1]}
                    </span>
                    <span className="text-base font-extrabold leading-none text-agro-700">
                      {t.tarikh.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-agro-800 md:text-base">
                      <span className={cn('grid h-6 w-6 place-items-center rounded-md text-xs', meta.warna)}>
                        {meta.ikon}
                      </span>
                      {t.aktiviti}
                    </p>
                    {t.catatan && (
                      <p className="ml-7 text-xs text-agro-900/55 md:text-sm">{t.catatan}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className="grid h-6 w-6 place-items-center rounded-full border-2 border-agro-200 hover:border-agro-400 md:h-7 md:w-7"
                    aria-label="Tanda selesai"
                  />
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionTitle title="Selesai" sumber="demo" className="mb-2 px-1" />
          <div className="space-y-2">
            {selesai.map((t) => {
              const idx = tasks.indexOf(t);
              return (
                <div
                  key={`${t.tarikh}-${t.aktiviti}-done`}
                  className="card flex items-center gap-3 p-3 opacity-70 md:p-4"
                >
                  <div className="w-12 text-center text-xs font-semibold text-agro-900/50">{t.tarikh}</div>
                  <p className="flex-1 text-sm text-agro-900/60 line-through md:text-base">{t.aktiviti}</p>
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className="grid h-6 w-6 place-items-center rounded-full bg-agro-500 text-xs text-white md:h-7 md:w-7"
                    aria-label="Buka semula"
                  >
                    ✓
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
