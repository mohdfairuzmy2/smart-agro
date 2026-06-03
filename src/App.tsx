import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import DataStatusBar from './components/DataStatusBar';
import SidebarNav from './components/SidebarNav';
import { DataProvider, useData } from './context/DataContext';
import { LeafIcon } from './components/icons';
import {
  isDesktopOnlyTab,
  tabDescriptions,
  tabTitles,
  type NavigateOptions,
  type TabId,
} from './components/navConfig';
import Home from './screens/Home';
import Calendar from './screens/Calendar';
import Alerts from './screens/Alerts';
import Analysis from './screens/Analysis';
import Market from './screens/Market';
import Profile from './screens/Profile';
import SystemInfo from './screens/SystemInfo';

const mobileTitles: Partial<Record<TabId, string>> = {
  utama: 'SMART AGRO',
  kalendar: 'Kalendar',
  amaran: 'Amaran',
  analisis: 'Analisis',
  pasaran: 'Pasaran',
  profil: 'Profil',
};

const MD_BREAKPOINT = 768;

function AppShell() {
  const [tab, setTab] = useState<TabId>('utama');
  const [amaranAktifOnly, setAmaranAktifOnly] = useState(false);
  const { alerts } = useData();
  const activeAlerts = alerts.filter((a) => a.tahap !== 'rendah').length;

  const navigate = (next: TabId, options?: NavigateOptions) => {
    if (options?.amaranAktif) setAmaranAktifOnly(true);
    else if (next !== 'amaran') setAmaranAktifOnly(false);
    setTab(next);
  };

  useEffect(() => {
    const guardMobileTab = () => {
      if (window.innerWidth < MD_BREAKPOINT && isDesktopOnlyTab(tab)) {
        setTab('utama');
      }
    };
    guardMobileTab();
    window.addEventListener('resize', guardMobileTab);
    return () => window.removeEventListener('resize', guardMobileTab);
  }, [tab]);

  const mobileTitle = mobileTitles[tab] ?? tabTitles[tab];

  return (
    <div className="min-h-screen bg-agro-50 md:flex">
      <SidebarNav active={tab} onChange={navigate} alertCount={activeAlerts} />

      <div className="flex min-h-screen flex-1 flex-col md:min-w-0">
        {/* Mobile app bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-agro-100 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-agro-600 text-white">
              <LeafIcon className="h-5 w-5" />
            </span>
            <span className="text-base font-extrabold tracking-tight text-agro-700">{mobileTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('amaran', { amaranAktif: activeAlerts > 0 })}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-agro-50 text-agro-600"
            aria-label="Notifikasi"
          >
            🔔
            {activeAlerts > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-10 hidden items-center justify-between border-b border-agro-100 bg-white px-6 py-4 lg:px-8 md:flex">
          <div>
            <h1 className="text-xl font-extrabold text-agro-800 lg:text-2xl">{tabTitles[tab]}</h1>
            <p className="mt-0.5 text-sm text-agro-900/55">{tabDescriptions[tab]}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('amaran', { amaranAktif: activeAlerts > 0 })}
            className="relative flex items-center gap-2 rounded-xl border border-agro-100 bg-agro-50 px-4 py-2 text-sm font-semibold text-agro-700 transition-colors hover:bg-agro-100"
          >
            🔔 Notifikasi
            {activeAlerts > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {activeAlerts}
              </span>
            )}
          </button>
        </header>

        <DataStatusBar />

        <main className="flex-1 overflow-y-auto">
          {tab === 'utama' && <Home onNavigate={navigate} />}
          {tab === 'kalendar' && <Calendar />}
          {tab === 'amaran' && (
            <Alerts
              initialAktifOnly={amaranAktifOnly}
              onLeaveAktifFilter={() => setAmaranAktifOnly(false)}
            />
          )}
          {tab === 'analisis' && <Analysis />}
          {tab === 'pasaran' && <Market />}
          {tab === 'profil' && <Profile />}
          {tab === 'info-sistem' && (
            <div className="hidden md:block">
              <SystemInfo />
            </div>
          )}
        </main>

        <BottomNav active={tab} onChange={navigate} alertCount={activeAlerts} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  );
}
