import { useState } from 'react';
import FarmLocationMap from '../components/FarmLocationMap';
import MultiCropOverview from '../components/MultiCropOverview';
import PageHeader from '../components/PageHeader';
import SectionTitle from '../components/SectionTitle';
import DataSourceBadge from '../components/DataSourceBadge';
import { useData } from '../context/DataContext';
import { dataSources } from '../data/mockData';
import { getPlantVillageLabelsForCrop } from '../data/cropKnowledge/imports/plantVillageMerge';
import { getDoaEntry } from '../data/cropKnowledge/imports/doaPerakMerge';
import { getGeotanihEntry, getGeotanihSoilScore } from '../data/cropKnowledge/imports/geotanihMerge';
import { getMardiEntry } from '../data/cropKnowledge/imports/mardiMerge';
import { getUpmEntry } from '../data/cropKnowledge/imports/upmSayurMerge';
import { getFamaPriceForCrop } from '../services/fama';
import { getAllCrops, getCropById } from '../data/cropKnowledge/repository';
import { NEGERI_TO_MET_STATE_ID } from '../config/locations';
import { cn, levelStyles } from '../lib/ui';

const negeriList = Object.keys(NEGERI_TO_MET_STATE_ID).filter(
  (k) => !k.startsWith('WP ') && k !== 'Kuala Lumpur' && k !== 'Putrajaya' && k !== 'Labuan'
);

