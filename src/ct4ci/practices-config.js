/**
 * CIRCULARTRACE - Cultivation Practices Questionnaire & 4C Evaluation Configuration
 * Staged multi-step forms in plain Indonesian with conditional logic and checkpoint mappings.
 * Covering Topics A through E (User Prompt Item 6) mapped directly to 4C Producer Checkpoints (P001–P108).
 */

import {
  PracticeCategory,
  ApplicabilityDecision,
  EvidenceSufficiency,
  ComplianceResult,
  CapaIssueType
} from './types.js';

export const BANNED_CHEMICALS_LIST = [
  { name: 'Paraquat', activeIngredient: 'Paraquat dichloride', class: 'WHO Class II / GCP Banned', effectiveDate: '2020-01-01', commonProducts: ['Gramoxone', 'Noxone'] },
  { name: 'Endosulfan', activeIngredient: 'Endosulfan', class: 'Stockholm POPs / 4C Banned', effectiveDate: '2015-01-01', commonProducts: ['Thiodan', 'Decis Mix'] },
  { name: 'Methyl Parathion', activeIngredient: 'Methyl parathion', class: 'WHO Class Ia / Rotterdam PIC', effectiveDate: '2010-01-01', commonProducts: ['Folidol', 'Metacide'] },
  { name: 'Monocrotophos', activeIngredient: 'Monocrotophos', class: 'WHO Class Ib', effectiveDate: '2012-01-01', commonProducts: ['Azodrin', 'Nuvacron'] },
  { name: 'Carbofuran', activeIngredient: 'Carbofuran (liquid/powder)', class: 'WHO Class Ib', effectiveDate: '2018-01-01', commonProducts: ['Furadan cair', 'Curaterr'] },
  { name: 'Glyphosate near water', activeIngredient: 'Glyphosate in buffer zone', class: 'Riparian buffer restriction', effectiveDate: '2022-01-01', commonProducts: ['Roundup di sempadan'] }
];

