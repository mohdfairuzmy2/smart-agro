import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  HomeIcon,
  InfoIcon,
  MarketIcon,
  UserIcon,
} from './icons';

export type TabId =
  | 'utama'
  | 'kalendar'
  | 'amaran'
  | 'analisis'
  | 'pasaran'
  | 'profil'
  | 'info-sistem';

/** Tab utama — dipaparkan di telefon (nav bawah) dan desktop */
export const navTabs: { id: TabId; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'utama', label: 'Utama', Icon: HomeIcon },
  { id: 'kalendar', label: 'Kalendar', Icon: CalendarIcon },
  { id: 'amaran', label: 'Amaran', Icon: BellIcon },
  { id: 'analisis', label: 'Analisis', Icon: ChartIcon },
  { id: 'pasaran', label: 'Pasaran', Icon: MarketIcon },
  { id: 'profil', label: 'Profil', Icon: UserIcon },
];

/** Desktop sahaja — selepas Profil dalam sidebar */
export const desktopOnlyNavTabs: { id: TabId; label: string; Icon: typeof HomeIcon }[] = [
  { id: 'info-sistem', label: 'Info Sistem', Icon: InfoIcon },
];

export const sidebarNavTabs = [...navTabs, ...desktopOnlyNavTabs];

export interface NavigateOptions {
  /** Buka Amaran dengan penapis sederhana + tinggi sahaja */
  amaranAktif?: boolean;
}

export const tabTitles: Record<TabId, string> = {
  utama: 'SMART AGRO',
  kalendar: 'Kalendar Penanaman',
  amaran: 'Amaran & Risiko',
  analisis: 'Analisis Keputusan Ladang',
  pasaran: 'Harga Pasaran',
  profil: 'Profil Petani',
  'info-sistem': 'Info Sistem',
};

export const tabDescriptions: Record<TabId, string> = {
  utama: 'Dashboard pemantauan pertanian — cuaca, tanaman, amaran & harga',
  kalendar: 'Jadual pintar tanaman, siraman, baja & tuaian',
  amaran: 'Amaran awal cuaca, banjir, penyakit & perosak tanaman',
  analisis: 'Sokongan keputusan — tanaman, jadual, risiko, hasil & pasaran',
  pasaran: 'Harga FAMA, tapak jualan berhampiran & analitik permintaan-bekalan',
  profil: 'Maklumat ladang & cadangan tanaman mengikut kawasan',
  'info-sistem': 'Tujuan, modul, manfaat & sumber data SMART AGRO (desktop sahaja)',
};

/** Tab yang tidak dipaparkan pada telefon */
export const DESKTOP_ONLY_TABS: TabId[] = ['info-sistem'];

export function isDesktopOnlyTab(tab: TabId): boolean {
  return DESKTOP_ONLY_TABS.includes(tab);
}
