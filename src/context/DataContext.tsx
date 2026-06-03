import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  buildDemoDataBundle,
  buildDemoLadangPlots,
  buildDemoTanamanAktif,
  buildCombinedCropPlan,
  buildPlotCalendarEntries,
  type PlotCalendarEntry,
} from '../data/demoScenario';
import type {
  DemoDataBundle,
  HarvestRecord,
  SoilSensorReading,
} from '../data/demoScenario';
import {
  buildCropPlan,
  buildDiseaseAlerts,
  getRepositoryMeta,
  recommendCrops,
  resolveCropIdFromLabel,
} from '../data/cropKnowledge/repository';
import type { CropRepositoryMeta } from '../data/cropKnowledge/types';
import type {
  Alert,
  CropPlan,
  CropRecommendation,
  CurrentWeather,
  ForecastDay,
  MarketPrice,
  PriceTrendPoint,
  SupplyDemand,
} from '../data/types';
import { buildFloodAndWeatherAlerts } from '../services/flood';
import {
  detectLocation,
  guessNegeri,
  loadFarmProfile,
  saveFarmProfile,
  type FarmProfile,
  type LadangPlot,
} from '../services/farmProfile';
import { fetchMarketPricesFromFama } from '../services/fama';
import {
  fetchCpiTrend,
  fetchMarketPricesFromCpi,
  fetchSupplyDemandFromCrops,
} from '../services/statistics';
import { loadWeatherBundle } from '../services/weather';

export interface DataMeta {
  weather: 'live' | 'mock' | 'demo';
  market: 'live' | 'mock' | 'fama' | 'hybrid' | 'demo';
  alerts: 'live' | 'hybrid' | 'mock' | 'demo';
  calendar: 'live';
  profile: 'local';
  repository: 'live';
  lastSync: string | null;
  error: string | null;
  loading: boolean;
}

interface DataContextValue {
  farmer: FarmProfile;
  currentWeather: CurrentWeather;
  forecast: ForecastDay[];
  cropPlan: CropPlan;
  alerts: Alert[];
  marketPrices: MarketPrice[];
  priceTrend: PriceTrendPoint[];
  supplyDemand: SupplyDemand[];
  cropRecommendations: CropRecommendation[];
  ladangPlots: LadangPlot[];
  plotCalendars: PlotCalendarEntry[];
  soilSensor: SoilSensorReading;
  harvestHistory: HarvestRecord[];
  repositoryMeta: CropRepositoryMeta;
  meta: DataMeta;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<FarmProfile>) => void;
  syncGps: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function planFromProfile(profile: FarmProfile): CropPlan {
  const cropId = profile.cropId ?? resolveCropIdFromLabel(profile.tanamanUtama);
  return buildCropPlan(cropId) ?? buildCropPlan('cili-merah')!;
}

