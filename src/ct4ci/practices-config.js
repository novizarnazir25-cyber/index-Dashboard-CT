/**
 * CIRCULARTRACE - Cultivation Practices Questionnaire Configuration
 * Staged multi-step forms in plain Indonesian with conditional logic and checkpoint mappings.
 * Covering Topics A through E (User Prompt Item 6).
 */

import { PracticeCategory } from './types.js';

export const PracticesFormConfig = [
  {
    category: PracticeCategory.SOIL_CROP,
    categoryName: 'A. Pengelolaan Tanah & Tanaman',
    description: 'Pemangkasan, pohon penaung, penutup tanah, pengendalian erosi, dan pemupukan berimbang.',
    sections: [
      {
        sectionId: 'pruning_shade',
        title: 'Pemangkasan & Pohon Penaung',
        questions: [
          {
            id: 'Q_PRUNING',
            text: 'Apakah dilakukan pemangkasan pemeliharaan dan pemangkasan produksi kopi secara berkala?',
            type: 'BOOLEAN',
            help: 'Pemangkasan tunas air (wiwil) dan cabang tua yang tidak produktif minimal 2x setahun.',
            mappedCheckpoints: ['P011', 'P012']
          },
          {
            id: 'Q_SHADE_SPECIES',
            text: 'Jenis pohon penaung yang ada di petak kebun:',
            type: 'MULTI_CHOICE',
            options: ['Lamtoro / Gamal (Leguminosa)', 'Sengon / Albasia', 'Pohon Buah (Alpukat, Jeruk, Nangka)', 'Kayu Manis / Surian', 'Tanpa Penaung'],
            mappedCheckpoints: ['P012', 'P105']
          },
          {
            id: 'Q_SHADE_DENSITY',
            text: 'Kerapatan pohon penaung per hektar:',
            type: 'SINGLE_CHOICE',
            options: ['Kurang dari 50 pohon/Ha (Kurang)', '50 - 70 pohon/Ha (Sedang)', 'Lebih dari 70 pohon/Ha (Optimal 4C)'],
            mappedCheckpoints: ['P105']
          }
        ]
      },
      {
        sectionId: 'soil_erosion_fertilizer',
        title: 'Pengendalian Erosi & Pemupukan',
        questions: [
          {
            id: 'Q_EROSION_CONTROL',
            text: 'Tindakan konservasi tanah dan pencegahan erosi yang diterapkan:',
            type: 'MULTI_CHOICE',
            options: ['Teras bangku / kontur', 'Pembuatan rorak / jebakan air', 'Penanaman rumput penahan erosi (Vetiver/Brachiaria)', 'Mulsa seresah daun kopi'],
            mappedCheckpoints: ['P090']
          },
          {
            id: 'Q_ORGANIC_FERTILIZER',
            text: 'Apakah menggunakan pupuk organik (kompos kulit kopi / kotoran ternak)?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P092', 'P095']
          },
          {
            id: 'Q_FERTILIZER_RECORD',
            text: 'Rincian aplikasi pupuk terakhir (Bahan, Dosis kg/Ha, Tanggal, Sumber):',
            type: 'TEXT',
            placeholder: 'Contoh: Kompos cascara 1.000 kg/Ha & NPK 150 kg/Ha, 12 Mei 2026, Kelompok Tani',
            mappedCheckpoints: ['P009', 'P092']
          }
        ]
      }
    ]
  },
  {
    category: PracticeCategory.PEST_CHEMICAL,
    categoryName: 'B. Pengelolaan Hama & Bahan Kimia',
    description: 'Pemantauan hama terpadu (PHT), pencatatan pestisida, lemari penyimpanan, APD, dan pengelolaan limbah kemasan.',
    sections: [
      {
        sectionId: 'ipm_monitoring',
        title: 'Pengendalian Hama Terpadu (PHT)',
        questions: [
          {
            id: 'Q_PEST_MONITORING',
            text: 'Apakah petani melakukan pengamatan/monitoring hama dan penyakit (PBKo, karat daun) secara berkala sebelum tindakan?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P080']
          },
          {
            id: 'Q_BIOLOGICAL_CONTROL',
            text: 'Metode non-kimia yang diterapkan:',
            type: 'MULTI_CHOICE',
            options: ['Petik bubuk / sanitasi buah terserang', 'Perangkap Brocap (atraktan metanol)', 'Jamur Beauveria bassiana', 'Musuh alami semut rangrang'],
            mappedCheckpoints: ['P080']
          }
        ]
      },
      {
        sectionId: 'chemical_safety',
        title: 'Pestisida, APD & Penyimpanan',
        questions: [
          {
            id: 'Q_CHEMICAL_USAGE',
            text: 'Apakah menggunakan pestisida sintetik / herbisida dalam 12 bulan terakhir?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P082', 'P083']
          },
          {
            id: 'Q_CHEMICAL_INVENTORY',
            text: 'Nama merek dagang dan bahan aktif pestisida yang digunakan:',
            type: 'TEXT',
            placeholder: 'Contoh: Herbisida Gramoxone (Paraquat - DILARANG), Roundup (Glifosat)',
            conditionalOn: { questionId: 'Q_CHEMICAL_USAGE', equals: true },
            mappedCheckpoints: ['P082']
          },
          {
            id: 'Q_PPE_COMPLETE',
            text: 'Alat Pelindung Diri (APD) yang dipakai saat menyemprot:',
            type: 'MULTI_CHOICE',
            options: ['Masker pernapasan khusus', 'Sarung tangan karet/nitril', 'Kacamata pelindung (goggles)', 'Sepatu bot karet', 'Pakaian lengan panjang khusus'],
            conditionalOn: { questionId: 'Q_CHEMICAL_USAGE', equals: true },
            mappedCheckpoints: ['P045']
          },
          {
            id: 'Q_CONTAINER_DISPOSAL',
            text: 'Cara penanganan wadah kosong pestisida:',
            type: 'SINGLE_CHOICE',
            options: ['Dibilas 3x (triple rinse), dilubangi, dikembalikan ke ICS (Sesuai 4C)', 'Dibuang ke tempat sampah umum', 'Dibakar di kebun (Pelanggaran)', 'Digunakan kembali untuk wadah air/makanan (Pelanggaran Berat)'],
            conditionalOn: { questionId: 'Q_CHEMICAL_USAGE', equals: true },
            mappedCheckpoints: ['P085', 'P104']
          }
        ]
      }
    ]
  },
  {
    category: PracticeCategory.WATER_WASTE_ENV,
    categoryName: 'C. Air, Limbah & Lingkungan',
    description: 'Sumber air, efisiensi pencucian kopi, pengolahan air limbah, larangan pembakaran, dan perlindungan satwa liar.',
    sections: [
      {
        sectionId: 'water_management',
        title: 'Pengelolaan Air & Limbah Pengolahan',
        questions: [
          {
            id: 'Q_WATER_SOURCE',
            text: 'Sumber air yang digunakan untuk kebun dan pascapanen:',
            type: 'SINGLE_CHOICE',
            options: ['Mata air alami', 'Air hujan (penampungan)', 'Sumur bor / air tanah', 'Sungai / irigasi umum'],
            mappedCheckpoints: ['P096', 'P098']
          },
          {
            id: 'Q_WASTEWATER_TREATMENT',
            text: 'Apakah air limbah bekas pencucian/pengupasan ceri kopi diolah sebelum dibuang?',
            type: 'SINGLE_CHOICE',
            options: ['Diendapkan di kolam resapan bertahap (IPAL sederhana)', 'Dibuang langsung ke sungai/parit (Pelanggaran Mayor)', 'Tidak melakukan pengolahan basah di kebun'],
            mappedCheckpoints: ['P100']
          },
          {
            id: 'Q_BURNING_PRACTICE',
            text: 'Apakah ada pembakaran terbuka pada serasah kebun atau sampah di lahan?',
            type: 'BOOLEAN',
            help: '4C secara mutlak melarang pembakaran lahan pertanian terbuka.',
            mappedCheckpoints: ['P104']
          }
        ]
      },
      {
        sectionId: 'biodiversity_byproduct',
        title: 'Konservasi & Pemanfaatan Hasil Samping',
        questions: [
          {
            id: 'Q_RIVER_BUFFER',
            text: 'Apakah sempadan sungai (min. 10 meter) dijaga dengan vegetasi alami / pohon pelindung?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P096']
          },
          {
            id: 'Q_HUNTING_BAN',
            text: 'Apakah di kebun terpasang atau disepakati larangan berburu satwa liar?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P075']
          },
          {
            id: 'Q_PULP_VALORIZATION',
            text: 'Pemanfaatan kulit ceri (pulp / cascara):',
            type: 'MULTI_CHOICE',
            options: ['Dibuat kompos pupuk organik', 'Dikeringkan menjadi teh cascara pangan', 'Briket biomassa', 'Dibuang tanpa dimanfaatkan'],
            mappedCheckpoints: ['P017', 'P095']
          }
        ]
      }
    ]
  },
  {
    category: PracticeCategory.LABOR_SAFETY,
    categoryName: 'D. Ketenagakerjaan & Keselamatan Kerja',
    description: 'Status tenaga kerja, upah layak, perlindungan anak, anti-kerja paksa, kesehatan & keselamatan kerja.',
    sections: [
      {
        sectionId: 'labor_force',
        title: 'Struktur Pekerja & Kondisi Kerja',
        questions: [
          {
            id: 'Q_LABOR_TYPE',
            text: 'Jenis tenaga kerja yang digunakan dalam pengelolaan kebun:',
            type: 'MULTI_CHOICE',
            options: ['Keluarga sendiri', 'Tenaga kerja tetap', 'Tenaga kerja musiman / borongan saat panen'],
            mappedCheckpoints: ['P020', 'P037']
          },
          {
            id: 'Q_WAGE_LEVEL',
            text: 'Apakah upah tenaga kerja upahan dibayar sesuai atau di atas standar upah minimum daerah (UMR)?',
            type: 'SINGLE_CHOICE',
            options: ['Sesuai atau di atas UMR', 'Di bawah UMR', 'Hanya tenaga kerja keluarga (tanpa upahan)'],
            mappedCheckpoints: ['P037', 'P040']
          },
          {
            id: 'Q_FORCED_LABOR_CHECK',
            text: 'Apakah dokumen identitas pekerja (KTP/Paspor) disimpan sendiri oleh pekerja dan bebas berhenti kerja?',
            type: 'BOOLEAN',
            help: 'Konfirmasi tidak adanya penahanan dokumen identitas atau jeratan utang.',
            mappedCheckpoints: ['P024']
          }
        ]
      },
      {
        sectionId: 'child_protection_safety',
        title: 'Perlindungan Anak & Keselamatan Kerja',
        questions: [
          {
            id: 'Q_CHILD_LABOR_CHECK',
            text: 'Apakah ada anak di bawah usia 15 tahun yang dipekerjakan sebagai buruh upahan?',
            type: 'BOOLEAN',
            help: 'Pelanggaran Major 4C. Anak keluarga boleh membantu secara wajar di luar jam sekolah.',
            mappedCheckpoints: ['P028']
          },
          {
            id: 'Q_HAZARDOUS_WORK_YOUTH',
            text: 'Apakah anak/remaja usia 15-17 tahun dilibatkan dalam penyemprotan bahan kimia atau kerja malam berbahaya?',
            type: 'BOOLEAN',
            help: 'Pelanggaran Major jika remaja terpapar zat berbahaya.',
            mappedCheckpoints: ['P029']
          },
          {
            id: 'Q_FIRST_AID_KIT',
            text: 'Ketersediaan kotak Pertolongan Pertama Pada Kecelakaan (P3K) di kebun / pondok kerja:',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P060']
          }
        ]
      }
    ]
  },
  {
    category: PracticeCategory.ECON_INST,
    categoryName: 'E. Ekonomi & Kelembagaan',
    description: 'Catatan panen dan penjualan, transparansi harga dan potongan, pelatihan ICS, dan keanggotaan kelompok.',
    sections: [
      {
        sectionId: 'transaction_records',
        title: 'Pencatatan Transaksi & Harga',
        questions: [
          {
            id: 'Q_HARVEST_LOG',
            text: 'Apakah petani memiliki buku catatan panen atau nota penerimaan timbangan ceri?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P002', 'P003']
          },
          {
            id: 'Q_PRICE_TRANSPARENCY',
            text: 'Apakah rincian harga beli ceri dan potongan jasa penimbangan/sortasi diketahui transparan oleh petani?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P006', 'P014']
          },
          {
            id: 'Q_PREMIUM_RECEIPT',
            text: 'Apakah petani menerima insentif mutu / premi kopi berkelanjutan jika memenuhi standar?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P014']
          }
        ]
      },
      {
        sectionId: 'ics_engagement',
        title: 'Hubungan dengan Kelompok Tani & ICS',
        questions: [
          {
            id: 'Q_ICS_TRAINING',
            text: 'Keikutsertaan dalam sosialisasi / pelatihan yang diselenggarakan ICS dalam 1 tahun terakhir:',
            type: 'MULTI_CHOICE',
            options: ['Pelatihan GAP & Pemangkasan', 'Sosialisasi Standar 4C & Larangan Pestisida', 'Pelatihan Penanganan Pascapanen', 'Belum pernah mengikuti'],
            mappedCheckpoints: ['P011']
          },
          {
            id: 'Q_GRIEVANCE_CHANNEL',
            text: 'Apakah petani mengetahui saluran pengaduan jika terjadi ketidaksesuaian timbangan atau potongan harga?',
            type: 'BOOLEAN',
            mappedCheckpoints: ['P055']
          }
        ]
      }
    ]
  }
];
