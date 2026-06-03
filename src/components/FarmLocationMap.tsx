import { useEffect, useState } from 'react';
import type { FarmProfile } from '../services/farmProfile';
import {
  buildOsmEmbedUrl,
  buildOsmExternalUrl,
  resolveFarmCoordinates,
  type MapCoordinates,
} from '../services/geocode';
import { cn } from '../lib/ui';

interface Props {
  farmer: Pick<FarmProfile, 'nama' | 'lokasi' | 'negeri' | 'keluasan' | 'lat' | 'lon'>;
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
}

const sourceLabel: Record<MapCoordinates['source'], string> = {
  gps: 'GPS peranti',
  preset: 'Peta rujukan bandar',
  nominatim: 'OpenStreetMap',
};

export default function FarmLocationMap({ farmer, className, compact, showHeader = true }: Props) {
  const [coords, setCoords] = useState<MapCoordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void resolveFarmCoordinates(farmer)
      .then((c) => {
        if (!cancelled) setCoords(c);
      })
      .catch(() => {
        if (!cancelled) setError('Gagal memuatkan peta');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [farmer.lokasi, farmer.negeri, farmer.lat, farmer.lon]);

  const height = compact ? 'h-40' : 'h-48 md:h-56';

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-agro-100 bg-agro-50/50', className)}>
      {showHeader && (
        <div className="border-b border-agro-100 bg-white px-3 py-2.5 md:px-4">
          <p className="text-xs font-bold uppercase tracking-wider text-agro-600">Lokasi Ladang</p>
          <p className="text-sm font-bold text-agro-800">
            {farmer.lokasi}, {farmer.negeri}
          </p>
          {coords && (
            <p className="mt-0.5 text-[11px] text-agro-900/50">
              {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}° · {sourceLabel[coords.source]}
            </p>
          )}
        </div>
      )}

      <div className={cn('relative w-full bg-agro-100', height)}>
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-agro-50/90 text-xs font-medium text-agro-700">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-agro-300 border-t-agro-600" />
            Memuatkan peta…
          </div>
        )}
        {error && !loading && (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-agro-700">{error}</div>
        )}
        {coords && !error && (
          <>
            <iframe
              title={`Peta ladang ${farmer.lokasi}`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={buildOsmEmbedUrl(coords.lat, coords.lon, compact ? 0.012 : 0.018)}
            />
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-full"
              aria-hidden
            >
              <span className="relative flex flex-col items-center">
                <span className="rounded-lg bg-agro-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                  🌾 {farmer.keluasan} ha
                </span>
                <span className="mt-0.5 h-3 w-3 rotate-45 bg-agro-600" />
              </span>
            </div>
          </>
        )}
      </div>

      {coords && (
        <div className="flex items-center justify-between gap-2 border-t border-agro-100 bg-white px-3 py-2 text-[11px] md:px-4">
          <span className="text-agro-900/50">© OpenStreetMap</span>
          <a
            href={buildOsmExternalUrl(coords.lat, coords.lon)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-agro-600 hover:text-agro-800"
          >
            Buka peta penuh ↗
          </a>
        </div>
      )}
    </div>
  );
}
