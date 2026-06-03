import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  getNearbySalesVenues,
  mapsSearchUrl,
  VENUE_JENIS_IKON,
  VENUE_JENIS_LABEL,
  type SalesVenue,
  type SalesVenueJenis,
} from '../data/nearbySalesVenues';
import DataSourceBadge from './DataSourceBadge';
import { cn } from '../lib/ui';
import { loadPickedVenueIds, togglePickedVenue } from '../services/salesVenuePrefs';

type FilterJenis = 'semua' | SalesVenueJenis;

export default function SalesVenuesPanel() {
  const { farmer, ladangPlots } = useData();
  const [filter, setFilter] = useState<FilterJenis>('semua');
  const [picked, setPicked] = useState<string[]>(() => loadPickedVenueIds());

  const venues = useMemo(() => getNearbySalesVenues(farmer), [farmer]);
  const filtered = useMemo(
    () => (filter === 'semua' ? venues : venues.filter((v) => v.jenis === filter)),
    [venues, filter]
  );
  const pickedVenues = useMemo(() => venues.filter((v) => picked.includes(v.id)), [venues, picked]);

  const tanamanRingkas = useMemo(() => {
    if (ladangPlots.length) {
      return ladangPlots.map((p) => p.nama.split('(')[0].trim()).join(', ');
    }
    return farmer.tanamanUtama;
  }, [ladangPlots, farmer.tanamanUtama]);

  const filters: { id: FilterJenis; label: string }[] = [
    { id: 'semua', label: 'Semua' },
    { id: 'pasar', label: VENUE_JENIS_LABEL.pasar },
    { id: 'pasar-tani', label: VENUE_JENIS_LABEL['pasar-tani'] },
    { id: 'pasaraya', label: VENUE_JENIS_LABEL.pasaraya },
  ];

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-agro-100 bg-agro-50/80 px-4 py-3 md:px-5">
        <h2 className="flex flex-wrap items-center gap-2 text-sm font-bold text-agro-800 md:text-base">
          <span className="text-xl">📍</span>
          Di Mana Nak Jual?
          <DataSourceBadge kind="demo" />
        </h2>
        <p className="mt-0.5 text-xs text-agro-900/55">
          Berhampiran {farmer.lokasi}, {farmer.negeri} · dari ladang anda ({farmer.noLot ?? `${farmer.keluasan} ha`})
        </p>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <p className="rounded-xl bg-agro-50 px-3 py-2 text-sm text-agro-800">
          <span className="font-semibold">Hasil ladang:</span> {tanamanRingkas}. Pilih tapak jualan untuk rancang
          logistik & banding harga runcit vs borong FAMA di bawah.
        </p>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                filter === f.id
                  ? 'bg-agro-600 text-white'
                  : 'bg-agro-100 text-agro-700 hover:bg-agro-200'
              )}
            >
              {f.id === 'semua' ? f.label : `${VENUE_JENIS_IKON[f.id as SalesVenueJenis]} ${f.label}`}
            </button>
          ))}
        </div>

        {pickedVenues.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
            <p className="text-xs font-bold uppercase text-emerald-800">Lokasi pilihan saya ({pickedVenues.length})</p>
            <ul className="mt-1.5 space-y-1 text-sm text-emerald-950">
              {pickedVenues.map((v) => (
                <li key={v.id}>
                  {VENUE_JENIS_IKON[v.jenis]} {v.nama} · {v.jarakKm} km
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((v) => (
            <VenueCard
              key={v.id}
              venue={v}
              isPicked={picked.includes(v.id)}
              onTogglePick={() => setPicked((prev) => togglePickedVenue(v.id, prev))}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-agro-900/50">Tiada tapak dalam kategori ini.</p>
        )}

        <p className="text-[11px] leading-relaxed text-agro-900/45">
          Data lokasi untuk demonstrasi (Kajang/Hulu Langat). Waktu operasi & harga petunjuk anggaran — sahkan dengan
          pihak pasar/pasaraya sebelum penghantaran.
        </p>
      </div>
    </section>
  );
}

function VenueCard({
  venue,
  isPicked,
  onTogglePick,
}: {
  venue: SalesVenue;
  isPicked: boolean;
  onTogglePick: () => void;
}) {
  return (
    <article
      className={cn(
        'rounded-xl border p-3.5 transition-colors',
        isPicked ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-300' : 'border-agro-100 bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-agro-600">
            {VENUE_JENIS_IKON[venue.jenis]} {VENUE_JENIS_LABEL[venue.jenis]}
          </p>
          <h3 className="font-bold text-agro-800">{venue.nama}</h3>
          <p className="mt-0.5 text-xs text-agro-900/55">{venue.alamat}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-agro-100 px-2 py-1 text-xs font-extrabold text-agro-700">
          {venue.jarakKm} km
        </span>
      </div>

      <dl className="mt-2.5 space-y-1 text-xs text-agro-800">
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-agro-600">Waktu:</dt>
          <dd>{venue.waktuOperasi}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-agro-600">Sesuai:</dt>
          <dd>{venue.komoditiSesuai.join(' · ')}</dd>
        </div>
        {venue.hargaPetunjuk && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-agro-600">Harga:</dt>
            <dd>{venue.hargaPetunjuk}</dd>
          </div>
        )}
      </dl>

      <p className="mt-2 text-xs leading-relaxed text-agro-900/65">{venue.nota}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onTogglePick}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-bold',
            isPicked ? 'bg-emerald-600 text-white' : 'bg-agro-100 text-agro-800 hover:bg-agro-200'
          )}
        >
          {isPicked ? '✓ Pilihan saya' : '+ Simpan pilihan'}
        </button>
        <a
          href={mapsSearchUrl(venue)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-agro-200 bg-white px-3 py-1.5 text-xs font-bold text-agro-700 hover:bg-agro-50"
        >
          Peta →
        </a>
        {venue.telefon && (
          <a
            href={`tel:${venue.telefon.replace(/\s/g, '')}`}
            className="rounded-lg border border-agro-200 bg-white px-3 py-1.5 text-xs font-bold text-agro-700 hover:bg-agro-50"
          >
            Hubungi
          </a>
        )}
      </div>
    </article>
  );
}