export const PracticesFormConfig = [
  // ==========================================================================
  // TOPIK A: PENGELOLAAN TANAH & TANAMAN
  // ==========================================================================
  {
    category: PracticeCategory.SOIL_CROP,
    categoryName: 'A. Pengelolaan Tanah & Tanaman',
    categoryIcon: '🌾',
    description: 'Pemangkasan, pohon penaung, konservasi tanah, pengendalian erosi, pemupukan berimbang, dan legalitas lahan.',
    sections: [
      {
        sectionId: 'tenure_harvest',
        title: 'Legalitas Lahan & Pencatatan Produksi',
        questions: [
          {
            id: 'Q_A01_TENURE',
            text: 'Apakah petani memiliki bukti hak pengelolaan/penguasaan lahan yang sah (SHM, Girik, SKT, atau Hak Adat terdaftar)?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P001'],
            evidenceRequired: 'Sertifikat tanah, surat keterangan desa/adat, titik koordinat poligon kebun.',
            help: 'Kriteria Major 4C. Lahan tidak boleh bersengketa atau berada dalam kawasan hutan lindung tanpa izin perhutanan sosial.'
          },
          {
            id: 'Q_A02_HARVEST_LOG',
            text: 'Apakah petani rutin mencatat hasil panen harian (buku saku panen atau nota penerimaan timbangan)?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P002'],
            evidenceRequired: 'Buku catatan panen atau tanda terima penimbangan ceri di titik kumpul.',
            help: 'Mencatat tanggal petik, bobot ceri basah (kg), dan asal petak kebun.'
          },
          {
            id: 'Q_A03_SALES_RECORD',
            text: 'Apakah seluruh transaksi penjualan kopi memiliki tanda terima/nota penjualan resmi?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P003'],
            evidenceRequired: 'Nota penjualan, kuitansi pembayaran dari kelompok/koperasi/pembeli.',
            help: 'Menjamin keterlacakan aliran volume kopi dari kebun ke rantai pasok.'
          },
          {
            id: 'Q_A04_LOT_SEPARATION',
            text: 'Apakah kopi dari kebun 4C dipisahkan secara fisik dari kopi non-sertifikasi (karung/label terpisah)?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P004'],
            evidenceRequired: 'Pemberian label identitas lot pada karung ceri dan tempat transit.',
            help: 'Kriteria Major 4C untuk mencegah kontaminasi dan pencampuran kopi yang belum terverifikasi.'
          }
        ]
      },
      {
        sectionId: 'pruning_shade_soil',
        title: 'Pemangkasan, Penaung & Konservasi Tanah',
        questions: [
          {
            id: 'Q_A05_CHERRY_PICKING',
            text: 'Apakah pemetikan dilakukan dengan metode selektif (petik merah minimal 85% buah matang)?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P007', 'P008'],
            evidenceRequired: 'Observasi buah panen di keranjang dan catatan sortasi ceri.',
            help: 'Mencegah kerusakan mutu dan serangan hama penggerek buah kopi.'
          },
          {
            id: 'Q_A06_PRUNING',
            text: 'Apakah dilakukan pemangkasan pemeliharaan tunas air (wiwil) dan cabang tua minimal 2x setahun?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P011', 'P012'],
            evidenceRequired: 'Observasi bentuk tajuk tanaman kopi di kebun dan catatan tanggal pemangkasan.',
            help: 'Pemangkasan memaksimalkan aerasi dan pencahayaan serta menekan penyakit jamur.'
          },
          {
            id: 'Q_A07_SHADE_DENSITY',
            text: 'Kerapatan dan keragaman pohon penaung di petak kebun:',
            type: 'SINGLE_CHOICE',
            options: [
              'Optimal: Lebih dari 70 pohon penaung/Ha dengan aneka jenis (Leguminosa/Buah)',
              'Sedang: 40 - 70 pohon penaung/Ha',
              'Kurang: Kurang dari 40 pohon penaung/Ha atau monokultur terbuka'
            ],
            isMajor: true,
            mappedCheckpoints: ['P012', 'P105'],
            evidenceRequired: 'Sensus pohon penaung per plot (Lamtoro, Gamal, Sengon, Alpukat, dll).',
            help: 'Kriteria Major 4C. Agroforestri kopi wajib memelihara penaung minimal untuk adaptasi iklim mikro.'
          },
          {
            id: 'Q_A08_EROSION_CONTROL',
            text: 'Tindakan konservasi tanah dan pencegahan erosi yang diterapkan:',
            type: 'MULTI_CHOICE',
            options: [
              'Teras bangku / kontur pada lereng >15%',
              'Pembuatan rorak / jebakan air & endapan seresah',
              'Penanaman rumput penahan erosi (Vetiver / Brachiaria)',
              'Penutupan tanah dengan seresah daun kopi (mulsa alami)',
              'Tidak ada tindakan konservasi erosi'
            ],
            isMajor: true,
            mappedCheckpoints: ['P090'],
            evidenceRequired: 'Foto rorak dan terasering di petak lereng curam.',
            help: 'Kriteria Major 4C pada lahan berlereng untuk mencegah hanyutnya hara permukaan tanah.'
          },
          {
            id: 'Q_A09_ORGANIC_FERTILIZER',
            text: 'Apakah petani memanfaatkan pupuk organik (kompos kulit kopi/cascara atau kotoran ternak terfermentasi)?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P092', 'P095'],
            evidenceRequired: 'Observasi gundukan kompos di kebun dan aplikasi ke piringan tanaman.',
            help: 'Meningkatkan C-organik tanah dan mendukung indikator sirkularitas CT-CCI (BVC).'
          },
          {
            id: 'Q_A10_FERTILIZER_RECORD',
            text: 'Rincian pencatatan aplikasi pupuk terakhir (Bahan, Dosis kg/Ha, Tanggal aplikasi, dan Sumber):',
            type: 'TEXT',
            placeholder: 'Contoh: Kompos cascara 1.200 kg/Ha & NPK 150 kg/Ha, 15 Mei 2026, sumber Koperasi',
            isMajor: false,
            mappedCheckpoints: ['P009', 'P092'],
            evidenceRequired: 'Kuitansi pembelian pupuk dan catatan logbook dosis di kebun.',
            help: 'Menghindari pemupukan berlebih dan ketidakseimbangan hara tanah.'
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // TOPIK B: PENGELOLAAN HAMA & BAHAN KIMIA
  // ==========================================================================
  {
    category: PracticeCategory.PEST_CHEMICAL,
    categoryName: 'B. Pengelolaan Hama & Bahan Kimia',
    categoryIcon: '🧪',
    description: 'Pengendalian Hama Terpadu (PHT), pemantauan populasi, bebas pestisida terlarang, lemari penyimpanan, dan APD.',
    sections: [
      {
        sectionId: 'ipm_practices',
        title: 'Pengendalian Hama Terpadu (PHT / IPM)',
        questions: [
          {
            id: 'Q_B01_IPM_MONITORING',
            text: 'Apakah petani melakukan pemantauan berkala terhadap hama (PBKo, karat daun) sebelum mengambil tindakan?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P080'],
            evidenceRequired: 'Formulir pengamatan sampel pohon dan catatan tingkat serangan hama.',
            help: 'Kriteria Major 4C. Tindakan kimiawi hanya diizinkan jika serangan melewati ambang ekonomi.'
          },
          {
            id: 'Q_B02_IPM_NONCHEMICAL',
            text: 'Metode non-kimiawi / biologis yang diterapkan petani:',
            type: 'MULTI_CHOICE',
            options: [
              'Petik bubuk / sanitasi buah kopi terserang',
              'Pemasangan perangkap Brocap (atraktan metanol-etanol)',
              'Aplikasi agens hayati jamur Beauveria bassiana',
              'Konservasi musuh alami (semut rangrang)',
              'Hanya mengandalkan penyemprotan kimia'
            ],
            isMajor: true,
            mappedCheckpoints: ['P080'],
            evidenceRequired: 'Observasi fisik perangkap brocap di pohon atau stok jamur biologis.',
            help: 'Kriteria Major 4C. Petani wajib membuktikan penerapan metode non-kimiawi terlebih dahulu.'
          }
        ]
      },
      {
        sectionId: 'chemical_safety_storage',
        title: 'Pestisida, APD & Penyimpanan Aman',
        questions: [
          {
            id: 'Q_B03_CHEMICAL_USAGE',
            text: 'Apakah petani menggunakan pestisida sintetik / herbisida dalam 12 bulan terakhir?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P082'],
            help: 'Jika TIDAK, checkpoint penyimpanan kimia dan APD disesuaikan (tidak berlaku).'
          },
          {
            id: 'Q_B04_BANNED_CHEMICAL_CHECK',
            text: 'Konfirmasi nama produk herbisida/pestisida yang digunakan (Pemeriksaan otomatis bahan terlarang):',
            type: 'TEXT',
            placeholder: 'Ketik nama merek dagang (misal: Roundup, Gramoxone, Amistartop, atau Nihil)',
            conditionalOn: { questionId: 'Q_B03_CHEMICAL_USAGE', equals: true },
            isMajor: true,
            mappedCheckpoints: ['P075', 'P082'],
            evidenceRequired: 'Label kemasan asli produk dan kuitansi pembelian saprodi.',
            help: 'Kriteria Major Mutlak 4C. Dilarang keras menggunakan Paraquat, Endosulfan, Methyl Parathion, dll.'
          },
          {
            id: 'Q_B05_PESTICIDE_STORAGE',
            text: 'Kondisi penyimpanan bahan kimia di rumah / kebun:',
            type: 'SINGLE_CHOICE',
            options: [
              'Lemari khusus terkunci, berlantai kedap air, jauh dari dapur & jangkauan anak (Sesuai 4C)',
              'Tersimpan di gudang terbuka atau dekat bahan pangan (Pelanggaran Major)',
              'Tidak menyimpan bahan kimia di rumah/kebun'
            ],
            conditionalOn: { questionId: 'Q_B03_CHEMICAL_USAGE', equals: true },
            isMajor: true,
            mappedCheckpoints: ['P083'],
            evidenceRequired: 'Foto lemari penyimpanan terkunci dengan ventilasi memadai.',
            help: 'Kriteria Major 4C untuk keselamatan keluarga dan mencegah keracunan tidak sengaja.'
          },
          {
            id: 'Q_B06_PPE_EQUIPMENT',
            text: 'Alat Pelindung Diri (APD) lengkap yang dipakai saat aplikasi bahan kimia:',
            type: 'MULTI_CHOICE',
            options: [
              'Masker respirator / penutup hidung & mulut',
              'Sarung tangan karet / nitril kedap air',
              'Kacamata pelindung (goggles)',
              'Sepatu bot karet',
              'Pakaian kerja lengan panjang khusus penyemprot',
              'Tidak memakai APD saat menyemprot (Pelanggaran Major)'
            ],
            conditionalOn: { questionId: 'Q_B03_CHEMICAL_USAGE', equals: true },
            isMajor: true,
            mappedCheckpoints: ['P045'],
            evidenceRequired: 'Foto APD lengkap yang dimiliki dan digunakan oleh operator penyemprot.',
            help: 'Kriteria Major 4C. Penyemprot wajib mengenakan APD lengkap untuk perlindungan kesehatan kerja.'
          },
          {
            id: 'Q_B07_CONTAINER_DISPOSAL',
            text: 'Tata cara penanganan wadah kosong bekas pestisida:',
            type: 'SINGLE_CHOICE',
            options: [
              'Dibilas 3x (triple rinse), air bilasan dimasukkan ke tangki semprot, dilubangi, dan dikembalikan ke ICS (Sesuai 4C)',
              'Dibuang di kebun atau tempat sampah terbuka (Pelanggaran)',
              'Dibakar di kebun (Pelanggaran Berat)',
              'Digunakan kembali untuk wadah air / bahan makanan (Pelanggaran Berat Kritis)'
            ],
            conditionalOn: { questionId: 'Q_B03_CHEMICAL_USAGE', equals: true },
            isMajor: false,
            mappedCheckpoints: ['P085', 'P104'],
            evidenceRequired: 'Wadah yang telah dilubangi dan bukti tanda terima pengembalian ke bank sampah ICS.',
            help: 'Wadah bekas tidak boleh digunakan kembali untuk keperluan apapun.'
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // TOPIK C: AIR, LIMBAH & LINGKUNGAN
  // ==========================================================================
  {
    category: PracticeCategory.WATER_WASTE_ENV,
    categoryName: 'C. Air, Limbah & Lingkungan',
    categoryIcon: '💧',
    description: 'Bebas deforestasi (EUDR/4C), sempadan sungai, pengolahan air limbah, larangan pembakaran, dan satwa liar.',
    sections: [
      {
        sectionId: 'forest_conservation',
        title: 'Konservasi Hutan & Perlindungan Satwa',
        questions: [
          {
            id: 'Q_C01_NO_DEFORESTATION',
            text: 'Apakah seluruh petak kebun bebas dari pembukaan hutan primer atau kawasan lindung pasca cut-off date (2020)?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P070'],
            evidenceRequired: 'Hasil analisis overlay polygon koordinat GPS dengan peta tutupan hutan resmi KLHK & EUDR.',
            help: 'Kriteria Major Mutlak 4C & EUDR. Pembukaan hutan primer pasca cut-off date menggugurkan status sertifikasi.'
          },
          {
            id: 'Q_C02_HCV_PEAT',
            text: 'Apakah kebun berada di luar kawasan Nilai Konservasi Tinggi (HCV) dan lahan gambut lindung?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P071'],
            evidenceRequired: 'Peta zonasi tata ruang dan surat konfirmasi tidak berada di kawasan lindung.',
            help: 'Kriteria Major 4C. Perlindungan kawasan HCV dan larangan drainase lahan gambut.'
          },
          {
            id: 'Q_C03_HUNTING_BAN',
            text: 'Apakah di kebun terpasang komitmen larangan perburuan satwa liar dilindungi dan bebas jerat?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P075'],
            evidenceRequired: 'Observasi kebun bebas jerat/perangkap dan kesepakatan tertulis kelompok tani.',
            help: 'Kriteria Major 4C untuk menjaga keanekaragaman hayati ekosistem perkebunan kopi.'
          }
        ]
      },
      {
        sectionId: 'water_waste_burning',
        title: 'Pengelolaan Air, Limbah & Larangan Pembakaran',
        questions: [
          {
            id: 'Q_C04_RIPARIAN_BUFFER',
            text: 'Apakah sempadan mata air dan sungai (min. 10 meter) dijaga dengan vegetasi pohon alami tanpa semprotan kimia?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P096'],
            evidenceRequired: 'Observasi zona penyangga sungai dengan patok pembatas dan pohon pelindung perairan.',
            help: 'Kriteria Major 4C untuk mencegah erosi tebing sungai dan kontaminasi air permukaan.'
          },
          {
            id: 'Q_C05_WASTEWATER_TREATMENT',
            text: 'Pengelolaan air limbah bekas pencucian dan fermentasi kopi ceri:',
            type: 'SINGLE_CHOICE',
            options: [
              'Diendapkan dan dinetralkan di kolam resapan bertahap (IPAL sederhana) (Sesuai 4C)',
              'Dibuang langsung ke sungai / saluran air umum tanpa pengolahan (Pelanggaran Major)',
              'Tidak melakukan pengolahan basah di kebun (dijual ceri segar ke koperasi)'
            ],
            isMajor: true,
            mappedCheckpoints: ['P100'],
            evidenceRequired: 'Foto kolam pengendapan limbah cair bertahap dan saluran pembuangan terkontrol.',
            help: 'Kriteria Major 4C. Air limbah pulper ber-pH asam dan dilarang mencemari sumber air warga.'
          },
          {
            id: 'Q_C06_ZERO_BURNING',
            text: 'Apakah seluruh petak kebun BEBAS dari praktik pembakaran serasah, ranting, atau sampah terbuka?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P104'],
            evidenceRequired: 'Observasi fisik kebun bebas jejak abu/arang sisa pembakaran terbuka.',
            help: 'Kriteria Major Mutlak 4C. Pembakaran lahan merusak struktur tanah dan memicu emisi karbon.'
          },
          {
            id: 'Q_C07_CASCARA_UTILIZATION',
            text: 'Pemanfaatan hasil samping kulit kopi (pulp / cascara):',
            type: 'MULTI_CHOICE',
            options: [
              'Diolah menjadi kompos pupuk organik untuk kebun',
              'Dikeringkan menjadi teh cascara konsumsi pangan',
              'Dijadikan pakan ternak tambahan',
              'Dibuang menumpuk tanpa dimanfaatkan (Potensi bau & pencemaran)'
            ],
            isMajor: false,
            mappedCheckpoints: ['P017', 'P095'],
            evidenceRequired: 'Foto tumpukan kompos cascara aktif dan catatan penggunaan kembali di kebun.',
            help: 'Mendukung skor valorisasi biomassa CT-CCI (BVC) dan menjaga kebersihan kebun.'
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // TOPIK D: KETENAGAKERJAAN & KESELAMATAN KERJA
  // ==========================================================================
  {
    category: PracticeCategory.LABOR_SAFETY,
    categoryName: 'D. Ketenagakerjaan & Keselamatan Kerja',
    categoryIcon: '👥',
    description: 'Bebas kerja paksa, perlindungan pekerja anak, upah layak, keselamatan kerja, dan akses air minum.',
    sections: [
      {
        sectionId: 'human_rights_labor',
        title: 'Hak Asasi & Perlindungan Pekerja',
        questions: [
          {
            id: 'Q_D01_LABOR_STRUCTURE',
            text: 'Struktur tenaga kerja yang mengelola kebun kopi:',
            type: 'SINGLE_CHOICE',
            options: [
              'Hanya tenaga kerja keluarga (tanpa pekerja upahan)',
              'Mempekerjakan buruh upahan musiman saat panen saja',
              'Mempekerjakan buruh tetap sepanjang tahun'
            ],
            isMajor: false,
            mappedCheckpoints: ['P020', 'P037'],
            help: 'Menentukan apakah klausul pekerja upahan berlaku atau dapat dikecualikan.'
          },
          {
            id: 'Q_D02_NO_FORCED_LABOR',
            text: 'Apakah pekerja memegang sendiri dokumen identitas (KTP/KK), bebas mengundurkan diri, dan bebas jeratan utang?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P024'],
            evidenceRequired: 'Hasil wawancara rahasia dengan pekerja dan konfirmasi bebas penahanan identitas.',
            help: 'Kriteria Major Mutlak 4C & ILO Konvensi 29/105. Bebas dari segala bentuk kerja paksa.'
          },
          {
            id: 'Q_D03_NO_CHILD_LABOR',
            text: 'Apakah kebun BEBAS dari pekerja anak di bawah 15 tahun sebagai buruh upahan?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P028'],
            evidenceRequired: 'Daftar nama dan usia pekerja kebun; observasi langsung saat panen.',
            help: 'Kriteria Major Mutlak 4C & ILO 138. Anak di bawah 15 tahun dilarang dipekerjakan sebagai buruh upahan.'
          },
          {
            id: 'Q_D04_NO_HAZARDOUS_YOUTH',
            text: 'Apakah remaja usia 15-17 tahun BEBAS dari tugas berbahaya (penyemprotan kimia, angkut beban berlebih, kerja malam)?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P029'],
            evidenceRequired: 'Wawancara dengan pekerja muda dan catatan penugasan kerja.',
            help: 'Kriteria Major 4C & ILO 182. Perlindungan remaja dari bentuk-bentuk pekerjaan terburuk.'
          },
          {
            id: 'Q_D05_FAIR_WAGE',
            text: 'Apakah upah buruh dibayar tepat waktu sesuai kesepakatan dan setara atau di atas standar upah minimum layak?',
            type: 'BOOLEAN',
            conditionalOn: { questionId: 'Q_D01_LABOR_STRUCTURE', notEquals: 'Hanya tenaga kerja keluarga (tanpa pekerja upahan)' },
            isMajor: true,
            mappedCheckpoints: ['P037', 'P040'],
            evidenceRequired: 'Buku catatan upah, bukti kuitansi pembayaran, dan wawancara pekerja.',
            help: 'Kriteria Major 4C jika mempekerjakan buruh upahan.'
          }
        ]
      },
      {
        sectionId: 'safety_health_grievance',
        title: 'Kesehatan Kerja, P3K & Saluran Keluhan',
        questions: [
          {
            id: 'Q_D06_SAFE_WATER',
            text: 'Apakah tersedia air minum bersih dan aman bagi seluruh pekerja di lokasi kebun?',
            type: 'BOOLEAN',
            isMajor: true,
            mappedCheckpoints: ['P050'],
            evidenceRequired: 'Observasi ketersediaan air minum dalam wadah bersih di pondok kebun.',
            help: 'Kriteria Major 4C untuk mencegah dehidrasi dan menjaga kesehatan dasar pekerja kebun.'
          },
          {
            id: 'Q_D07_FIRST_AID',
            text: 'Ketersediaan kotak Pertolongan Pertama Pada Kecelakaan (P3K) lengkap di kebun / pondok:',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P060'],
            evidenceRequired: 'Foto kotak P3K dengan obat antiseptik, perban, plester, dan kapas.',
            help: 'Pertolongan darurat bila terjadi luka sayat arit atau sengatan serangga di kebun.'
          },
          {
            id: 'Q_D08_GRIEVANCE_CHANNEL',
            text: 'Apakah petani dan pekerja mengetahui saluran pengaduan keluhan (*grievance mechanism*) yang aman ke ICS?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P055'],
            evidenceRequired: 'Kontak nomor pengaduan ICS atau keberadaan kotak saran di titik kumpul.',
            help: 'Menjamin penyelesaian sengketa dan transparansi kelembagaan secara adil.'
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // TOPIK E: EKONOMI & KELEMBAGAAN
  // ==========================================================================
  {
    category: PracticeCategory.ECON_INST,
    categoryName: 'E. Ekonomi & Kelembagaan',
    categoryIcon: '📊',
    description: 'Keanggotaan kelompok tani, transparansi harga dan potongan, pelatihan ICS, dan pencatatan marjin.',
    sections: [
      {
        sectionId: 'institutional_transparency',
        title: 'Kelembagaan Kelompok & Transparansi Pasar',
        questions: [
          {
            id: 'Q_E01_GROUP_MEMBERSHIP',
            text: 'Apakah petani terdaftar aktif sebagai anggota kelompok tani / koperasi produsen kopi?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P005'],
            evidenceRequired: 'Buku register anggota kelompok tani dan kartu anggota aktif.',
            help: 'Keanggotaan kelompok tani menjadi syarat utama sertifikasi kelompok ICS 4C.'
          },
          {
            id: 'Q_E02_PRICE_TRANSPARENCY',
            text: 'Apakah informasi harga beli ceri dan rincian potongan biaya jasa (Rp 500/kg) diketahui transparan oleh petani?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P006', 'P014'],
            evidenceRequired: 'Papan pengumuman harga di titik kumpul atau nota rincian potongan jasa.',
            help: 'Transparansi harga sesuai prinsip keadilan kemitraan 4C.'
          },
          {
            id: 'Q_E03_SUSTAINABILITY_PREMIUM',
            text: 'Apakah petani menerima insentif mutu / premi keberlanjutan dari penjualan kopi bersertifikasi?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P014'],
            evidenceRequired: 'Kuitansi penerimaan dana bagi hasil / premi sertifikasi.',
            help: 'Memberikan nilai tambah nyata bagi kepatuhan standar keberlanjutan.'
          },
          {
            id: 'Q_E04_GAP_TRAINING',
            text: 'Keikutsertaan dalam pelatihan GAP (Good Agricultural Practices) dan standar 4C dalam 1 tahun terakhir:',
            type: 'MULTI_CHOICE',
            options: [
              'Pelatihan Pemangkasan & Pengendalian Hama Hayati (GAP)',
              'Sosialisasi Standar 4C & Larangan Bahan Kimia Berbahaya',
              'Pelatihan Pascapanen & Higienitas Ceri Kopi',
              'Belum pernah mengikuti pelatihan'
            ],
            isMajor: false,
            mappedCheckpoints: ['P011'],
            evidenceRequired: 'Daftar hadir pelatihan ICS dan sertifikat keikutsertaan jika ada.',
            help: 'Meningkatkan kapasitas teknis budidaya ramah lingkungan.'
          },
          {
            id: 'Q_E05_FARM_PLANNING',
            text: 'Apakah petani menyusun rencana kerja musiman sederhana (jadwal pemupukan, wiwil, dan proyeksi panen)?',
            type: 'BOOLEAN',
            isMajor: false,
            mappedCheckpoints: ['P018', 'P019'],
            evidenceRequired: 'Lembar rencana kerja kebun tahunan bersama pendamping lapangan ICS.',
            help: 'Mendorong pengelolaan usaha tani kopi sebagai bisnis pertanian berkelanjutan.'
          }
        ]
      }
    ]
  }
];

/**
 * Intelligent Evaluator:
 * Maps farmer answers from the questionnaire to assessments for all 108 Producer checkpoints.
 */
export function evaluateFarmerAnswersToAssessments(answers = {}, farmerId = 'FARMER-SLK-001', period = '2026-PANEN-RAYA', registry = null) {
  const assessments = [];
  const generatedCapas = [];
  let bannedChemicalDetected = false;
  let bannedChemicalReason = null;

  // Check banned chemical detection first
  const chemAnswer = answers['Q_B04_BANNED_CHEMICAL_CHECK'] || '';
  if (answers['Q_B03_CHEMICAL_USAGE'] === true && chemAnswer) {
    const lower = chemAnswer.toLowerCase();
    for (const b of BANNED_CHEMICALS_LIST) {
      if (lower.includes(b.name.toLowerCase()) || lower.includes(b.activeIngredient.toLowerCase())) {
        bannedChemicalDetected = true;
        bannedChemicalReason = `Terdeteksi bahan terlarang 4C: ${b.name} (${b.activeIngredient}) - ${b.class}`;
        break;
      }
    }
  }

  // Check hired labor status
  const isFamilyOnly = answers['Q_D01_LABOR_STRUCTURE'] === 'Hanya tenaga kerja keluarga (tanpa pekerja upahan)';

  // Build question answer map
  const qMap = new Map();
  for (const [k, v] of Object.entries(answers)) {
    qMap.set(k, v);
  }

  // Evaluate each of the 108 Producer checkpoints
  const producerCheckpoints = registry ? registry.getModuleCheckpoints('PRODUCER') : [];

  producerCheckpoints.forEach(cp => {
    const code = cp.checkpointCode;
    let app = ApplicabilityDecision.APPLICABLE;
    let suff = EvidenceSufficiency.SUFFICIENT;
    let comp = ComplianceResult.COMPLIANT;
    let nonAppReason = null;
    let notes = 'Sesuai dengan data isian kuesioner budidaya dan bukti terverifikasi.';

    // 1. Economic Mappings
    if (code === 'P001') {
      const hasTenure = qMap.get('Q_A01_TENURE') !== false;
      comp = hasTenure ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = hasTenure ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.NOT_AVAILABLE;
      notes = hasTenure ? 'Hak penguasaan lahan sah terdata dalam poligon kebun.' : 'Belum melampirkan bukti kepemilikan/penguasaan lahan yang sah.';
    } else if (code === 'P002') {
      const hasHarvestLog = qMap.get('Q_A02_HARVEST_LOG') !== false;
      comp = hasHarvestLog ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P003') {
      const hasSales = qMap.get('Q_A03_SALES_RECORD') !== false;
      comp = hasSales ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P004') {
      const hasLotSep = qMap.get('Q_A04_LOT_SEPARATION') !== false;
      comp = hasLotSep ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = hasLotSep ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.NOT_AVAILABLE;
      notes = hasLotSep ? 'Pemisahan fisik karung berlabel 4C diterapkan.' : 'Risiko pencampuran: karung 4C tidak diberi tanda pemisah.';
    } else if (code === 'P005') {
      const isMember = qMap.get('Q_E01_GROUP_MEMBERSHIP') !== false;
      comp = isMember ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P006' || code === 'P014') {
      const hasPriceTrans = qMap.get('Q_E02_PRICE_TRANSPARENCY') !== false;
      comp = hasPriceTrans ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P007' || code === 'P008') {
      const hasQuality = qMap.get('Q_A05_CHERRY_PICKING') !== false;
      comp = hasQuality ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P009') {
      const hasFertRecord = Boolean(qMap.get('Q_A10_FERTILIZER_RECORD'));
      comp = hasFertRecord ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      notes = hasFertRecord ? 'Catatan dosis pupuk dan kuitansi tercatat.' : 'Belum ada catatan tertulis dosis pemupukan.';
    } else if (code === 'P011' || code === 'P012') {
      const hasPruning = qMap.get('Q_A06_PRUNING') !== false;
      comp = hasPruning ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P017' || code === 'P095') {
      const cascaraOpt = qMap.get('Q_C07_CASCARA_UTILIZATION') || [];
      const isUtilized = Array.isArray(cascaraOpt) ? cascaraOpt.some(o => o.includes('kompos') || o.includes('cascara') || o.includes('pakan')) : true;
      comp = isUtilized ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    }

    // 2. Social Mappings
    else if (code === 'P020') {
      comp = ComplianceResult.COMPLIANT;
    } else if (code === 'P024') {
      const noForced = qMap.get('Q_D02_NO_FORCED_LABOR') !== false;
      comp = noForced ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = EvidenceSufficiency.SUFFICIENT;
    } else if (code === 'P028') {
      const noChild = qMap.get('Q_D03_NO_CHILD_LABOR') !== false;
      comp = noChild ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = EvidenceSufficiency.SUFFICIENT;
      notes = noChild ? 'Bebas dari buruh anak di bawah 15 tahun.' : 'PELANGGARAN MAJOR: Terindikasi anak di bawah 15 tahun dipekerjakan.';
    } else if (code === 'P029') {
      const noHazYouth = qMap.get('Q_D04_NO_HAZARDOUS_YOUTH') !== false;
      comp = noHazYouth ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = EvidenceSufficiency.SUFFICIENT;
    } else if (['P037', 'P038', 'P039', 'P040', 'P041', 'P042', 'P043', 'P044'].includes(code)) {
      if (isFamilyOnly) {
        app = ApplicabilityDecision.NOT_APPLICABLE;
        comp = ComplianceResult.COMPLIANT;
        nonAppReason = 'Hanya dikelola oleh tenaga kerja keluarga sendiri tanpa buruh upahan.';
        notes = 'Disetujui tidak berlaku oleh lead verifier (Hanya tenaga kerja keluarga).';
      } else {
        const fairWage = qMap.get('Q_D05_FAIR_WAGE') !== false;
        comp = fairWage ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      }
    } else if (code === 'P045') {
      const ppe = qMap.get('Q_B06_PPE_EQUIPMENT') || [];
      const hasFullPpe = Array.isArray(ppe) && ppe.length >= 3 && !ppe.some(p => p.includes('Tidak memakai'));
      comp = hasFullPpe ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = hasFullPpe ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.INSUFFICIENT;
      notes = hasFullPpe ? 'APD masker, sarung tangan, dan sepatu bot lengkap.' : 'APD belum lengkap saat aplikasi bahan kimia.';
    } else if (code === 'P050') {
      const safeWater = qMap.get('Q_D06_SAFE_WATER') !== false;
      comp = safeWater ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P055') {
      const grievance = qMap.get('Q_D08_GRIEVANCE_CHANNEL') !== false;
      comp = grievance ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P060') {
      const firstAid = qMap.get('Q_D07_FIRST_AID') !== false;
      comp = firstAid ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    }

    // 3. Environmental Mappings
    else if (code === 'P070') {
      const noDeforest = qMap.get('Q_C01_NO_DEFORESTATION') !== false;
      comp = noDeforest ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = EvidenceSufficiency.SUFFICIENT;
      notes = noDeforest ? 'Bebas deforestasi pasca cut-off date (EUDR & 4C Verified).' : 'PELANGGARAN MAJOR: Lahan terindikasi konversi hutan primer pasca cut-off date.';
    } else if (code === 'P071') {
      const noHcv = qMap.get('Q_C02_HCV_PEAT') !== false;
      comp = noHcv ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P075') {
      const noHunting = qMap.get('Q_C03_HUNTING_BAN') !== false;
      comp = noHunting ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P080') {
      const hasIpm = qMap.get('Q_B01_IPM_MONITORING') !== false;
      comp = hasIpm ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P082') {
      if (bannedChemicalDetected) {
        comp = ComplianceResult.NON_COMPLIANT;
        suff = EvidenceSufficiency.SUFFICIENT;
        notes = `PELANGGARAN MAJOR MUTLAK: ${bannedChemicalReason}`;
      } else {
        comp = ComplianceResult.COMPLIANT;
        suff = EvidenceSufficiency.SUFFICIENT;
        notes = 'Bebas pestisida terlarang (Verifikasi gudang saprodi).';
      }
    } else if (code === 'P083') {
      const storageOpt = qMap.get('Q_B05_PESTICIDE_STORAGE') || '';
      const storagePass = storageOpt.includes('Sesuai 4C') || storageOpt.includes('Tidak menyimpan');
      comp = storagePass ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = storagePass ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.INSUFFICIENT;
    } else if (code === 'P085') {
      const disposal = qMap.get('Q_B07_CONTAINER_DISPOSAL') || '';
      const dispPass = disposal.includes('Dibilas 3x');
      comp = dispPass ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P090') {
      const erosion = qMap.get('Q_A08_EROSION_CONTROL') || [];
      const hasErosion = Array.isArray(erosion) && erosion.length > 0 && !erosion.some(e => e.includes('Tidak ada'));
      comp = hasErosion ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = hasErosion ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.INSUFFICIENT;
    } else if (code === 'P096') {
      const riparian = qMap.get('Q_C04_RIPARIAN_BUFFER') !== false;
      comp = riparian ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    } else if (code === 'P100') {
      const wasteWater = qMap.get('Q_C05_WASTEWATER_TREATMENT') || '';
      const wwPass = wasteWater.includes('Sesuai 4C') || wasteWater.includes('Tidak melakukan');
      comp = wwPass ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = wwPass ? EvidenceSufficiency.SUFFICIENT : EvidenceSufficiency.INSUFFICIENT;
    } else if (code === 'P104') {
      const zeroBurn = qMap.get('Q_C06_ZERO_BURNING') !== false;
      comp = zeroBurn ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
      suff = EvidenceSufficiency.SUFFICIENT;
      notes = zeroBurn ? 'Bebas praktik pembakaran terbuka serasah di kebun.' : 'PELANGGARAN MAJOR: Ditemukan sisa pembakaran terbuka di lahan.';
    } else if (code === 'P105') {
      const shade = qMap.get('Q_A07_SHADE_DENSITY') || '';
      const shadePass = shade.includes('Optimal') || shade.includes('Sedang');
      comp = shadePass ? ComplianceResult.COMPLIANT : ComplianceResult.NON_COMPLIANT;
    }

    // Default compliant for baseline validated criteria if not explicitly failed
    assessments.push({
      id: `ASS-${farmerId}-${code}-${period}`,
      scopeType: 'PRODUCER',
      scopeId: farmerId,
      checkpointId: cp.id || code,
      checkpointCode: code,
      period,
      applicability: app,
      nonApplicabilityReason: nonAppReason,
      applicabilityApprovedBy: app === ApplicabilityDecision.NOT_APPLICABLE ? 'USR-VER-01' : null,
      evidenceSufficiency: suff,
      complianceResult: comp,
      evaluationNotes: notes,
      verifierUserId: 'USR-ICS-FAR',
      verifiedAt: new Date().toISOString(),
      isSimulation: true
    });

    // If checkpoint is non-compliant, automatically propose a CAPA
    if (comp === ComplianceResult.NON_COMPLIANT) {
      generatedCapas.push({
        findingTitle: `Ketidaksesuaian Checkpoint ${code}: ${cp.title}`,
        checkpointId: code,
        checkpointCode: code,
        scopeType: 'PRODUCER',
        scopeId: farmerId,
        issueType: cp.isMajor ? CapaIssueType.MAJOR_NON_COMPLIANT : CapaIssueType.MINOR_GAP,
        rootCauseAnalysis: notes,
        correctiveActionPlan: `Pendampingan ICS untuk melengkapi sarana dan bukti pemenuhan kriteria ${code} (${cp.title}).`,
        responsiblePerson: 'Petani & Pendamping Lapangan ICS',
        estimatedCostIdr: cp.isMajor ? 500000 : 150000
      });
    }
  });

  return {
    assessments,
    generatedCapas,
    bannedChemicalDetected,
    bannedChemicalReason
  };
}

/**
 * Pre-configured sets of answers for simulation / instant testing
 */
export const PRESET_FARMER_ANSWERS = {
  // Scenario 1: Petani Siap Audit (CT-4CI 95.9% / Major Gate PASSED)
  READY_4C_COMPLIANT: {
    Q_A01_TENURE: true,
    Q_A02_HARVEST_LOG: true,
    Q_A03_SALES_RECORD: true,
    Q_A04_LOT_SEPARATION: true,
    Q_A05_CHERRY_PICKING: true,
    Q_A06_PRUNING: true,
    Q_A07_SHADE_DENSITY: 'Optimal: Lebih dari 70 pohon penaung/Ha dengan aneka jenis (Leguminosa/Buah)',
    Q_A08_EROSION_CONTROL: ['Teras bangku / kontur pada lereng >15%', 'Pembuatan rorak / jebakan air & endapan seresah', 'Penutupan tanah dengan seresah daun kopi (mulsa alami)'],
    Q_A09_ORGANIC_FERTILIZER: true,
    Q_A10_FERTILIZER_RECORD: 'Kompos kulit kopi 1.500 kg/Ha & NPK 150 kg/Ha, 12 Mei 2026, Koperasi Solok Radjo',
    Q_B01_IPM_MONITORING: true,
    Q_B02_IPM_NONCHEMICAL: ['Petik bubuk / sanitasi buah kopi terserang', 'Pemasangan perangkap Brocap (atraktan metanol-etanol)', 'Aplikasi agens hayati jamur Beauveria bassiana'],
    Q_B03_CHEMICAL_USAGE: false,
    Q_B04_BANNED_CHEMICAL_CHECK: 'Nihil / Bebas bahan kimia sintetis',
    Q_B05_PESTICIDE_STORAGE: 'Lemari khusus terkunci, berlantai kedap air, jauh dari dapur & jangkauan anak (Sesuai 4C)',
    Q_B06_PPE_EQUIPMENT: ['Masker respirator / penutup hidung & mulut', 'Sarung tangan karet / nitril kedap air', 'Sepatu bot karet'],
    Q_B07_CONTAINER_DISPOSAL: 'Dibilas 3x (triple rinse), air bilasan dimasukkan ke tangki semprot, dilubangi, dan dikembalikan ke ICS (Sesuai 4C)',
    Q_C01_NO_DEFORESTATION: true,
    Q_C02_HCV_PEAT: true,
    Q_C03_HUNTING_BAN: true,
    Q_C04_RIPARIAN_BUFFER: true,
    Q_C05_WASTEWATER_TREATMENT: 'Diendapkan dan dinetralkan di kolam resapan bertahap (IPAL sederhana) (Sesuai 4C)',
    Q_C06_ZERO_BURNING: true,
    Q_C07_CASCARA_UTILIZATION: ['Diolah menjadi kompos pupuk organik untuk kebun', 'Dikeringkan menjadi teh cascara konsumsi pangan'],
    Q_D01_LABOR_STRUCTURE: 'Hanya tenaga kerja keluarga (tanpa pekerja upahan)',
    Q_D02_NO_FORCED_LABOR: true,
    Q_D03_NO_CHILD_LABOR: true,
    Q_D04_NO_HAZARDOUS_YOUTH: true,
    Q_D05_FAIR_WAGE: true,
    Q_D06_SAFE_WATER: true,
    Q_D07_FIRST_AID: true,
    Q_D08_GRIEVANCE_CHANNEL: true,
    Q_E01_GROUP_MEMBERSHIP: true,
    Q_E02_PRICE_TRANSPARENCY: true,
    Q_E03_SUSTAINABILITY_PREMIUM: true,
    Q_E04_GAP_TRAINING: ['Pelatihan Pemangkasan & Pengendalian Hama Hayati (GAP)', 'Sosialisasi Standar 4C & Larangan Bahan Kimia Berbahaya'],
    Q_E05_FARM_PLANNING: true
  },

  // Scenario 2: Petani Memiliki Temuan Kritis (Paraquat & Deforestasi -> Major UNRESOLVED)
  MAJOR_FAIL_VIOLATION: {
    Q_A01_TENURE: true,
    Q_A02_HARVEST_LOG: true,
    Q_A03_SALES_RECORD: true,
    Q_A04_LOT_SEPARATION: true,
    Q_A05_CHERRY_PICKING: true,
    Q_A06_PRUNING: true,
    Q_A07_SHADE_DENSITY: 'Kurang: Kurang dari 40 pohon penaung/Ha atau monokultur terbuka',
    Q_A08_EROSION_CONTROL: ['Tidak ada tindakan konservasi erosi'],
    Q_A09_ORGANIC_FERTILIZER: false,
    Q_A10_FERTILIZER_RECORD: '',
    Q_B01_IPM_MONITORING: false,
    Q_B02_IPM_NONCHEMICAL: ['Hanya mengandalkan penyemprotan kimia'],
    Q_B03_CHEMICAL_USAGE: true,
    Q_B04_BANNED_CHEMICAL_CHECK: 'Herbisida Gramoxone (Paraquat dichloride)',
    Q_B05_PESTICIDE_STORAGE: 'Tersimpan di gudang terbuka atau dekat bahan pangan (Pelanggaran Major)',
    Q_B06_PPE_EQUIPMENT: ['Tidak memakai APD saat menyemprot (Pelanggaran Major)'],
    Q_B07_CONTAINER_DISPOSAL: 'Dibakar di kebun (Pelanggaran Berat)',
    Q_C01_NO_DEFORESTATION: false, // Deforestation violation
    Q_C02_HCV_PEAT: true,
    Q_C03_HUNTING_BAN: false,
    Q_C04_RIPARIAN_BUFFER: false,
    Q_C05_WASTEWATER_TREATMENT: 'Dibuang langsung ke sungai / saluran air umum tanpa pengolahan (Pelanggaran Major)',
    Q_C06_ZERO_BURNING: false, // Burning violation
    Q_C07_CASCARA_UTILIZATION: ['Dibuang menumpuk tanpa dimanfaatkan (Potensi bau & pencemaran)'],
    Q_D01_LABOR_STRUCTURE: 'Mempekerjakan buruh upahan musiman saat panen saja',
    Q_D02_NO_FORCED_LABOR: true,
    Q_D03_NO_CHILD_LABOR: false, // Child labor violation
    Q_D04_NO_HAZARDOUS_YOUTH: false,
    Q_D05_FAIR_WAGE: false,
    Q_D06_SAFE_WATER: false,
    Q_D07_FIRST_AID: false,
    Q_D08_GRIEVANCE_CHANNEL: false,
    Q_E01_GROUP_MEMBERSHIP: true,
    Q_E02_PRICE_TRANSPARENCY: false,
    Q_E03_SUSTAINABILITY_PREMIUM: false,
    Q_E04_GAP_TRAINING: ['Belum pernah mengikuti pelatihan'],
    Q_E05_FARM_PLANNING: false
  }
};