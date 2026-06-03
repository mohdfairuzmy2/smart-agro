/**
 * Data sandaran — diselaraskan dengan demoScenario (operasi realistik).
 */
import {
  buildDemoAlerts,
  buildDemoFarmer,
  buildDemoPriceTrend,
  buildDemoSupplyDemand,
  buildDemoWeather,
} from './demoScenario';

const _farmer = buildDemoFarmer();
const _wx = buildDemoWeather(_farmer);

export const farmer = _farmer;
export const currentWeather = _wx.current;
export const forecast = _wx.forecast;
export const supplyDemand = buildDemoSupplyDemand();
export const priceTrend = buildDemoPriceTrend();
export const alerts = buildDemoAlerts('cili-merah', {
  kelembapan: _wx.current.kelembapan,
  maxRain: Math.max(..._wx.forecast.map((f) => f.hujan)),
});

export { buildDemoDataBundle, seedDemoProfileIfEmpty } from './demoScenario';

export const dataSources = [
  { nama: 'METMalaysia', peranan: 'Cuaca & ramalan 7 hari', ikon: '🌦️' },
  { nama: 'JPS InfoBanjir', peranan: 'Paras sungai & amaran banjir', ikon: '🌊' },
  { nama: 'Jabatan Pertanian (DOA)', peranan: 'Panduan agronomi negeri', ikon: '🏛️' },
  { nama: 'MARDI', peranan: 'Varieti & penyelidikan tanaman', ikon: '🔬' },
  { nama: 'FAMA / MyHargaTani', peranan: 'Harga pasar borong & tani', ikon: '🏷️' },
  { nama: 'OpenDOSM', peranan: 'Indeks harga pengeluar', ikon: '📊' },
  { nama: 'Sensor IoT Tanah', peranan: 'Kelembapan, pH, NPK, paras air', ikon: '📡' },
];
