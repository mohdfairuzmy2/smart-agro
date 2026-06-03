/** Kandungan halaman Info Sistem — desktop sahaja */

export const SYSTEM_TAGLINE =
  'Maklumat tepat, hasil meningkat, risiko berkurang, petani lebih bersedia.';

export const SYSTEM_TUJUAN = [
  'SMART AGRO ialah platform sokongan keputusan untuk petani kecil dan sederhana di Malaysia.',
  'Menyatukan cuaca, tanah, kalendar tanaman, amaran risiko, harga pasaran dan analitik dalam satu paparan mudah difahami.',
  'Membantu perancangan harian (siraman, baja, kawalan penyakit) dan strategik (pilihan tanaman, masa jualan, anggaran untung).',
  'Berasaskan Inisiatif 3 — integrasi data terbuka kerajaan dan repositori agronomi (MVP prototaip).',
];

export const SYSTEM_OBJEKTIF = [
  'Meningkatkan kesiapsiagaan petani terhadap cuaca ekstrem, banjir dan wabak penyakit.',
  'Memudahkan akses harga pasaran dan peluang permintaan-bekalan tanpa meneliti banyak portal.',
  'Menyediakan kalendar penanaman ikut fasa tanaman dan panduan DOA/MARDI.',
  'Menyokong ladang campuran (berbilang blok/sayur) dengan analisis per blok, bukan anggaran satu nombor mengelirukan.',
  'Menyediakan label jelas (Live / Rujukan / Demo / Campuran) supaya petani tahu tahap kebolehpercayaan data.',
];

export const SYSTEM_MODUL = [
  { nama: 'Dashboard Pemantauan', skrin: 'Utama', keterangan: 'Cuaca, sensor tanah, kalendar ringkas, amaran & harga.' },
  { nama: 'Kalendar Penanaman Pintar', skrin: 'Kalendar', keterangan: 'Fasa tumbesaran, tugasan baja/siraman/tuaian per tanaman.' },
  { nama: 'Amaran & Risiko', skrin: 'Amaran', keterangan: 'Cuaca, banjir, penyakit, perosak; semakan gambar AI (simulasi).' },
  { nama: 'Analisis Keputusan Ladang', skrin: 'Analisis', keterangan: 'Skor kesihatan, untung per blok, what-if musim, risiko & pasaran.' },
  { nama: 'Harga Pasaran', skrin: 'Pasaran', keterangan: 'FAMA, trend CPI, permintaan-bekalan, tapak jualan berhampiran.' },
  { nama: 'Profil & Tanaman Aktif', skrin: 'Profil', keterangan: 'Profil ladang, GPS, 6 jenis sayur, rekod hasil demo.' },
];

export const SYSTEM_MANFAAT = [
  'Keputusan lebih cepat — rumusan dan cadangan dalam bahasa mudah, bukan laporan teknikal panjang.',
  'Risiko lebih awal diketahui — amaran berperingkat (rendah / sederhana / tinggi) dengan tindakan disyorkan.',
  'Perancangan kewangan lebih jujur — pecahan kos & untung per blok ladang campuran.',
  'Penjualan lebih terancang — senarai pasar, pasar tani dan pasaraya berhampiran ladang.',
  'Sedia untuk integrasi penuh — struktur data selaras METMalaysia, FAMA, DOA, MARDI dan data.gov.my.',
];

export const SYSTEM_CIRI = [
  'Responsif: pengalaman telefon (nav bawah) dan desktop (sidebar + bar atas).',
  'Ladang campuran 6 blok sayur (contoh demo: cili, sawi, kangkung, bayam, terung, timun).',
  'Enjin analisis: skor kesihatan, matriks risiko, what-if pusingan musim per blok.',
  'Repositori 38+ tanaman: kalendar, penyakit PlantVillage, GeoTanih, harga FAMA import.',
  'Bar status sumber data + muat semula; profil disimpan pada peranti (localStorage).',
  'Peta lokasi ladang & anggaran jarak ke tapak jualan.',
];

export const SYSTEM_SUMBER_API = [
  { data: 'Ramalan cuaca 7 hari', sumber: 'METMalaysia via api.data.gov.my', jenis: 'live' as const },
  { data: 'Cuaca semasa (suhu, lembap, angin)', sumber: 'Open-Meteo', jenis: 'live' as const },
  { data: 'Amaran ribut / hujan lebat', sumber: 'METMalaysia weather/warning', jenis: 'live' as const },
  { data: 'Indeks harga (CPI) & trend', sumber: 'OpenDOSM (data.gov.my)', jenis: 'live' as const },
  { data: 'Pengeluaran tanaman (indeks)', sumber: 'DOSM crops_state', jenis: 'live' as const },
  { data: 'Harga komoditi FAMA', sumber: 'Import JSON MyHargaTani (kurasi)', jenis: 'rujukan' as const },
  { data: 'Kalendar & penyakit tanaman', sumber: 'MARDI, DOA Perak, PlantVillage', jenis: 'rujukan' as const },
  { data: 'Profil ladang & pilihan tapak jualan', sumber: 'localStorage peranti', jenis: 'rujukan' as const },
  { data: 'Sensor IoT, rekod musim, watak demo', sumber: 'Senario demonstrasi SMART AGRO', jenis: 'demo' as const },
];

export const SYSTEM_DEMO_LIVE_URL = 'https://mohdfairuzmy2.github.io/smart-agro/';

export const SYSTEM_NOTA_PROTOTAIP =
  'Ini prototaip MVP — bukan sistem pengoperasian ladang rasmi. Sahkan harga, cuaca lapangan dan nasihat agronomi dengan pegawai / pasar tempatan sebelum keputusan muktamad.';
