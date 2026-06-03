import PageHeader from '../components/PageHeader';
import DataSourceBadge from '../components/DataSourceBadge';
import DataSourceLegend from '../components/DataSourceLegend';
import { dataSources } from '../data/mockData';
import {
  SYSTEM_CIRI,
  SYSTEM_MANFAAT,
  SYSTEM_MODUL,
  SYSTEM_DEMO_LIVE_URL,
  SYSTEM_NOTA_PROTOTAIP,
  SYSTEM_OBJEKTIF,
  SYSTEM_SUMBER_API,
  SYSTEM_TAGLINE,
  SYSTEM_TUJUAN,
} from '../content/systemInfo';
import type { DataSourceKind } from '../lib/dataSourceLabels';
import { cn } from '../lib/ui';

function InfoBlock({
  id,
  title,
  ikon,
  children,
}: {
  id: string;
  title: string;
  ikon: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card overflow-hidden scroll-mt-24">
      <div className="border-b border-agro-100 bg-agro-50/80 px-5 py-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-agro-800">
          <span className="text-xl">{ikon}</span>
          {title}
        </h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function SystemInfo() {
  const toc = [
    { id: 'tujuan', label: 'Tujuan' },
    { id: 'objektif', label: 'Objektif' },
    { id: 'modul', label: 'Modul' },
    { id: 'manfaat', label: 'Manfaat' },
    { id: 'ciri', label: 'Ciri-ciri Sistem' },
    { id: 'sumber', label: 'Sumber Data' },
  ];

  return (
    <div className="page-shell max-w-5xl">
      <PageHeader
        title="Info Sistem"
        subtitle="SMART AGRO — Inisiatif 3 · Platform Pintar Pertanian, Cuaca & Harga Pasaran"
        sumber="rujukan"
      />

      <div className="card border-2 border-agro-500 bg-gradient-to-br from-agro-800 to-agro-600 p-5 text-white md:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-white/70">Visi ringkas</p>
        <p className="mt-2 text-lg font-semibold italic md:text-xl">&ldquo;{SYSTEM_TAGLINE}&rdquo;</p>
        <p className="mt-3 text-sm text-white/85">{SYSTEM_NOTA_PROTOTAIP}</p>
        <a
          href={SYSTEM_DEMO_LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded-xl bg-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/30"
        >
          Buka demo live →
        </a>
      </div>

      <nav className="card flex flex-wrap gap-2 p-4">
        <span className="w-full text-xs font-bold uppercase text-agro-600">Navigasi halaman</span>
        {toc.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className="rounded-full bg-agro-100 px-3 py-1.5 text-xs font-bold text-agro-800 hover:bg-agro-200"
          >
            {t.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-5">
        <InfoBlock id="tujuan" title="Tujuan" ikon="🎯">
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-agro-900/80">
            {SYSTEM_TUJUAN.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </InfoBlock>

        <InfoBlock id="objektif" title="Objektif" ikon="📋">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-agro-900/80">
            {SYSTEM_OBJEKTIF.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </InfoBlock>

        <InfoBlock id="modul" title="Modul" ikon="🧩">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-agro-100 text-left text-[10px] uppercase text-agro-600">
                  <th className="py-2 pr-3">Modul</th>
                  <th className="py-2 pr-3">Skrin</th>
                  <th className="py-2">Fungsi</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_MODUL.map((m) => (
                  <tr key={m.nama} className="border-b border-agro-50">
                    <td className="py-2.5 pr-3 font-semibold text-agro-800">{m.nama}</td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-full bg-agro-100 px-2 py-0.5 text-xs font-bold text-agro-700">
                        {m.skrin}
                      </span>
                    </td>
                    <td className="py-2.5 text-agro-900/70">{m.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoBlock>

        <InfoBlock id="manfaat" title="Manfaat" ikon="✨">
          <ul className="space-y-3">
            {SYSTEM_MANFAAT.map((p, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-950"
              >
                <span className="font-bold text-emerald-600">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </InfoBlock>

        <InfoBlock id="ciri" title="Ciri-ciri Sistem" ikon="⚙️">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SYSTEM_CIRI.map((p, i) => (
              <li
                key={i}
                className="rounded-xl bg-agro-50 px-3 py-2.5 text-sm text-agro-800"
              >
                {p}
              </li>
            ))}
          </ul>
        </InfoBlock>

        <InfoBlock id="sumber" title="Sumber Data" ikon="📚">
          <div className="mb-4 rounded-xl border border-agro-100 bg-agro-50/80 p-3">
            <DataSourceLegend />
          </div>

          <h3 className="mb-2 text-sm font-bold text-agro-800">Integrasi API (MVP)</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-agro-100 text-left text-[10px] uppercase text-agro-600">
                  <th className="py-2 pr-2">Data</th>
                  <th className="py-2 pr-2">Sumber</th>
                  <th className="py-2 text-right">Label</th>
                </tr>
              </thead>
              <tbody>
                {SYSTEM_SUMBER_API.map((row) => (
                  <tr key={row.data} className="border-b border-agro-50">
                    <td className="py-2 pr-2 font-medium text-agro-800">{row.data}</td>
                    <td className="py-2 pr-2 text-agro-900/65">{row.sumber}</td>
                    <td className="py-2 text-right">
                      <DataSourceBadge kind={row.jenis as DataSourceKind} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 mt-5 text-sm font-bold text-agro-800">Agensi & peranan</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {dataSources.map((s) => (
              <div
                key={s.nama}
                className="flex items-center gap-3 rounded-xl border border-agro-100 bg-white p-3"
              >
                <span className="text-2xl">{s.ikon}</span>
                <div>
                  <p className="text-sm font-bold text-agro-800">{s.nama}</p>
                  <p className="text-xs text-agro-900/55">{s.peranan}</p>
                </div>
              </div>
            ))}
          </div>

          <p className={cn('mt-4 text-xs leading-relaxed text-agro-900/55')}>
            Versi teknikal: React 19, TypeScript, Vite, Tailwind CSS, Recharts. Dokumentasi lanjut:{' '}
            <code className="rounded bg-agro-100 px-1">README.md</code>,{' '}
            <code className="rounded bg-agro-100 px-1">docs/DATA_MATRIX.md</code>.
          </p>
        </InfoBlock>
      </div>
    </div>
  );
}
