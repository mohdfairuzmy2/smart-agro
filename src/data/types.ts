export type AlertLevel = 'rendah' | 'sederhana' | 'tinggi';

export interface Farmer {
  nama: string;
  lokasi: string;
  negeri: string;
  keluasan: number; // hektar
  jenisTanah: string;
  tanamanUtama: string;
  avatar: string;
}

export interface CurrentWeather {
  suhu: number;
  keadaan: string;
  ikon: string;
  kelembapan: number;
  angin: number;
  hujan: number; // kebarangkalian %
  lokasi: string;
  dikemaskini: string;
}

export interface ForecastDay {
  hari: string;
  ikon: string;
  suhuMin: number;
  suhuMax: number;
  hujan: number;
}

export interface CropPhase {
  nama: string;
  julatHari: string;
  selesai: boolean;
  aktif: boolean;
}

export interface CalendarTask {
  tarikh: string;
  aktiviti: string;
  jenis: 'baja' | 'siraman' | 'racun' | 'tuaian' | 'tanam' | 'pemantauan';
  selesai: boolean;
  catatan?: string;
}

export interface CropPlan {
  tanaman: string;
  varieti: string;
  tarikhTanam: string;
  fasaSemasa: string;
  peratusKemajuan: number;
  hariKeTuaian: number;
  fasa: CropPhase[];
  tugasan: CalendarTask[];
}

export interface CropRecommendation {
  cropId?: string;
  nama: string;
  ikon: string;
  kesesuaian: number; // %
  musim: string;
  tempohMatang: string;
  anggaranHasil: string;
  permintaan: AlertLevel;
  catatan: string;
}

export interface Alert {
  id: string;
  kategori: 'cuaca' | 'banjir' | 'penyakit' | 'perosak';
  tajuk: string;
  tahap: AlertLevel;
  keterangan: string;
  tindakan: string;
  masa: string;
  ikon: string;
}

export interface MarketPrice {
  komoditi: string;
  gred: string;
  harga: number;
  unit: string;
  perubahan: number; // % berbanding semalam
  pasar: string;
  sumber: string;
  sejarah: number[];
}

export interface SupplyDemand {
  komoditi: string;
  permintaan: number;
  bekalan: number;
}

export interface PriceTrendPoint {
  bulan: string;
  padi: number;
  sayur: number;
  buah: number;
}