function applyDemoBundle(
  bundle: DemoDataBundle,
  setters: {
    setFarmer: (f: FarmProfile) => void;
    setCurrentWeather: (w: CurrentWeather) => void;
    setForecast: (f: ForecastDay[]) => void;
    setCropPlan: (p: CropPlan) => void;
    setAlerts: (a: Alert[]) => void;
    setMarketPrices: (m: MarketPrice[]) => void;
    setPriceTrend: (t: PriceTrendPoint[]) => void;
    setSupplyDemand: (s: SupplyDemand[]) => void;
    setCropRecommendations: (c: CropRecommendation[]) => void;
    setLadangPlots: (p: LadangPlot[]) => void;
    setPlotCalendars: (c: PlotCalendarEntry[]) => void;
    setSoilSensor: (s: SoilSensorReading) => void;
    setHarvestHistory: (h: HarvestRecord[]) => void;
  }
) {
  setters.setFarmer(bundle.farmer);
  setters.setCurrentWeather(bundle.currentWeather);
  setters.setForecast(bundle.forecast);
  setters.setCropPlan(bundle.cropPlan);
  setters.setAlerts(bundle.alerts);
  setters.setMarketPrices(bundle.marketPrices);
  setters.setPriceTrend(bundle.priceTrend);
  setters.setSupplyDemand(bundle.supplyDemand);
  setters.setCropRecommendations(bundle.cropRecommendations);
  setters.setLadangPlots(bundle.ladangPlots);
  setters.setPlotCalendars(bundle.plotCalendars);
  setters.setSoilSensor(bundle.soilSensor);
  setters.setHarvestHistory(bundle.harvestHistory);
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [farmer, setFarmer] = useState<FarmProfile>(loadFarmProfile);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather>(() => ({
    suhu: 0,
    keadaan: '—',
    ikon: '⛅',
    kelembapan: 0,
    angin: 0,
    hujan: 0,
    lokasi: '—',
    dikemaskini: '—',
  }));
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [cropPlan, setCropPlan] = useState(() => planFromProfile(loadFarmProfile()));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [priceTrend, setPriceTrend] = useState<PriceTrendPoint[]>([]);
  const [supplyDemand, setSupplyDemand] = useState<SupplyDemand[]>([]);
  const [cropRecommendations, setCropRecommendations] = useState<CropRecommendation[]>([]);
  const [ladangPlots, setLadangPlots] = useState<LadangPlot[]>([]);
  const [plotCalendars, setPlotCalendars] = useState<PlotCalendarEntry[]>([]);
  const [soilSensor, setSoilSensor] = useState<SoilSensorReading>(() => ({
    sensorId: '—',
    lokasi: '—',
    dikemaskini: '—',
    kelembapanTanah: 0,
    suhuTanah: 0,
    ph: 0,
    konduktiviti: 0,
    nitrogen: 0,
    fosforus: 0,
    kalium: 0,
    parasAirSawah: 0,
    unitAir: 'cm',
    status: 'normal',
    nota: '',
  }));
  const [harvestHistory, setHarvestHistory] = useState<HarvestRecord[]>([]);
  const [meta, setMeta] = useState<DataMeta>({
    weather: 'demo',
    market: 'demo',
    alerts: 'demo',
    calendar: 'live',
    profile: 'local',
    repository: 'live',
    lastSync: null,
    error: null,
    loading: true,
  });

  const repositoryMeta = getRepositoryMeta();

  const setters = useMemo(
    () => ({
      setFarmer,
      setCurrentWeather,
      setForecast,
      setCropPlan,
      setAlerts,
      setMarketPrices,
      setPriceTrend,
      setSupplyDemand,
      setCropRecommendations,
      setLadangPlots,
      setPlotCalendars,
      setSoilSensor,
      setHarvestHistory,
    }),
    []
  );

  const refresh = useCallback(async () => {
    setMeta((m) => ({ ...m, loading: true, error: null }));
    const profile = loadFarmProfile();
    const cropId = profile.cropId ?? resolveCropIdFromLabel(profile.tanamanUtama);

    const demo = await buildDemoDataBundle(profile);
    applyDemoBundle(demo, setters);

    try {
      const weather = await loadWeatherBundle(profile.negeri, profile.lat, profile.lon);
      setCurrentWeather({
        ...demo.currentWeather,
        ...weather.current,
        lokasi: `${profile.lokasi}, ${profile.negeri}`,
        dikemaskini: weather.current.dikemaskini || demo.currentWeather.dikemaskini,
      });
      if (weather.forecast.length >= 5) {
        setForecast(weather.forecast);
      }

      const maxRain = Math.max(...weather.forecast.map((f) => f.hujan), weather.current.hujan, 0);
      const diseaseAlerts = buildDiseaseAlerts(cropId, {
        kelembapan: weather.current.kelembapan,
        hujanPct: maxRain,
      });
      const liveAlerts = buildFloodAndWeatherAlerts(profile.negeri, weather, diseaseAlerts);
      const demoIds = new Set(demo.alerts.map((a) => a.kategori + a.tajuk.slice(0, 12)));
      const merged = [
        ...demo.alerts,
        ...liveAlerts.filter((a) => !demoIds.has(a.kategori + a.tajuk.slice(0, 12))),
      ].slice(0, 8);
      setAlerts(merged.length ? merged : demo.alerts);

      const plots = profile.ladangPlots?.length ? profile.ladangPlots : buildDemoLadangPlots();
      setLadangPlots(plots);
      setPlotCalendars(buildPlotCalendarEntries(plots));
      setCropRecommendations(
        plots.length >= 2
          ? buildDemoTanamanAktif(profile.jenisTanah, profile.negeri)
          : recommendCrops({
              jenisTanah: profile.jenisTanah,
              negeri: profile.negeri,
              tanamanUtama: profile.tanamanUtama,
              maxRainPct: maxRain,
            })
      );

      const [trend, famaPrices, cpiPrices, supply] = await Promise.all([
        fetchCpiTrend(12),
        fetchMarketPricesFromFama(),
        fetchMarketPricesFromCpi(),
        fetchSupplyDemandFromCrops(),
      ]);

      setPriceTrend(trend.length ? trend : demo.priceTrend);
      setMarketPrices(
        famaPrices.length ? famaPrices : cpiPrices.length ? cpiPrices : demo.marketPrices
      );
      setSupplyDemand(supply.length ? supply : demo.supplyDemand);

      setCropPlan(
        plots.length >= 2 ? buildCombinedCropPlan(plots) : buildCropPlan(cropId) ?? demo.cropPlan
      );

      setMeta({
        weather: 'live',
        market: famaPrices.length ? 'fama' : cpiPrices.length ? 'hybrid' : 'demo',
        alerts: liveAlerts.length ? 'hybrid' : 'demo',
        calendar: 'live',
        profile: 'local',
        repository: 'live',
        lastSync: new Date().toISOString(),
        error: null,
        loading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal memuatkan data';
      applyDemoBundle(demo, setters);
      setMeta({
        weather: 'demo',
        market: 'fama',
        alerts: 'demo',
        calendar: 'live',
        profile: 'local',
        repository: 'live',
        lastSync: demo.syncedAt,
        error: msg,
        loading: false,
      });
    }
  }, [setters]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    (patch: Partial<FarmProfile>) => {
      setFarmer((prev) => {
        const next = {
          ...prev,
          ...patch,
          cropId:
            patch.cropId ??
            (patch.tanamanUtama ? resolveCropIdFromLabel(patch.tanamanUtama) : prev.cropId),
        };
        saveFarmProfile(next);
        if (patch.cropId || patch.tanamanUtama) {
          const id = next.cropId ?? resolveCropIdFromLabel(next.tanamanUtama);
          setCropPlan(buildCropPlan(id) ?? planFromProfile(next));
        }
        return next;
      });
    },
    []
  );

  const syncGps = useCallback(async () => {
    try {
      const { lat, lon } = await detectLocation();
      const negeri = guessNegeri(lat, lon);
      const next: FarmProfile = {
        ...loadFarmProfile(),
        lat,
        lon,
        negeri,
        lokasi: negeri,
      };
      saveFarmProfile(next);
      setFarmer(next);
      await refresh();
    } catch (e) {
      setMeta((m) => ({
        ...m,
        error: e instanceof Error ? e.message : 'GPS gagal',
      }));
    }
  }, [refresh]);

  const value = useMemo(
    () => ({
      farmer,
      currentWeather,
      forecast,
      cropPlan,
      alerts,
      marketPrices,
      priceTrend,
      supplyDemand,
      cropRecommendations,
      ladangPlots,
      plotCalendars,
      soilSensor,
      harvestHistory,
      repositoryMeta,
      meta,
      refresh,
      updateProfile,
      syncGps,
    }),
    [
      farmer,
      currentWeather,
      forecast,
      cropPlan,
      alerts,
      marketPrices,
      priceTrend,
      supplyDemand,
      cropRecommendations,
      ladangPlots,
      plotCalendars,
      soilSensor,
      harvestHistory,
      repositoryMeta,
      meta,
      refresh,
      updateProfile,
      syncGps,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData mesti dalam DataProvider');
  return ctx;
}
