import { useMemo } from 'react';
import DataSourceBadge from '../components/DataSourceBadge';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';
import type { DataSourceKind } from '../lib/dataSourceLabels';
import { buildFarmAnalysis } from '../services/farmAnalysis';
import type { AlertLevel } from '../data/types';
import { cn, levelStyles } from '../lib/ui';

const tahapDot: Record<AlertLevel, string> = {
  rendah: '🟢',
  sederhana: '🟡',
  tinggi: '🔴',
};

function RiskBadge({ tahap }: { tahap: AlertLevel }) {
  return (
    <span className={cn('inline-flex items-center gap-1 font-bold', levelStyles[tahap].text)}>
      {tahapDot[tahap]} {levelStyles[tahap].label}
    </span>
  );
}

function Section({
  title,
  subtitle,
  ikon,
  sumber,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  ikon: string;
  sumber?: DataSourceKind | DataSourceKind[];
  children: React.ReactNode;
  className?: string;
}) {
  const kinds = sumber ? (Array.isArray(sumber) ? sumber : [sumber]) : [];

  return (
    <section className={cn('card overflow-hidden', className)}>
      <div className="border-b border-agro-100 bg-agro-50/80 px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-agro-800 md:text-base">
            <span className="text-xl">{ikon}</span>
            {title}
          </h2>
          <div className="flex flex-wrap gap-1">
            {kinds.map((k) => (
              <DataSourceBadge key={k} kind={k} />
            ))}
          </div>
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-agro-900/55">{subtitle}</p>}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </section>
  );
}