export default function Profile() {
  const {
    farmer,
    cropRecommendations,
    ladangPlots,
    harvestHistory,
    repositoryMeta,
    meta,
    updateProfile,
    syncGps,
    refresh,
  } = useData();
  const allCrops = getAllCrops();
  const activeCrop = getCropById(farmer.cropId ?? 'cili-merah');
  const upmEntry = activeCrop ? getUpmEntry(activeCrop.id) : undefined;
  const doaEntry = activeCrop ? getDoaEntry(activeCrop.id) : undefined;
  const mardiEntry = activeCrop ? getMardiEntry(activeCrop.id) : undefined;
  const geoEntry = activeCrop ? getGeotanihEntry(activeCrop.id) : undefined;
  const famaEntry = activeCrop ? getFamaPriceForCrop(activeCrop.id) : null;
  const geoSkor =
    activeCrop && farmer.jenisTanah ? getGeotanihSoilScore(activeCrop.id, farmer.jenisTanah) : null;
  const [draft, setDraft] = useState({
    nama: farmer.nama,
    lokasi: farmer.lokasi,
    negeri: farmer.negeri,
    keluasan: farmer.keluasan,
    jenisTanah: farmer.jenisTanah,
    tanamanUtama: farmer.tanamanUtama,
    cropId: farmer.cropId ?? 'cili-merah',
  });
  const [showRepo, setShowRepo] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const save = () => {
    const crop = getCropById(draft.cropId);
    updateProfile({
      ...draft,
      tanamanUtama: crop ? `${crop.nama}` : draft.tanamanUtama,
    });
    void refresh();
  };

  const onGps = async () => {
    setGpsLoading(true);
    await syncGps();
    setDraft((d) => ({ ...d, negeri: farmer.negeri, lokasi: farmer.lokasi }));
    setGpsLoading(false);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Profil Petani"
        subtitle="Maklumat ladang & cadangan tanaman mengikut kawasan"
        sumber={['demo', 'rujukan']}
        hideOnMobile
      />

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
        <section className="card overflow-hidden lg:col-span-4">
          <div className="bg-gradient-to-br from-agro-700 to-agro-500 px-4 pb-5 pt-5 text-white md:px-6 md:pt-6">
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 text-4xl md:h-20 md:w-20 md:text-5xl">{farmer.avatar}</div>
              <div>
                <h2 className="text-lg font-extrabold md:text-xl">{farmer.nama}</h2>
                <p className="text-sm text-white/80">{farmer.lokasi}, {farmer.negeri}</p>
                {farmer.noPetani && (
                  <p className="mt-1 text-[11px] text-white/75">No. Petani: {farmer.noPetani}</p>
                )}
                {farmer.noLot && <p className="text-[11px] text-white/70">{farmer.noLot}</p>}
                {farmer.lat != null && (
                  <p className="mt-1 text-[11px] text-white/70">
                    GPS: {farmer.lat.toFixed(4)}, {farmer.lon?.toFixed(4)}
                  </p>
                )}
                <span className="mt-1 inline-flex flex-wrap items-center gap-1.5">
                  <DataSourceBadge kind="demo" className="!bg-white/20 !text-white ring-white/40" />
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                    {meta.profile === 'local' ? 'Disimpan tempatan' : '—'}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-agro-100">
            <div className="px-2 py-3 text-center md:py-4">
              <p className="text-lg font-extrabold text-agro-700 md:text-xl">{farmer.keluasan}</p>
              <p className="text-[10px] uppercase text-agro-900/50">Hektar</p>
            </div>
            <div className="px-2 py-3 text-center md:py-4">
              <p className="text-sm font-extrabold leading-tight text-agro-700 md:text-base">
                {ladangPlots.length ? `${ladangPlots.length} jenis` : farmer.tanamanUtama.split(' ')[0]}
              </p>
              <p className="text-[10px] uppercase text-agro-900/50">Sayur di Ladang</p>
            </div>
            <div className="px-2 py-3 text-center md:py-4">
              <p className="text-sm font-bold leading-tight text-agro-700">{farmer.jenisTanah}</p>
              <p className="text-[10px] uppercase text-agro-900/50">Jenis Tanah</p>
            </div>
          </div>
          <FarmLocationMap farmer={farmer} className="rounded-none border-0 border-t border-agro-100" />
        </section>

        <section className="card space-y-3 p-4 lg:col-span-8 md:p-5">
          <SectionTitle title="Kemaskini Ladang" sumber="demo" />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-xs font-semibold text-agro-800">
              Nama
              <input
                className="input-field"
                value={draft.nama}
                onChange={(e) => setDraft({ ...draft, nama: e.target.value })}
              />
            </label>
            <label className="block text-xs font-semibold text-agro-800">
              Lokasi / Bandar
              <input
                className="input-field"
                value={draft.lokasi}
                onChange={(e) => setDraft({ ...draft, lokasi: e.target.value })}
              />
            </label>
            <label className="block text-xs font-semibold text-agro-800">
              Negeri (METMalaysia)
              <select
                className="input-field"
                value={draft.negeri}
                onChange={(e) => setDraft({ ...draft, negeri: e.target.value })}
              >
                {[...new Set([...negeriList, 'Selangor', 'Wilayah Persekutuan Kuala Lumpur'])].sort().map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-agro-800">
              Keluasan (ha)
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={draft.keluasan}
                onChange={(e) => setDraft({ ...draft, keluasan: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label className="block text-xs font-semibold text-agro-800 md:col-span-2">
              Jenis Tanah
              <input
                className="input-field"
                value={draft.jenisTanah}
                onChange={(e) => setDraft({ ...draft, jenisTanah: e.target.value })}
              />
            </label>
            <label className="block text-xs font-semibold text-agro-800 md:col-span-2">
              Fokus analisis (satu jenis · ladang ada 6 sayur)
              <select
                className="input-field"
                value={draft.cropId}
                onChange={(e) => {
                  const crop = getCropById(e.target.value);
                  setDraft({
                    ...draft,
                    cropId: e.target.value,
                    tanamanUtama: crop?.nama ?? draft.tanamanUtama,
                  });
                }}
              >
                {allCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ikon} {c.nama} · {c.tempohMatangHari.min}–{c.tempohMatangHari.max} hari
                  </option>
                ))}
              </select>
            </label>
          </div>
          {activeCrop && (
            <div className="space-y-1 text-xs text-agro-900/55">
              <p>
                Sumber: {activeCrop.sumber.map((s) => s.label).join(' · ')} · {activeCrop.penyakit.length} penyakit
              </p>
              {upmEntry && (
                <p className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-800">
                  ✓ UPM: tempoh matang {upmEntry.tempohMatangHari.min}–{upmEntry.tempohMatangHari.max} hari
                  {upmEntry.hariSemaianSebelumLadang ? ` · semai ${upmEntry.hariSemaianSebelumLadang} hari` : ''}
                </p>
              )}
              {doaEntry && (
                <p className="rounded-lg bg-sky-50 px-2 py-1 text-sky-800">
                  ✓ DOA Perak: {doaEntry.sop.length} langkah SOP · {doaEntry.jarakTanam}
                </p>
              )}
              {mardiEntry && (
                <p className="rounded-lg bg-amber-50 px-2 py-1 text-amber-900">
                  ✓ MARDI: {mardiEntry.tugasan.length} aktiviti jadual
                  {mardiEntry.varieti ? ` · ${mardiEntry.varieti}` : ''}
                </p>
              )}
              {geoEntry && (
                <p className="rounded-lg bg-teal-50 px-2 py-1 text-teal-800">
                  ✓ GeoTanih: {geoEntry.tanahSesuai.length} tanah sesuai
                  {geoSkor != null ? ` · skor ${geoSkor}% (${farmer.jenisTanah})` : ''}
                </p>
              )}
              {famaEntry && (
                <p className="rounded-lg bg-orange-50 px-2 py-1 text-orange-900">
                  ✓ FAMA: RM{famaEntry.hargaRm}/{famaEntry.unit} · {famaEntry.pasar}
                </p>
              )}
              {getPlantVillageLabelsForCrop(activeCrop.id).length > 0 && (
                <p className="rounded-lg bg-violet-50 px-2 py-1 text-violet-800">
                  ✓ PlantVillage: {getPlantVillageLabelsForCrop(activeCrop.id).length} kelas diimport
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-xl bg-agro-600 px-4 py-2 text-sm font-semibold text-white hover:bg-agro-700"
            >
              Simpan & muat semula cuaca
            </button>
            <button
              type="button"
              onClick={() => void onGps()}
              disabled={gpsLoading}
              className="rounded-xl border border-agro-200 bg-white px-4 py-2 text-sm font-semibold text-agro-700 hover:bg-agro-50 disabled:opacity-60"
            >
              {gpsLoading ? 'Mengesan GPS…' : '📍 Gunakan lokasi GPS'}
            </button>
          </div>
        </section>

        <div className="space-y-4 lg:col-span-12">
          <section>
            {ladangPlots.length > 0 && (
              <MultiCropOverview plots={ladangPlots} title="Blok Tanaman Semasa" sumber="demo" />
            )}

            <SectionTitle title="Senarai Tanaman Aktif di Ladang" sumber={['rujukan', 'demo']} className="mb-1 px-1" />
            <p className="mb-3 px-1 text-xs text-agro-900/55">
              Cili, sawi, kangkung, bayam, terung & timun — tanah liat berlumpur, Kajang
            </p>
            <p className="mb-2 px-1 text-[11px] text-agro-900/50 md:text-xs">
              Skor kesesuaian (GeoTanih/DOA + cuaca METMalaysia) — {repositoryMeta.jumlahTanaman} tanaman dalam repositori.
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              {cropRecommendations.map((c) => (
                <div key={c.nama} className="card p-3.5 md:p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-agro-50 text-2xl">{c.ikon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-agro-800">{c.nama}</p>
                        <span className="text-sm font-extrabold text-agro-600">{c.kesesuaian}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-agro-100">
                        <div
                          className={cn('h-full rounded-full', c.kesesuaian >= 85 ? 'bg-agro-500' : c.kesesuaian >= 75 ? 'bg-agro-400' : 'bg-amber-400')}
                          style={{ width: `${c.kesesuaian}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded-lg bg-agro-50 px-1 py-1.5">
                      <p className="text-agro-900/45">Matang</p>
                      <p className="font-semibold text-agro-700">{c.tempohMatang}</p>
                    </div>
                    <div className="rounded-lg bg-agro-50 px-1 py-1.5">
                      <p className="text-agro-900/45">Anggaran</p>
                      <p className="font-semibold text-agro-700">{c.anggaranHasil}</p>
                    </div>
                    <div className="rounded-lg bg-agro-50 px-1 py-1.5">
                      <p className="text-agro-900/45">Permintaan</p>
                      <p className={cn('font-semibold', levelStyles[c.permintaan].text)}>{levelStyles[c.permintaan].label}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-agro-900/60 md:text-sm">💡 {c.catatan}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-4 md:p-5">
            <SectionTitle title="Rekod Hasil & Pendapatan (3 Musim)" sumber="demo" className="mb-3" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] text-sm">
                <thead>
                  <tr className="border-b border-agro-100 text-left text-[10px] uppercase text-agro-600">
                    <th className="py-2 pr-2">Musim</th>
                    <th className="py-2 pr-2">Tanaman</th>
                    <th className="py-2 text-right">Hasil</th>
                    <th className="py-2 text-right">tan/ha</th>
                    <th className="py-2 text-right">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {harvestHistory.map((h) => (
                    <tr key={h.musim} className="border-b border-agro-50">
                      <td className="py-2.5 font-semibold text-agro-800">{h.musim}</td>
                      <td className="py-2.5 text-agro-900/70">{h.tanaman}</td>
                      <td className="py-2.5 text-right font-bold">{h.hasilTan} tan</td>
                      <td className="py-2.5 text-right">{h.hasilTanHa}</td>
                      <td className="py-2.5 text-right text-emerald-700">
                        RM{h.pendapatanRm.toLocaleString('ms-MY')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {harvestHistory[0] && (
              <p className="mt-2 text-xs text-agro-900/55">💡 {harvestHistory[0].catatan}</p>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="card p-4 md:p-5">
              <SectionTitle title="Sumber Data Utama" sumber="rujukan" className="mb-3" />
              <div className="grid grid-cols-2 gap-2">
                {dataSources.map((s) => (
                  <div key={s.nama} className="flex items-center gap-2 rounded-xl bg-agro-50 p-2.5">
                    <span className="text-xl">{s.ikon}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-agro-800">{s.nama}</p>
                      <p className="truncate text-[10px] text-agro-900/50">{s.peranan}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-agro-900/50">
                MVP aktif: METMalaysia, OpenDOSM, FAMA/DOA/MARDI/GeoTanih import, Repo v{repositoryMeta.versi}.
              </p>
              <button
                type="button"
                onClick={() => setShowRepo(!showRepo)}
                className="mt-2 text-xs font-semibold text-agro-600"
              >
                {showRepo ? 'Sembunyikan' : 'Lihat'} senarai {repositoryMeta.jumlahTanaman} tanaman →
              </button>
              {showRepo && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-agro-100 bg-white p-2 text-[11px] text-agro-800">
                  {allCrops.map((c) => (
                    <div key={c.id} className="border-b border-agro-50 py-1 last:border-0">
                      {c.ikon} <span className="font-semibold">{c.nama}</span> — {c.kategori} · {c.tempohMatangHari.min}–{c.tempohMatangHari.max} hari
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card p-4 md:p-5">
              <h2 className="section-title mb-2">Potensi Peluasan</h2>
              <div className="flex flex-wrap gap-2">
                {['🤖 AI Diagnosis', '📡 IoT Sensor Tanah ✓', '🛒 Marketplace', '💳 e-Wallet Subsidi', '🚁 Pemantauan Dron'].map((t) => (
                  <span key={t} className="rounded-full border border-agro-200 bg-white px-3 py-1.5 text-xs font-semibold text-agro-700">{t}</span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <p className="pt-1 text-center text-[11px] text-agro-900/40 md:text-left">
        SMART AGRO · Inisiatif 3 — Platform Pintar Pertanian
      </p>
    </div>
  );
}
