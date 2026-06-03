import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import SalesVenuesPanel from '../components/SalesVenuesPanel';
import SectionTitle from '../components/SectionTitle';
import { useData } from '../context/DataContext';
import { marketPricesSourceKind } from '../lib/dataSourceLabels';
import { TrendDownIcon, TrendUpIcon } from '../components/icons';
import { cn, formatRM } from '../lib/ui';
import Sparkline from '../components/Sparkline';

export default function Market() {
  const { farmer, marketPrices, priceTrend, supplyDemand, meta } = useData();
  const hargaSumber =
    meta.market === 'fama' ? 'FAMA (import)' : meta.market === 'hybrid' ? 'OpenDOSM' : 'Mock / sandaran';

  return (
    <div className="page-shell">
      <PageHeader
        title="Harga Pasaran Hasil Tani"
        subtitle={`Harga FAMA · lokasi jualan berhampiran ${farmer.lokasi} · trend & permintaan`}
        sumber={['rujukan', 'live', 'demo']}
        hideOnMobile
      />

      <SalesVenuesPanel />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* Price trend chart */}
        <section className="card p-4 md:p-5">
        <SectionTitle
          title="Trend Indeks Harga Pengguna (CPI)"
          subtitle="OpenDOSM / DOSM · 12 bulan terakhir"
          sumber="live"
          className="mb-3"
        />
          <div className="h-44 md:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceTrend} margin={{ top: 5, right: 5, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="padiArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3a7b18" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3a7b18" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dcefca" vertical={false} />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#3a7b18' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['dataMin - 30', 'dataMax + 30']} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #dcefca', fontSize: 12 }}
                formatter={(v) => [`Indeks ${v}`, 'CPI']}
              />
              <Area type="monotone" dataKey="padi" name="CPI" stroke="#3a7b18" strokeWidth={2.5} fill="url(#padiArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Supply & demand analytics */}
        <section className="card p-4 md:p-5">
          <SectionTitle
            title="Analitik Permintaan & Bekalan"
            subtitle="Indeks relatif (0–100) · pengeluaran DOSM crops_state"
            sumber="live"
            className="mb-3"
          />
          <div className="h-52 md:h-56 lg:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplyDemand} margin={{ top: 5, right: 5, left: -22, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dcefca" vertical={false} />
                <XAxis dataKey="komoditi" tick={{ fontSize: 11, fill: '#3a7b18' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #dcefca', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="permintaan" name="Permintaan" fill="#3a7b18" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bekalan" name="Bekalan" fill="#94cf66" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5 rounded-xl bg-agro-50 p-3 text-xs text-agro-700 md:text-sm">
            <p>📈 <span className="font-semibold">Cili & Padi</span> — permintaan melebihi bekalan. Peluang harga baik.</p>
            <p>📉 <span className="font-semibold">Tomato</span> — bekalan berlebihan, harga berisiko turun.</p>
          </div>
        </section>
      </div>

      {/* Price list */}
      <section>
        <SectionTitle
          title="Harga Komoditi Terkini"
          subtitle={`Sumber harga: ${hargaSumber}`}
          sumber={marketPricesSourceKind(meta.market)}
          className="mb-2 px-1"
        />
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {marketPrices.map((p) => {
            const naik = p.perubahan >= 0;
            return (
              <div key={p.komoditi} className="card flex items-center gap-3 p-3.5 md:p-4">
                <div className="flex-1">
                  <p className="font-bold text-agro-800 md:text-lg">{p.komoditi}</p>
                  <p className="text-[11px] text-agro-900/50 md:text-xs">{p.gred} · {p.pasar}</p>
                  <p className="mt-0.5 text-base font-extrabold text-agro-700 md:text-lg">{formatRM(p.harga, p.unit)}</p>
                </div>
                <Sparkline data={p.sejarah} positive={naik} width={80} height={28} />
                <span className={cn('inline-flex w-16 items-center justify-end gap-0.5 text-sm font-bold', naik ? 'text-emerald-600' : 'text-rose-500')}>
                  {naik ? <TrendUpIcon className="h-4 w-4" /> : <TrendDownIcon className="h-4 w-4" />}
                  {naik ? '+' : ''}{p.perubahan}%
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
