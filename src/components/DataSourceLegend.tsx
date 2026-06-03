import { DATA_SOURCE, type DataSourceKind } from '../lib/dataSourceLabels';

const ORDER: DataSourceKind[] = ['live', 'rujukan', 'demo', 'campuran'];

export default function DataSourceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-agro-100/80 pt-2">
      <span className="text-[10px] font-semibold text-agro-900/50">Maksud label:</span>
      {ORDER.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 text-[10px] text-agro-800" title={DATA_SOURCE[k].title}>
          <span
            className={`rounded-full px-1.5 py-px font-bold uppercase ${DATA_SOURCE[k].className}`}
          >
            {DATA_SOURCE[k].short}
          </span>
          <span className="text-agro-900/55">{DATA_SOURCE[k].label.replace('Data ', '')}</span>
        </span>
      ))}
    </div>
  );
}
