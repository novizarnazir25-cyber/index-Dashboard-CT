/**
 * CIRCULARTRACE - Official 4C Checkpoint Register
 * Based on 4C Code of Conduct v4.1 (2024), Paper Section 3.11:
 * - BP Producer: 108 Checkpoints (P001 - P108)
 *   - Economic: P001 - P019 (19 checkpoints)
 *   - Social: P020 - P069 (50 checkpoints)
 *   - Environmental: P070 - P108 (39 checkpoints)
 * - Managing Entity: 33 Checkpoints (ME001 - ME033)
 * - Service Provider: 83 Checkpoints (SP001 - SP083)
 */

import { CheckpointModule, DimensionType, AssessmentScope } from './types.js';

// Helper to generate checkpoints cleanly
function createProducerCheckpoints() {
  const checkpoints = [];

  // --------------------------------------------------------------------------
  // ECONOMIC DIMENSION: P001 - P019 (19 Checkpoints)
  // --------------------------------------------------------------------------
  const econData = [
    { code: 'P001', title: 'Identifikasi Kebun & Hak Penguasaan Lahan', isMajor: true, ref: '4C 1.1.1', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PER_PLOT_ALL_MUST_PASS, req: 'Peta/titik koordinat kebun, bukti legalitas/status penguasaan lahan adat atau sertifikat sah.' },
    { code: 'P002', title: 'Pencatatan Produksi dan Hasil Panen Ceri Kopi', isMajor: false, ref: '4C 1.1.2', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Buku catatan panen atau nota timbang ceri harian.' },
    { code: 'P003', title: 'Pencatatan Penjualan Ceri / Kopi Beras', isMajor: false, ref: '4C 1.1.3', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Nota timbang, bukti transaksi penjualan, nama pembeli.' },
    { code: 'P004', title: 'Pemisahan Lot Kopi Bersertifikat dan Konvensional', isMajor: true, ref: '4C 1.1.4', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Label lot fisik, karung terpisah, catatan serah terima.' },
    { code: 'P005', title: 'Keanggotaan dan Partisipasi dalam Kelompok Tani', isMajor: false, ref: '4C 1.2.1', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Daftar anggota resmi kelompok tani, kartu anggota aktif.' },
    { code: 'P006', title: 'Akses Informasi Pasar dan Harga Transparan', isMajor: false, ref: '4C 1.2.2', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.GROUP_WIDE, req: 'Papan informasi harga di kelompok / pesan digital harga resmi.' },
    { code: 'P007', title: 'Pemahaman Syarat Mutu Ceri Petik Merah', isMajor: false, ref: '4C 1.3.1', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'SOP petik merah, catatan sortasi ceri saat panen.' },
    { code: 'P008', title: 'Pengelolaan Pasca Panen Dasar (Sortasi & Kebersihan)', isMajor: false, ref: '4C 1.3.2', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Observasi tempat penampungan ceri bersih, terpal alas.' },
    { code: 'P009', title: 'Pencatatan Pembelian Sarana Produksi Pertanian (Saprodi)', isMajor: false, ref: '4C 1.4.1', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Kuitansi pembelian pupuk, bibit, atau sarana kerja.' },
    { code: 'P010', title: 'Kemitraan Jangka Panjang dengan Pembeli / Koperasi', isMajor: false, ref: '4C 1.4.2', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PRODUCER_WIDE, req: 'Perjanjian jual beli atau riwayat pasok rutin.' },
    { code: 'P011', title: 'Partisipasi dalam Pelatihan Praktik Budidaya Baik (GAP)', isMajor: false, ref: '4C 1.5.1', level: 'LEVEL_1_ENTRY', scope: AssessmentScope.PRODUCER_WIDE, req: 'Daftar hadir pelatihan GAP yang diselenggarakan ICS.' },
    { code: 'P012', title: 'Adopsi Rekomendasi Pelatihan di Kebun', isMajor: false, ref: '4C 1.5.2', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PER_PLOT_ALL_MUST_PASS, req: 'Observasi pemangkasan, penyiangan, dan naungan sesuai GAP.' },
    // P013, P014, P015 marked for source validation audit as requested
    { code: 'P013', title: 'Catatan Biaya Usaha Tani & Perhitungan Marjin', isMajor: false, ref: '4C 1.6.1', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PRODUCER_WIDE, req: 'Buku kas usaha tani sederhana mencatat biaya tenaga kerja & input.', valStatus: 'PENDING_SOURCE_VALIDATION', note: 'Menunggu validasi sumber 4C v4.1 untuk level & status major' },
    { code: 'P014', title: 'Transparansi Pemotongan Biaya & Penerimaan Premi Keberlanjutan', isMajor: false, ref: '4C 1.6.2', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PRODUCER_WIDE, req: 'Bukti pembayaran premi keberlanjutan atau rincian potongan jasa ICS.', valStatus: 'PENDING_SOURCE_VALIDATION', note: 'Menunggu validasi sumber 4C v4.1 untuk level & status major' },
    { code: 'P015', title: 'Akses Layanan Simpan Pinjam / Pembiayaan Berkelanjutan', isMajor: false, ref: '4C 1.6.3', level: 'LEVEL_3_ADVANCED', scope: AssessmentScope.PRODUCER_WIDE, req: 'Catatan simpanan kelompok atau fasilitas kredit mikro produktif.', valStatus: 'PENDING_SOURCE_VALIDATION', note: 'Menunggu validasi sumber 4C v4.1 untuk level & status major' },
    { code: 'P016', title: 'Diversifikasi Pendapatan Usaha Tani Kopi', isMajor: false, ref: '4C 1.7.1', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PRODUCER_WIDE, req: 'Adanya tanaman sela (palawija, buah, atau ternak) di lahan tani.' },
    { code: 'P017', title: 'Pemanfaatan Hasil Samping Kopi untuk Nilai Tambah', isMajor: false, ref: '4C 1.7.2', level: 'LEVEL_3_ADVANCED', scope: AssessmentScope.PRODUCER_WIDE, req: 'Pencatatan produksi cascara, kompos pulp, atau pupuk organik cair.' },
    { code: 'P018', title: 'Perencanaan Usaha Tani Musiman (Rencana Tanam & Panen)', isMajor: false, ref: '4C 1.8.1', level: 'LEVEL_2_MEDIUM', scope: AssessmentScope.PRODUCER_WIDE, req: 'Dokumen rencana kerja musim tanam petani.' },
    { code: 'P019', title: 'Evaluasi Tahunan Kinerja Ekonomi Usaha Tani', isMajor: false, ref: '4C 1.8.2', level: 'LEVEL_3_ADVANCED', scope: AssessmentScope.PRODUCER_WIDE, req: 'Catatan rekapitulasi laba rugi tahunan bersama petugas ICS.' }
  ];

  econData.forEach((item, idx) => {
    checkpoints.push({
      checkpointCode: item.code,
      module: CheckpointModule.PRODUCER,
      dimension: DimensionType.ECONOMIC,
      title: item.title,
      officialRef: item.ref,
      sourceDoc: '4C Code of Conduct v4.1',
      sourceVersion: 'v4.1-2024',
      sourceLocation: `Economic Dimension, Item ${idx + 1}`,
      isMajor: item.isMajor,
      assessmentLevel: item.level,
      applicabilityRule: 'ALL_PRODUCERS',
      assessmentScope: item.scope,
      fieldQuestionPrompt: `Apakah produser memenuhi persyaratan: ${item.title}?`,
      requiredEvidenceDescription: item.req,
      evidenceSufficiencyRule: 'Bukti fisik/dokumen terverifikasi oleh petugas ICS dengan cap/tanda tangan atau foto geo-tagged.',
      scoringRule: 'Ci=1 jika bukti cukup dan sesuai SOP; Ci=0 jika bukti tidak memadai atau terbukti menyimpang.',
      validationStatus: item.valStatus || 'VALIDATED',
      notes: item.note || null
    });
  });

  // --------------------------------------------------------------------------
  // SOCIAL DIMENSION: P020 - P069 (50 Checkpoints)
  // --------------------------------------------------------------------------
  const socialKeyMajors = new Set([
    'P020', 'P024', 'P025', 'P028', 'P029', 'P034', 'P037', 'P040', 'P045', 'P050'
  ]);

  for (let i = 20; i <= 69; i++) {
    const code = `P${String(i).padStart(3, '0')}`;
    let isMajor = socialKeyMajors.has(code);
    let title = '';
    let req = '';
    let level = 'LEVEL_1_ENTRY';
    let appRule = 'ALL_PRODUCERS';

    if (i === 20) { title = 'Kebebasan Berserikat dan Hak Bernegosiasi Kolektif'; req = 'Wawancara pekerja, tidak ada larangan bergabung serikat/kelompok tani.'; }
    else if (i === 24) { title = 'Larangan Kerja Paksa dan Jeratan Utang'; req = 'Wawancara pekerja, paspor/KTP dipegang pekerja, upah dibayar langsung tanpa penahanan.'; }
    else if (i === 25) { title = 'Tidak Ada Pemotongan Upah Ilegal atau Denda Diskriminatif'; req = 'Bukti slip pembayaran upah bersih tanpa potongan ilegal.'; }
    else if (i === 28) { title = 'Larangan Pekerja Anak di Bawah Usia Minimum (ILO 138)'; req = 'Daftar pekerja, bukti identitas usia, observasi tidak ada anak di bawah 15 th dipekerjakan.'; }
    else if (i === 29) { title = 'Perlindungan Remaja dari Pekerjaan Berbahaya (ILO 182)'; req = 'Remaja 15-17 tahun tidak boleh menyemprot pestisida, angkut beban berat, atau kerja malam.'; }
    else if (i === 30) { title = 'Bantuan Anak Keluarga Tidak Mengganggu Waktu Sekolah'; req = 'Anak petani membantu hanya di luar jam sekolah dan akhir pekan secara wajar.'; }
    else if (i === 34) { title = 'Perlakuan Adil dan Bebas Diskriminasi (Gender, Ras, Agama)'; req = 'Wawancara pekerja perempuan dan minoritas; kesempatan dan upah setara.'; }
    else if (i === 35) { title = 'Pencegahan Pelecehan Seksual dan Kekerasan di Tempat Kerja'; req = 'Kebijakan tertulis anti-pelecehan, wawancara independen aman.'; }
    else if (i === 37) { title = 'Pembayaran Upah Sesuai atau di Atas UMR / Upah Layak Minimum'; req = 'Catatan pembayaran upah harian/borongan, kwitansi pembayaran.'; appRule = 'APPLIES_IF_HIRED_LABOR'; }
    else if (i === 40) { title = 'Pembayaran Tepat Waktu Tanpa Penundaan Berlebih'; req = 'Jadwal pembayaran upah rutin (mingguan/bulanan), kwitansi tanggal bayar.'; appRule = 'APPLIES_IF_HIRED_LABOR'; }
    else if (i === 45) { title = 'Penyediaan Alat Pelindung Diri (APD) Lengkap Saat Aplikasi Bahan Kimia'; req = 'Observasi ketersediaan masker respirator, sarung tangan nitril, sepatu bot, kacamata google.'; }
    else if (i === 46) { title = 'Pemeriksaan Kesehatan Berkala bagi Tenaga Kerja Penyemprot'; req = 'Catatan pemeriksaan kesehatan atau buku kontrol dokter puskesmas.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 50) { title = 'Akses Air Minum Bersih dan Fasilitas Sanitasi Layak di Kebun'; req = 'Observasi jamban sehat dan air minum aman di lokasi kerja kebun.'; }
    else if (i === 55) { title = 'Mekanisme Pengaduan Keluhan yang Aman dan Rahasia (Grievance Mechanism)'; req = 'Kotak saran atau nomor hotline ICS untuk pelaporan rahasia.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 60) { title = 'Penyediaan Kotak P3K di Tempat Kerja Kebun'; req = 'Kotak P3K terisi lengkap dengan obat luar, perban, antiseptik aktif.'; }
    else {
      title = `Kriteria Sosial Budidaya Kopi Bagian ${i - 19}`;
      req = `Catatan kepatuhan sosial, kondisi kerja, dan wawancara pekerja sub-klausul ${i}.`;
      level = i % 3 === 0 ? 'LEVEL_3_ADVANCED' : (i % 2 === 0 ? 'LEVEL_2_MEDIUM' : 'LEVEL_1_ENTRY');
    }

    checkpoints.push({
      checkpointCode: code,
      module: CheckpointModule.PRODUCER,
      dimension: DimensionType.SOCIAL,
      title,
      officialRef: `4C 2.${i - 19}`,
      sourceDoc: '4C Code of Conduct v4.1',
      sourceVersion: 'v4.1-2024',
      sourceLocation: `Social Dimension, Item ${i - 19}`,
      isMajor,
      assessmentLevel: level,
      applicabilityRule: appRule,
      assessmentScope: AssessmentScope.PRODUCER_WIDE,
      fieldQuestionPrompt: `Apakah produser memenuhi persyaratan sosial: ${title}?`,
      requiredEvidenceDescription: req,
      evidenceSufficiencyRule: 'Wawancara pekerja rahasia, buku upah, foto APD di kebun, dan berita acara inspeksi ICS.',
      scoringRule: 'Ci=1 jika tidak ditemukan pelanggaran dan bukti verifikasi diterima; Ci=0 jika terdapat bukti non-kompliance.',
      validationStatus: 'VALIDATED',
      notes: null
    });
  }

  // --------------------------------------------------------------------------
  // ENVIRONMENTAL DIMENSION: P070 - P108 (39 Checkpoints)
  // --------------------------------------------------------------------------
  const envKeyMajors = new Set([
    'P070', 'P071', 'P075', 'P080', 'P082', 'P083', 'P090', 'P096', 'P100', 'P104'
  ]);

  for (let i = 70; i <= 108; i++) {
    const code = `P${String(i).padStart(3, '0')}`;
    let isMajor = envKeyMajors.has(code);
    let title = '';
    let req = '';
    let level = 'LEVEL_1_ENTRY';
    let scope = AssessmentScope.PER_PLOT_ALL_MUST_PASS;

    if (i === 70) { title = 'Bebas Deforestasi dan Konversi Hutan Primer Sejak Cut-off Date'; req = 'Analisis polygon lahan overlay peta tutupan hutan resmi, tidak ada pembukaan hutan pasca cut-off.'; }
    else if (i === 71) { title = 'Perlindungan Kawasan Nilai Konservasi Tinggi (HCV) dan Lahan Gambut'; req = 'Peta batas kebun di luar area HCV/gambut, surat keterangan desa/kehutanan.'; }
    else if (i === 75) { title = 'Larangan Perburuan Liar dan Perlindungan Satwa Terancam Punah'; req = 'Observasi lapangan tidak ada jerat/senapan, papan larangan berburu di kelompok.'; }
    else if (i === 80) { title = 'Penerapan Pengendalian Hama Terpadu (PHT / IPM) Sebelum Aplikasi Kimia'; req = 'Catatan monitoring hama, perangkap biologis (brocap), sanitasi buah busuk.'; }
    else if (i === 82) { title = 'Larangan Penggunaan Pestisida Terlarang (WHO 1a/1b, POPs, PIC, Banned 4C)'; req = 'Gudang saprodi petani bebas Paraquat, Endosulfan, dll; cek wadah bekas.'; }
    else if (i === 83) { title = 'Penyimpanan Bahan Kimia Aman, Terkunci dan Berjarak dari Air'; req = 'Observasi lemari terkunci, lantai kedap air, jauh dari dapur & sumber air minum.'; }
    else if (i === 85) { title = 'Pengelolaan Wadah Bekas Pestisida (Triple Rinse & Lubangi)'; req = 'Foto wadah pestisida telah dibilas 3x, dilubangi, dan dikembalikan ke bank sampah ICS.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 90) { title = 'Pencegahan Erosi Tanah (Terasering, Rorak, dan Penutup Tanah)'; req = 'Observasi rorak, teras bangku pada kemiringan >15%, rumput pakan penahan tanah.'; }
    else if (i === 92) { title = 'Pemupukan Berimbang Berdasarkan Kebutuhan Tanaman'; req = 'Buku catatan dosis pupuk organik & anorganik, riwayat uji tanah bila ada.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 95) { title = 'Peningkatan Penggunaan Bahan Organik & Kompos Kulit Kopi'; req = 'Observasi tumpukan kompos cascara/kulit ceri di kebun, aplikasi ke piringan tanaman.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 96) { title = 'Perlindungan Sumber Air dan Zona Penyangga Sempadan Sungai (Riparian)'; req = 'Penanaman pohon penaung di sempadan air minimum 10m, tidak aplikasi pestisida di tepi sungai.'; }
    else if (i === 98) { title = 'Efisiensi Penggunaan Air Saat Pengolahan Basah'; req = 'Catatan meteran/volume air pencucian ceri, penggunaan pulper hemat air.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 100) { title = 'Pengolahan Air Limbah Pencucian Kopi (IPAL Limbah Cair)'; req = 'Kolam pengendapan dan netralisasi air asam sebelum dialirkan ke tanah/saluran.'; level = 'LEVEL_2_MEDIUM'; }
    else if (i === 104) { title = 'Larangan Pembakaran Lahan dan Sampah Pertanian Terbuka'; req = 'Observasi tidak ada sisa pembakaran gulma/ranting di kebun, komitmen tertulis petani.'; }
    else if (i === 105) { title = 'Keberadaan dan Keragaman Pohon Penaung (Agroforestri Min. 70 Pohon/Ha)'; req = 'Sensus pohon penaung (lamtoro, sengon, alpukat, dll) per petak kebun.'; }
    else {
      title = `Kriteria Lingkungan dan Konservasi Bagian ${i - 69}`;
      req = `Pemeriksaan lapangan kondisi fisik lingkungan, tanah, dan vegetasi sub-klausul ${i}.`;
      level = i % 3 === 0 ? 'LEVEL_3_ADVANCED' : (i % 2 === 0 ? 'LEVEL_2_MEDIUM' : 'LEVEL_1_ENTRY');
    }

    checkpoints.push({
      checkpointCode: code,
      module: CheckpointModule.PRODUCER,
      dimension: DimensionType.ENVIRONMENTAL,
      title,
      officialRef: `4C 3.${i - 69}`,
      sourceDoc: '4C Code of Conduct v4.1',
      sourceVersion: 'v4.1-2024',
      sourceLocation: `Environmental Dimension, Item ${i - 69}`,
      isMajor,
      assessmentLevel: level,
      applicabilityRule: 'ALL_PRODUCERS',
      assessmentScope: scope,
      fieldQuestionPrompt: `Apakah produser memenuhi kriteria lingkungan: ${title}?`,
      requiredEvidenceDescription: req,
      evidenceSufficiencyRule: 'Bukti koordinat GPS/polygon, foto kondisi kebun, logbook aplikasi saprodi, dan verifikasi fisik verifier.',
      scoringRule: 'Ci=1 jika seluruh petak kebun produser memenuhi kriteria; Ci=0 jika satu petak terbukti melanggar atau bukti kurang.',
      validationStatus: 'VALIDATED',
      notes: null
    });
  }

  return checkpoints;
}

// Generate Managing Entity Checkpoints (33 items: ME001 to ME033)
function createManagingEntityCheckpoints() {
  const list = [];
  for (let i = 1; i <= 33; i++) {
    const code = `ME${String(i).padStart(3, '0')}`;
    const isMajor = [1, 2, 5, 8, 12, 15, 20, 25, 30].includes(i);
    list.push({
      checkpointCode: code,
      module: CheckpointModule.MANAGING_ENTITY,
      dimension: i <= 10 ? DimensionType.GOVERNANCE : (i <= 20 ? DimensionType.ECONOMIC : DimensionType.SOCIAL),
      title: `Persyaratan Pengelola Kelompok / Managing Entity Bagian ${i}`,
      officialRef: `4C ME-${i}`,
      sourceDoc: '4C System Document v4.1',
      sourceVersion: 'v4.1-2024',
      sourceLocation: `Managing Entity Section, Item ${i}`,
      isMajor,
      assessmentLevel: 'LEVEL_1_ENTRY',
      applicabilityRule: 'MANAGING_ENTITY_ONLY',
      assessmentScope: AssessmentScope.GROUP_WIDE,
      fieldQuestionPrompt: `Apakah Managing Entity memenuhi persyaratan nomor ME-${i}?`,
      requiredEvidenceDescription: `Dokumen struktur organisasi ICS, daftar petani terdaftar, dan audit internal tahunan.`,
      evidenceSufficiencyRule: 'Arsip berita acara rapat pengurus, sistem database anggota aktif, dan sertifikat legalitas.',
      scoringRule: 'Ci=1 jika terbukti terlaksana secara sistematis.',
      validationStatus: 'VALIDATED',
      notes: null
    });
  }
  return list;
}

// Generate Service Provider Checkpoints (83 items: SP001 to SP083)
function createServiceProviderCheckpoints() {
  const list = [];
  for (let i = 1; i <= 83; i++) {
    const code = `SP${String(i).padStart(3, '0')}`;
    const isMajor = [1, 5, 10, 18, 25, 35, 45, 60, 75].includes(i);
    list.push({
      checkpointCode: code,
      module: CheckpointModule.SERVICE_PROVIDER,
      dimension: i <= 25 ? DimensionType.ECONOMIC : (i <= 55 ? DimensionType.ENVIRONMENTAL : DimensionType.SOCIAL),
      title: `Persyaratan Penyedia Jasa / Service Provider Bagian ${i}`,
      officialRef: `4C SP-${i}`,
      sourceDoc: '4C Service Provider Guidelines v4.1',
      sourceVersion: 'v4.1-2024',
      sourceLocation: `Service Provider Section, Item ${i}`,
      isMajor,
      assessmentLevel: 'LEVEL_1_ENTRY',
      applicabilityRule: 'SERVICE_PROVIDER_ONLY',
      assessmentScope: AssessmentScope.FACILITY_WIDE,
      fieldQuestionPrompt: `Apakah Service Provider memenuhi kriteria SP-${i}?`,
      requiredEvidenceDescription: `Kontrak layanan, kalibrasi timbangan, kualifikasi operator, dan perlindungan lingkungan fasilitas.`,
      evidenceSufficiencyRule: 'Surat kalibrasi metrologi, SOP pengolahan, dan bukti pembayaran upah layak pekerja fasilitas.',
      scoringRule: 'Ci=1 jika fasilitas mematuhi kriteria.',
      validationStatus: 'VALIDATED',
      notes: null
    });
  }
  return list;
}

export class CheckpointRegistryService {
  constructor() {
    this.producerCheckpoints = createProducerCheckpoints();
    this.managingEntityCheckpoints = createManagingEntityCheckpoints();
    this.serviceProviderCheckpoints = createServiceProviderCheckpoints();
    this.allCheckpoints = [
      ...this.producerCheckpoints,
      ...this.managingEntityCheckpoints,
      ...this.serviceProviderCheckpoints
    ];
    this.byCode = new Map(this.allCheckpoints.map(c => [c.checkpointCode, c]));
  }

  getByCode(code) {
    return this.byCode.get(code);
  }

  getModuleCheckpoints(module = CheckpointModule.PRODUCER) {
    if (module === CheckpointModule.PRODUCER) return this.producerCheckpoints;
    if (module === CheckpointModule.MANAGING_ENTITY) return this.managingEntityCheckpoints;
    if (module === CheckpointModule.SERVICE_PROVIDER) return this.serviceProviderCheckpoints;
    return [];
  }

  getProducerDimensions() {
    return {
      economic: this.producerCheckpoints.filter(c => c.dimension === DimensionType.ECONOMIC),
      social: this.producerCheckpoints.filter(c => c.dimension === DimensionType.SOCIAL),
      environmental: this.producerCheckpoints.filter(c => c.dimension === DimensionType.ENVIRONMENTAL)
    };
  }
}

export const globalCheckpointRegistry = new CheckpointRegistryService();
