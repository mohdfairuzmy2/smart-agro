import { DATA_SOURCE, type DataSourceKind } from '../lib/dataSourceLabels';
import { cn } from '../lib/ui';

interface Props {
  kind: DataSourceKind;
  /** Saiz kecil untuk kad/list */
  size?: 'sm' | 'md';
  className?: string;
}

export default function DataSourceBadge({ kind, size = 'sm', className }: Props) {
  const m = DATA_SOURCE[kind];
  return (
    <span
      title={m.title}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full font-bold uppercase tracking-wide ring-1 ring-inset',
        m.className,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      {m.short}
    </span>
  );
}
