import { useEffect, useMemo, useState } from 'react';
import type { CalendarTask } from '../data/types';
import PageHeader from '../components/PageHeader';
import CropCalendarPanel from '../components/CropCalendarPanel';
import { useData } from '../context/DataContext';
import { getCropById } from '../data/cropKnowledge/repository';
import { cn } from '../lib/ui';

export default function Calendar() {
  const { cropPlan, farmer, plotCalendars } = useData();
  const multi = plotCalendars.length > 0;

  const [activeId, setActiveId] = useState(plotCalendars[0]?.plot.cropId ?? farmer.cropId ?? 'cili-merah');
  const [tasksByPlot, setTasksByPlot] = useState<Record<string, CalendarTask[]>>({});

  useEffect(() => {
    if (!multi) return;
    const map: Record<string, CalendarTask[]> = {};
    for (const entry of plotCalendars) {
      map[entry.plot.cropId] = [...entry.plan.tugasan];
    }
    setTasksByPlot(map);
    setActiveId((prev) => (map[prev] ? prev : plotCalendars[0]?.plot.cropId ?? prev));
  }, [plotCalendars, multi]);

  const [singleTasks, setSingleTasks] = useState(cropPlan.tugasan);
  useEffect(() => {
    if (!multi) setSingleTasks(cropPlan.tugasan);
  }, [cropPlan, multi]);

  const activeEntry = useMemo(
    () => plotCalendars.find((e) => e.plot.cropId === activeId) ?? plotCalendars[0],
    [plotCalendars, activeId]
  );

  const crop = getCropById(farmer.cropId ?? 'cili-merah');

  return (
    <div className="page-shell">
      <PageHeader
        title="Kalendar Penanaman Pintar"
        subtitle={
          multi
            ? 'Jadual berasingan mengikut jenis sayur — MARDI + DOA Perak'
            : 'Jadual aktiviti — MARDI myAgriManager + DOA Perak'
        }
        sumber={multi ? ['rujukan', 'demo'] : 'rujukan'}
        hideOnMobile
      />

      {multi ? (
        <>
          <div className="card p-3 md:p-4">
            <p className="mb-2 text-xs font-semibold text-agro-900/55">
              Pilih sayur untuk lihat fasa & tugasan khusus tanaman itu
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plotCalendars.map(({ plot, plan }) => (
                <button
                  key={plot.cropId}
                  type="button"
                  onClick={() => setActiveId(plot.cropId)}
                  className={cn(
                    'flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors min-w-[88px]',
                    activeId === plot.cropId
                      ? 'border-agro-500 bg-agro-50 ring-2 ring-agro-300'
                      : 'border-agro-100 bg-white hover:bg-agro-50'
                  )}
                >
                  <span className="text-2xl">{plot.ikon}</span>
                  <span className="mt-0.5 text-[11px] font-bold text-agro-800 leading-tight">
                    {plot.nama.split('(')[0].trim()}
                  </span>
                  <span className="text-[10px] text-agro-500">{plot.blok}</span>
                  <span className="mt-1 text-[10px] font-semibold text-agro-600">{plan.fasaSemasa}</span>
                </button>
              ))}
            </div>
          </div>

          {activeEntry && (
            <CropCalendarPanel
              plot={activeEntry.plot}
              plan={activeEntry.plan}
              tasks={tasksByPlot[activeEntry.plot.cropId] ?? activeEntry.plan.tugasan}
              onTasksChange={(tasks) =>
                setTasksByPlot((prev) => ({ ...prev, [activeEntry.plot.cropId]: tasks }))
              }
            />
          )}
        </>
      ) : (
        crop && (
          <CropCalendarPanel
            plot={{
              cropId: crop.id,
              nama: crop.nama,
              ikon: crop.ikon,
              keluasanHa: farmer.keluasan,
              blok: 'Ladang',
              fasaSemasa: cropPlan.fasaSemasa,
              peratusKemajuan: cropPlan.peratusKemajuan,
              hariKeTuaian: cropPlan.hariKeTuaian,
              catatan: farmer.jenisTanah,
            }}
            plan={cropPlan}
            tasks={singleTasks}
            onTasksChange={setSingleTasks}
          />
        )
      )}
    </div>
  );
}
