import DataSourceBadge from './DataSourceBadge';
import type { DataSourceKind } from '../lib/dataSourceLabels';
import { cn } from '../lib/ui';

interface Props {
  title: string;
  subtitle?: string;
  sumber?: DataSourceKind | DataSourceKind[];
  className?: string;
  as?: 'h2' | 'h3';
}

export default function SectionTitle({ title, subtitle, sumber, className, as: Tag = 'h2' }: Props) {
  const kinds = sumber ? (Array.isArray(sumber) ? sumber : [sumber]) : [];

  return (
    <div className={cn('mb-1', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="section-title">{title}</Tag>
        {kinds.map((k) => (
          <DataSourceBadge key={k} kind={k} />
        ))}
      </div>
      {subtitle && <p className="mt-0.5 text-[11px] text-agro-900/45 md:text-xs">{subtitle}</p>}
    </div>
  );
}
