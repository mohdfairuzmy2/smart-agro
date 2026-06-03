import DataSourceBadge from './DataSourceBadge';
import type { DataSourceKind } from '../lib/dataSourceLabels';

interface Props {
  title: string;
  subtitle?: string;
  /** Label sumber data peringkat halaman */
  sumber?: DataSourceKind | DataSourceKind[];
  /** Sembunyikan pada mobile jika header app bar sudah memaparkan tajuk ringkas */
  hideOnMobile?: boolean;
}

export default function PageHeader({ title, subtitle, sumber, hideOnMobile }: Props) {
  const kinds = sumber ? (Array.isArray(sumber) ? sumber : [sumber]) : [];

  return (
    <header className={hideOnMobile ? 'page-header hidden md:block' : 'page-header'}>
      <div className="flex flex-wrap items-center gap-2">
        <h1>{title}</h1>
        {kinds.map((k) => (
          <DataSourceBadge key={k} kind={k} size="md" />
        ))}
      </div>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}