export default function Analysis() {
  const ctx = useData();
  const report = useMemo(
    () =>
      buildFarmAnalysis({
        farmer: ctx.farmer,
        cropPlan: ctx.cropPlan,
        forecast: ctx.forecast,
        currentWeather: ctx.currentWeather,
        alerts: ctx.alerts,
        cropRecommendations: ctx.cropRecommendations,
        marketPrices: ctx.marketPrices,
        supplyDemand: ctx.supplyDemand,
        ladangPlots: ctx.ladangPlots,
      }),
    [ctx]
  );

  const healthColor =
    report.kesihatan.status === 'baik'
      ? 'text-emerald-600'
      : report.kesihatan.status === 'sederhana'
        ? 'text-amber-600'
        : 'text-rose-600';

  return (
    <div className="page-shell">
      <PageHeader
        title="Analisis Keputusan Ladang"
        subtitle={
          report.ladangCampuran
            ? 'Ladang campuran — data cuaca, tanah, pasaran & anggaran per blok (2.4 ha)'
            : 'Sokongan keputusan harian & strategik'
        }
        sumber="campuran"
        hideOnMobile
      />

      {/* Rumusan */}
      <section className="card overflow-hidden border-2 border-agro-500 bg-gradient-to-br from-agro-800 to-agro-600 p-4 text-white md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-white/70">Rumusan SMART AGRO</p>
          <DataSourceBadge kind="campuran" className="!bg-white/15 !text-white ring-white/30" />
        </div>
        <p className="mt-2 text-sm text-white/85">
          {ctx.farmer.nama} · {ctx.farmer.lokasi}, {ctx.farmer.negeri} · {report.dikemaskini}
        </p>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-white/60">Tanaman:</span> {report.rumusan.tanaman}
          </p>
          <p>
            <span className="text-white/60">Fasa:</span> {report.rumusan.fasa}
          </p>
          <p>
            <span className="text-white/60">Risiko:</span> {report.rumusan.risiko}
          </p>
          <p>
            <span className="text-white/60">Harga pasaran:</span> {report.rumusan.hargaPasaran}
          </p>
          {report.rumusan.anggaranUntungRm != null && (
            <p className="sm:col-span-2">
              <span className="text-white/60">Untung anggaran ladang:</span>{' '}
              <span className="font-bold">RM{report.rumusan.anggaranUntungRm.toLocaleString('ms-MY')}</span>
              {report.ladangCampuran && (
                <span className="text-white/70"> (jumlah {report.blokAnalisis.length} blok)</span>
              )}
            </p>
          )}
        </div>
        <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm font-medium">
          {report.rumusan.cadangan.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>
      </section>

      {/* Skor kesihatan */}
      <Section
        title="Skor Kesihatan Ladang"
        subtitle="Cuaca MET · tanah GeoTanih · penyakit · pasaran FAMA"
        ikon="💚"
        sumber="campuran"
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="text-center sm:pr-6">
            <p className={cn('text-4xl font-extrabold md:text-5xl', healthColor)}>
              {tahapDot[report.kesihatan.status === 'baik' ? 'rendah' : report.kesihatan.status === 'sederhana' ? 'sederhana' : 'tinggi']}{' '}
              {report.kesihatan.keseluruhan}%
            </p>
            <p className={cn('text-lg font-bold', healthColor)}>({report.kesihatan.statusLabel})</p>
          </div>
          <div className="flex-1 w-full">
            <table className="w-full text-sm">
              <tbody>
                {report.kesihatan.faktor.map((f) => (
                  <tr key={f.nama} className="border-b border-agro-50 last:border-0">
                    <td className="py-2 pr-2">
                      {f.ikon} {f.nama}
                    </td>
                    <td className="py-2 text-right font-bold text-agro-700">{f.skor}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-agro-50 px-3 py-2 text-sm text-agro-800">
          <span className="font-semibold">Cadangan:</span> {report.kesihatan.cadangan}
        </p>
      </Section>

      {/* Per blok */}
      {report.ladangCampuran && (
        <Section
          title="Analisis Per Blok Tanaman"
          subtitle="6 jenis sayur — fasa, tuaian & anggaran untung setiap blok"
          ikon="🥬"
          sumber="demo"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.blokAnalisis.map((b) => (
              <div key={b.blok} className="rounded-xl border border-agro-100 bg-agro-50/80 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{b.ikon}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-agro-600">
                    {b.keluasanHa} ha
                  </span>
                </div>
                <p className="mt-1 font-bold text-agro-800">{b.nama}</p>
                <p className="text-[10px] font-semibold text-agro-500">{b.blok}</p>
                <p className="mt-2 text-xs text-agro-700">
                  {b.fasaSemasa} · tuaian ~{b.hariKeTuaian} hari
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-agro-100">
                  <div className="h-full bg-agro-500" style={{ width: `${b.peratusKemajuan}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-1 text-[11px]">
                  <div>
                    <p className="text-agro-900/45">Pendapatan</p>
                    <p className="font-bold text-agro-700">
                      RM{b.kewangan.pendapatan.toLocaleString('ms-MY')}
                    </p>
                  </div>
                  <div>
                    <p className="text-agro-900/45">Untung angg.</p>
                    <p className="font-bold text-emerald-700">
                      RM{b.kewangan.untungBersih.toLocaleString('ms-MY')}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-agro-900/50">
                  Hasil {b.kewangan.hasilTan} tan · RM{b.hargaRm}/{b.hargaUnit}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Jumlah ladang */}
      <Section
        title="Ringkasan Kewangan Ladang"
        subtitle={report.ladangKewangan.nota}
        ikon="💰"
        sumber="rujukan"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-agro-50 p-4 text-center">
            <p className="text-xs text-agro-900/50">Jumlah pendapatan</p>
            <p className="text-xl font-extrabold text-agro-800">
              RM{report.ladangKewangan.jumlahPendapatan.toLocaleString('ms-MY')}
            </p>
          </div>
          <div className="rounded-xl bg-agro-50 p-4 text-center">
            <p className="text-xs text-agro-900/50">Jumlah kos</p>
            <p className="text-xl font-extrabold text-agro-800">
              RM{report.ladangKewangan.jumlahKos.toLocaleString('ms-MY')}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-xs text-emerald-800/70">Untung bersih (anggaran)</p>
            <p className="text-xl font-extrabold text-emerald-800">
              RM{report.ladangKewangan.untungBersih.toLocaleString('ms-MY')}
            </p>
          </div>
        </div>

        {report.ladangCampuran && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-agro-100 text-left text-[10px] uppercase text-agro-600">
                  <th className="py-2">Blok</th>
                  <th className="py-2">Tanaman</th>
                  <th className="py-2 text-right">ha</th>
                  <th className="py-2 text-right">Hasil</th>
                  <th className="py-2 text-right">Pendapatan</th>
                  <th className="py-2 text-right">Kos</th>
                  <th className="py-2 text-right">Untung</th>
                </tr>
              </thead>
              <tbody>
                {report.blokAnalisis.map((b) => (
                  <tr key={b.blok} className="border-b border-agro-50">
                    <td className="py-2 font-semibold">{b.blok}</td>
                    <td className="py-2">
                      {b.ikon} {b.nama}
                    </td>
                    <td className="py-2 text-right">{b.keluasanHa}</td>
                    <td className="py-2 text-right">{b.kewangan.hasilTan} tan</td>
                    <td className="py-2 text-right">RM{b.kewangan.pendapatan.toLocaleString('ms-MY')}</td>
                    <td className="py-2 text-right">RM{b.kewangan.jumlahKos.toLocaleString('ms-MY')}</td>
                    <td className="py-2 text-right font-bold text-emerald-700">
                      RM{b.kewangan.untungBersih.toLocaleString('ms-MY')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-agro-50 font-bold">
                  <td className="py-2.5" colSpan={2}>
                    Jumlah ladang
                  </td>
                  <td className="py-2.5 text-right">{report.ladangKewangan.keluasanHa}</td>
                  <td className="py-2.5 text-right">{report.ladangKewangan.jumlahHasilTan} tan</td>
                  <td className="py-2.5 text-right">
                    RM{report.ladangKewangan.jumlahPendapatan.toLocaleString('ms-MY')}
                  </td>
                  <td className="py-2.5 text-right">
                    RM{report.ladangKewangan.jumlahKos.toLocaleString('ms-MY')}
                  </td>
                  <td className="py-2.5 text-right text-emerald-800">
                    RM{report.ladangKewangan.untungBersih.toLocaleString('ms-MY')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Cuaca & Risiko Bencana" subtitle="Matriks risiko berwarna" ikon="⚠️" sumber="campuran">
          <div className="mb-3 flex flex-wrap gap-3 text-xs font-semibold">
            <span>{tahapDot.rendah} Rendah</span>
            <span>{tahapDot.sederhana} Sederhana</span>
            <span>{tahapDot.tinggi} Tinggi</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-agro-100 text-left text-xs uppercase text-agro-600">
                <th className="py-2">Risiko</th>
                <th className="py-2 text-right">Tahap</th>
              </tr>
            </thead>
            <tbody>
              {report.matriksRisiko.map((r) => (
                <tr key={r.risiko} className="border-b border-agro-50">
                  <td className="py-2.5">
                    {r.ikon} {r.risiko}
                  </td>
                  <td className="py-2.5 text-right">
                    <RiskBadge tahap={r.tahap} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Peluang Pasaran" subtitle="FAMA · permintaan vs bekalan" ikon="📈" sumber={['rujukan', 'live']}>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
            <p className="text-xs font-bold uppercase text-violet-800">
              Peluang: {report.peluangPasaran.peluangLabel}
            </p>
            <p className="mt-1 text-sm text-violet-900">{report.peluangPasaran.permintaanTrend}</p>
            <p className="text-sm text-violet-900">{report.peluangPasaran.bekalanTrend}</p>
            <p className="mt-2 text-sm font-medium text-violet-950">{report.peluangPasaran.cadangan}</p>
          </div>
        </Section>

        <Section
          title="Penyakit & Perosak"
          subtitle={
            report.penyakitPerBlok.length
              ? 'AI per blok · cuaca MET + repositori MARDI/PlantVillage'
              : 'Sahkan di Amaran atau muat naik gambar'
          }
          ikon="🦠"
          sumber={['rujukan', 'campuran']}
        >
          {report.penyakitPerBlok.length > 0 ? (
            <>
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                <span className="font-semibold">Keutamaan ladang:</span> {report.penyakitAi.penyakit} —{' '}
                {report.penyakitAi.cadangan}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {report.penyakitPerBlok.map((b) => (
                  <div
                    key={b.blok}
                    className={cn(
                      'rounded-xl border p-3 text-sm',
                      b.tahap === 'tinggi'
                        ? 'border-rose-200 bg-rose-50/60'
                        : b.tahap === 'sederhana'
                          ? 'border-amber-200 bg-amber-50/50'
                          : 'border-agro-100 bg-agro-50/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-agro-600">{b.blok}</p>
                        <p className="font-bold text-agro-800">{b.namaTanaman}</p>
                      </div>
                      <RiskBadge tahap={b.tahap} />
                    </div>
                    <p className="mt-2 font-semibold text-agro-800">{b.penyakit}</p>
                    <p className="mt-0.5 text-xs text-agro-900/55">
                      Ketepatan {b.ketepatanPct}% · {b.sumber}
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-agro-900/70">{b.simptom}</p>
                    <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-xs font-medium text-agro-800">
                      {b.cadangan}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Penyakit:</span> {report.penyakitAi.penyakit}
              </p>
              <p>
                <span className="font-semibold">Ketepatan:</span> {report.penyakitAi.ketepatanPct}%
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Tahap:</span>
                <RiskBadge tahap={report.penyakitAi.tahap} />
              </p>
              <p className="rounded-xl bg-amber-50 px-3 py-2 font-medium text-amber-900">
                {report.penyakitAi.cadangan}
              </p>
            </div>
          )}
        </Section>

        {!report.ladangCampuran && (
          <Section title="Kematangan Tanaman" ikon="🌾" sumber="demo">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-agro-50 p-3">
                <p className="text-[10px] uppercase text-agro-900/45">Umur</p>
                <p className="text-xl font-extrabold text-agro-700">{report.kematangan.umurHari} hari</p>
              </div>
              <div className="rounded-xl bg-agro-50 p-3">
                <p className="text-[10px] uppercase text-agro-900/45">Tuaian</p>
                <p className="text-xl font-extrabold text-agro-700">{report.kematangan.hariKeTuaian} hari</p>
              </div>
            </div>
          </Section>
        )}
      </div>

      {/* What-If */}
      <Section
        title="Apa Jika — Pusingan Musim Seterusnya"
        subtitle={`Bukan tukar seluruh ladang · ${report.whatIfTerbaik}`}
        ikon="🔀"
        sumber="rujukan"
      >
        <p className="mb-4 text-sm text-agro-900/65">
          Setiap senario hanya melibatkan <span className="font-semibold">satu blok</span> ({' '}
          {report.ladangCampuran ? '0.3–0.6 ha' : `${ctx.farmer.keluasan} ha`}). Ladang lain kekal seperti semasa.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {report.whatIf.map((s) => (
            <div
              key={s.id}
              className={cn(
                'rounded-xl border p-4',
                s.disyorkan ? 'border-agro-500 bg-agro-50 ring-2 ring-agro-300' : 'border-agro-100 bg-white'
              )}
            >
              <p className="text-[10px] font-bold uppercase text-agro-600">{s.blok}</p>
              <p className="mt-1 font-bold text-agro-800">{s.tanaman}</p>
              <p className="text-xs text-agro-600">{s.keluasanHa} ha · {s.nota}</p>
              <p className="mt-2">
                Risiko: <RiskBadge tahap={s.risiko} />
              </p>
              <p className="mt-2 text-xs text-agro-900/55">
                Pendapatan RM{s.pendapatanRm.toLocaleString('ms-MY')} − Kos RM{s.kosRm.toLocaleString('ms-MY')}
              </p>
              <p className="text-lg font-extrabold text-emerald-700">
                Untung: RM{s.anggaranUntungRm.toLocaleString('ms-MY')}
              </p>
              {s.disyorkan && (
                <span className="mt-2 inline-block rounded-full bg-agro-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Disyorkan
                </span>
              )}
            </div>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Trend Musim" ikon="📆" sumber="rujukan">
          <ul className="space-y-3">
            {report.trendMusim.map((t) => (
              <li key={t.tempoh} className="rounded-lg bg-agro-50 px-3 py-2">
                <p className="font-bold text-agro-800">{t.tempoh}</p>
                <ul className="mt-1 list-disc pl-4 text-sm text-agro-900/70">
                  {t.nota.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Perbandingan Kawasan" subtitle="Rujukan tan/ha · Selangor" ikon="🗺️" sumber="rujukan">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-agro-100 text-left text-xs uppercase text-agro-600">
                <th className="py-2">Kawasan</th>
                <th className="py-2 text-right">Hasil</th>
              </tr>
            </thead>
            <tbody>
              {report.perbandinganKawasan.map((k) => (
                <tr
                  key={k.kawasan}
                  className={cn(
                    'border-b border-agro-50',
                    k.kawasan.toLowerCase().includes(ctx.farmer.lokasi.toLowerCase()) && 'bg-agro-50/80'
                  )}
                >
                  <td className="py-2">{k.kawasan}</td>
                  <td className="py-2 text-right font-bold">{k.hasilTanHa} tan/ha</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>

      <Section title="Tanaman Aktif di Ladang" subtitle="Bukan cadangan baru — sedang diusahakan" ikon="🌱" sumber="demo">
        <p className="text-sm text-agro-900/75">{report.tanaman.naratif}</p>
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          {report.tanaman.cadanganUtama}
        </p>
        {report.tanaman.alternatif.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {report.tanaman.alternatif.map((c) => (
              <li
                key={c.cropId ?? c.nama}
                className="flex justify-between rounded-lg border border-agro-100 bg-white px-3 py-2 text-sm"
              >
                <span>
                  {c.ikon} {c.nama}
                </span>
                <span className="text-xs text-agro-600">{c.catatan}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
