import { farmer } from '../data/mockData';
import { LeafIcon } from './icons';
import { desktopOnlyNavTabs, sidebarNavTabs, type TabId } from './navConfig';
import { cn } from '../lib/ui';

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount?: number;
}

export default function SidebarNav({ active, onChange, alertCount = 0 }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-agro-100 bg-white md:flex lg:w-72">
      <div className="border-b border-agro-100 px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-agro-600 text-white shadow-sm">
            <LeafIcon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-agro-800">SMART AGRO</p>
            <p className="text-[11px] font-medium text-agro-900/50">Platform Pintar Pertanian</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-agro-900/40">Menu Utama</p>
        <ul className="space-y-1">
          {sidebarNavTabs.map(({ id, label, Icon }) => {
            const isActive = active === id;
            const isDesktopExtra = desktopOnlyNavTabs.some((t) => t.id === id);
            return (
              <li key={id}>
                <button
                  onClick={() => onChange(id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-agro-600 text-white shadow-sm'
                      : 'text-agro-800 hover:bg-agro-50',
                    isDesktopExtra && !isActive && 'text-agro-700/90'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {id === 'amaran' && alertCount > 0 && (
                    <span
                      className={cn(
                        'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                        isActive ? 'bg-white/25 text-white' : 'bg-rose-500 text-white'
                      )}
                    >
                      {alertCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 px-3 text-[10px] leading-relaxed text-agro-900/40">
          Info Sistem hanya pada paparan desktop (≥768px).
        </p>
      </nav>

      <div className="border-t border-agro-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-agro-50 p-3">
          <span className="text-2xl">{farmer.avatar}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-agro-800">{farmer.nama}</p>
            <p className="truncate text-xs text-agro-900/55">
              {farmer.lokasi}, {farmer.negeri}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
