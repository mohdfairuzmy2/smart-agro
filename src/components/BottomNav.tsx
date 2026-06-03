import { navTabs, type TabId } from './navConfig';
import { cn } from '../lib/ui';

export type { TabId };

interface Props {
  active: TabId;
  onChange: (tab: TabId) => void;
  alertCount?: number;
}

export default function BottomNav({ active, onChange, alertCount = 0 }: Props) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-agro-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-nav backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {navTabs.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                className={cn(
                  'relative flex w-full flex-col items-center gap-1 rounded-xl py-1.5 transition-colors',
                  isActive ? 'text-agro-600' : 'text-agro-900/45 hover:text-agro-500'
                )}
              >
                <span className="relative">
                  <Icon className={cn('h-6 w-6', isActive && 'scale-105 transition-transform')} />
                  {id === 'amaran' && alertCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {alertCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-semibold leading-tight">{label}</span>
                {isActive && <span className="absolute -bottom-2 h-1 w-8 rounded-full bg-agro-500" />}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
