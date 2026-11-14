/**
 * CIRCULARTRACE - Step 4: Role-Based Stepped Forms Configuration
 *
 * Rules:
 * - Pengguna mengisi data mentah dan bukti.
 * - Pengguna TIDAK DAPAT memasukkan skor CCI atau SDI secara manual.
 * - Hanya menampilkan indikator wajib yang relevan menurut peran.
 * - Seluruh data mentah dan jejak audit tetap tersimpan untuk keperluan inspeksi.
 */

export const RoleFormsConfig = {
  FARMER: {
    roleCode: 'FARMER',
    roleName: 'Petani / Kelompok Tani (Farmer Group)',
    stage: 'FARMER',
    defaultBoundary: 'FARMER_GATE',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Identitas Kebun & Periode Panen',
        description: 'Batas periode panen dan keterkaitan lot ceri kopi',
        fields: [
          { name: 'actor_id', label: 'ID Petani / Kelompok Tani', type: 'text', required: true },
          { name: 'period_start', label: 'Tanggal Awal Panen', type: 'date', required: true },
          { name: 'period_end', label: 'Tanggal Akhir Panen', type: 'date', required: true },
          { name: 'farm_location', label: 'Desa / Wilayah Kebun', type: 'text', required: true },
          { name: 'linked_lot_ids', label: 'ID Lot Ceri Terkait', type: 'tags', required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Bahan Masuk & Pupuk Hayati (CMI)',
        description: 'Catatan bahan pendukung budidaya dan pembenah tanah',
        fields: [
          { name: 'support_total_kg', label: 'Total Input Pupuk/Pembenah Tanah (kg)', type: 'number', min: 0, required: true },
          { name: 'support_circular_kg', label: 'Bagian Pupuk Organik Daur Ulang / Pulih (kg)', type: 'number', min: 0, required: true },
          { name: 'cmi_evidence_uri', label: 'Bukti Pembelian / Sertifikat Pupuk Organik', type: 'file_or_uri', required: false }
        ]
      },
      {
        stepNumber: 3,
        stepTitle: 'Pengelolaan Air & Perlindungan Lingkungan',
        description: 'Pemanenan air hujan, tidak ada pembakaran lahan, bebas pestisida terlarang',
        fields: [
          { name: 'water_harvesting_used', label: 'Pemanenan Air Hujan / Rorak Digunakan', type: 'boolean', required: true },
          { name: 'no_open_burning', label: 'Bebas Pembakaran Terbuka di Kebun', type: 'boolean', required: true },
          { name: 'no_banned_pesticides', label: 'Bebas Pestisida Terlarang (Konfirmasi Bebas Paraquat, dll)', type: 'boolean', required: true }
        ]
      },
      {
        stepNumber: 4,
        stepTitle: 'Ketenagakerjaan & Pencatatan Usaha Tani',
        description: 'Perlindungan anak, keselamatan kerja petani, dan logbook panen',
        fields: [
          { name: 'family_only', label: 'Seluruh Tenaga Kerja adalah Keluarga (Tanpa Pekerja Berbayar)', type: 'boolean', required: true },
          { name: 'paid_workers_count', label: 'Jumlah Pekerja Berbayar (jika ada)', type: 'number', min: 0, default: 0 },
          { name: 'paid_on_time_count', label: 'Pekerja Menerima Upah Acuan Tepat Waktu', type: 'number', min: 0, default: 0 },
          { name: 'logbook_complete', label: 'Logbook Catatan Panen & Penjualan Lengkap', type: 'boolean', required: true }
        ]
      }
    ]
  },

  PROCESSOR: {
    roleCode: 'PROCESSOR',
    roleName: 'Unit Pengolah Kopi (Processing Facility)',
    stage: 'PROCESSOR',
    defaultBoundary: 'PROCESSING_FACILITY',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Batas Fasilitas, Periode & Metode Proses',
        description: 'Tentukan unit waktu fasilitas dan lot yang diproses bersama',
        fields: [
          { name: 'actor_id', label: 'ID Fasilitas Pengolah', type: 'text', required: true },
          { name: 'period_start', label: 'Awal Periode Pengolahan', type: 'date', required: true },
          { name: 'period_end', label: 'Akhir Periode Pengolahan', type: 'date', required: true },
          { name: 'process_type', label: 'Metode Pengolahan', type: 'select', options: ['FULL_WASHED', 'NATURAL', 'HONEY', 'WET_HULLED'], required: true },
          { name: 'linked_lot_ids', label: 'ID Lot Green Bean / Parchment Terkait', type: 'tags', required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Bahan Masuk Sirkular (CMI)',
        description: 'Karung kemasan habis pakai, bahan proses, dan aditif',
        fields: [
          { name: 'support_total_kg', label: 'Total Bahan Pendukung Habis Pakai (kg)', type: 'number', min: 0, required: true },
          { name: 'support_circular_kg', label: 'Bahan Pendukung Daur Ulang / Daur Ulang Terbukti (kg)', type: 'number', min: 0, required: true },
          { name: 'cmi_evidence_uri', label: 'Bukti Catatan Timbang / Faktur Pembelian Bahan', type: 'file_or_uri', required: true }
        ]
      },
      {
        stepNumber: 3,
        stepTitle: 'Aliran Hasil Samping Biomassa (BVC)',
        description: 'Kulit kopi (pulp/cascara), kulit tanduk (parchment), dan lendir (mucilage)',
        fields: [
          { name: 'origin_flow_id', label: 'ID Aliran Asal (Unique)', type: 'text', required: true },
          { name: 'byproduct_type', label: 'Jenis Hasil Samping', type: 'select', options: ['PULP_CASCARA', 'PARCHMENT_HUSK', 'MUCILAGE', 'DEFECTIVE_BEANS'], required: true },
          { name: 'wet_kg', label: 'Massa Basah Dihasilkan (kg basah)', type: 'number', min: 0, required: true },
          { name: 'moisture_pct', label: 'Kadar Air Rerata (%)', type: 'number', min: 0, max: 99.9, required: true },
          { name: 'pathway', label: 'Jalur Pemanfaatan Aktual', type: 'select', options: ['MATERIAL_BIOLOGICAL', 'ENERGY_RECOVERY', 'DISPOSAL_OR_UNUSED'], required: true },
          { name: 'destination_detail', label: 'Rincian Tujuan Akhir (misal: Ekstrak Pangan Cascara, Kompos)', type: 'text', required: true },
          { name: 'utilized_dry_kg', label: 'Massa Kering yang Dimanfaatkan (kg kering)', type: 'number', min: 0, required: true },
          { name: 'actual_use_date', label: 'Tanggal Bukti Penggunaan Aktual', type: 'date', required: true },
          { name: 'bvc_evidence_uri', label: 'Bukti Timbang / Tanda Terima Penggunaan / BAST', type: 'file_or_uri', required: true }
        ]
      },
      {
        stepNumber: 4,
        stepTitle: 'Konsumsi Air & Energi (WC & RE, E1, E2)',
        description: 'Pencatatan meter air baru vs daur ulang dan energi terbarukan',
        fields: [
          { name: 'water_new_l', label: 'Volume Air Baru dari Sumber (Liter)', type: 'number', min: 0, required: true },
          { name: 'water_reused_l', label: 'Volume Air yang Dipakai Ulang / Diresirkulasi (Liter)', type: 'number', min: 0, required: true },
          { name: 'energy_total_kwh_eq', label: 'Total Energi Digunakan (kWh ekuivalen)', type: 'number', min: 0, required: true },
          { name: 'energy_renewable_union_kwh_eq', label: 'Energi Bersih Terbarukan / Pulih (kWh ekuivalen)', type: 'number', min: 0, required: true },
          { name: 'product_output_kg', label: 'Total Bobot Produk Tahap Ini (kg green bean)', type: 'number', min: 0.01, required: true },
          { name: 'utility_evidence_uri', label: 'Bukti Meter Air, Meter Listrik / Catatan Solar Dome', type: 'file_or_uri', required: true }
        ]
      },
      {
        stepNumber: 5,
        stepTitle: 'Kondisi Ekonomi, Sosial & Tata Kelola (Ec, S, G)',
        description: 'Margin usaha, pembayaran pemasok, upah pekerja, dan ketertelusuran',
        fields: [
          { name: 'revenue_idr', label: 'Pendapatan Usaha Periode Ini (IDR)', type: 'number', min: 0, required: true },
          { name: 'operational_cost_idr', label: 'Seluruh Biaya Operasi (Bahan, Upah, Listrik, Transportasi) (IDR)', type: 'number', min: 0, required: true },
          { name: 'supplier_trans_due', label: 'Jumlah Transaksi Pembelian Jatuh Tempo', type: 'number', min: 0, required: true },
          { name: 'supplier_trans_on_time', label: 'Transaksi Dibayar Tepat Waktu', type: 'number', min: 0, required: true },
          { name: 'kg_shipped_first_time', label: 'Massa Produk Dikirim Pengiriman Pertama (kg)', type: 'number', min: 0, required: true },
          { name: 'kg_accepted_spec', label: 'Massa Diterima Sesuai Spesifikasi (kg)', type: 'number', min: 0, required: true },
          { name: 'workers_paid_count', label: 'Jumlah Pekerja Berbayar Diperiksa', type: 'number', min: 0, required: true },
          { name: 'workers_paid_on_time', label: 'Pekerja Menerima Upah Sesuai Acuan Tepat Waktu', type: 'number', min: 0, required: true },
          { name: 'safety_sop_items_met', label: 'Butir K3 Terpenuhi (1. SOP Risiko, 2. APD, 3. P3K/Pelatihan) [0-3]', type: 'number', min: 0, max: 3, required: true },
          { name: 'transfers_lot_id_complete', label: 'Transfer Memiliki ID Lot, Asal, Tujuan, Tanggal, Bobot', type: 'number', min: 0, required: true },
          { name: 'total_lot_transfers', label: 'Total Transfer Lot pada Batas Sistem', type: 'number', min: 0, required: true },
          { name: 'record_types_complete', label: 'Catatan Usaha Lengkap (Produksi, Input, Keuangan, Pekerja) [0-4]', type: 'number', min: 0, max: 4, required: true },
          { name: 'remedial_actions_due', label: 'Aksi Perbaikan Jatuh Tempo', type: 'number', min: 0, required: true },
          { name: 'remedial_actions_done', label: 'Aksi Perbaikan Selesai dengan Bukti', type: 'number', min: 0, required: true }
        ]
      }
    ]
  },

  WAREHOUSE_EXPORTER: {
    roleCode: 'WAREHOUSE_EXPORTER',
    roleName: 'Gudang & Eksportir (Warehouse & Exporter)',
    stage: 'WAREHOUSE_EXPORTER',
    defaultBoundary: 'WAREHOUSE_QA_GATE',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Penerimaan Green Bean & Penerimaan Mutu (Ec3)',
        description: 'Pemeriksaan spesifikasi kadar air, defect count, dan penerimaan kiriman pertama',
        fields: [
          { name: 'actor_id', label: 'ID Gudang / Eksportir', type: 'text', required: true },
          { name: 'period_start', label: 'Tanggal Awal Periode', type: 'date', required: true },
          { name: 'period_end', label: 'Tanggal Akhir Periode', type: 'date', required: true },
          { name: 'input_lot_id', label: 'ID Lot Green Bean Masuk', type: 'text', required: true },
          { name: 'kg_received', label: 'Bobot Green Bean Diterima (kg)', type: 'number', min: 0, required: true },
          { name: 'kg_accepted_spec', label: 'Bobot Memenuhi Spesifikasi Kontrak (kg)', type: 'number', min: 0, required: true },
          { name: 'cupping_score', label: 'Skor Cupping SCAA / Spesifikasi Laboratorium', type: 'number', min: 0, max: 100, required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Kemasan Ekspor & Keterlacakan Dokumen (G1)',
        description: 'Kemasan karung goni ramah lingkungan / GrainPro dan kelengkapan dokumen BAST',
        fields: [
          { name: 'packaging_total_kg', label: 'Massa Kemasan Ekspor (kg)', type: 'number', min: 0, required: true },
          { name: 'packaging_circular_kg', label: 'Kemasan Guna Ulang / Daur Ulang Terverifikasi (kg)', type: 'number', min: 0, required: true },
          { name: 'export_lots_traced_pct', label: 'Persentase Lot Memiliki BAST & Jejak Lengkap (%)', type: 'number', min: 0, max: 100, required: true }
        ]
      }
    ]
  },

  ROASTERY: {
    roleCode: 'ROASTERY',
    roleName: 'Penyangrai Kopi (Roastery)',
    stage: 'ROASTERY',
    defaultBoundary: 'ROASTERY_GATE',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Batch Penyangraian & Energi Roasting (E2, RE)',
        description: 'Input green bean, yield roasted bean, dan konsumsi energi roaster',
        fields: [
          { name: 'actor_id', label: 'ID Roastery', type: 'text', required: true },
          { name: 'green_bean_charged_kg', label: 'Bobot Green Bean Dimasukkan (kg)', type: 'number', min: 0, required: true },
          { name: 'roasted_bean_output_kg', label: 'Bobot Roasted Bean Dihasilkan (kg)', type: 'number', min: 0, required: true },
          { name: 'roasting_energy_kwh_eq', label: 'Energi Roasting (Gas + Listrik kWh eq)', type: 'number', min: 0, required: true },
          { name: 'renewable_electricity_kwh', label: 'Energi Terbarukan / Solar PV (kWh)', type: 'number', min: 0, required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Valorisasi Silverskin / Kulit Ari (BVC Roaster)',
        description: 'Pemanfaatan kulit ari hasil proses roasting',
        fields: [
          { name: 'chaff_dry_kg', label: 'Massa Kulit Ari Kering (kg)', type: 'number', min: 0, required: true },
          { name: 'chaff_pathway', label: 'Jalur Pemanfaatan (Kompos/Briket/Bahan Pangan)', type: 'select', options: ['MATERIAL_BIOLOGICAL', 'ENERGY_RECOVERY', 'DISPOSAL_OR_UNUSED'], required: true },
          { name: 'chaff_utilized_kg', label: 'Massa Kering Dimanfaatkan (kg)', type: 'number', min: 0, required: true },
          { name: 'chaff_actual_use_date', label: 'Tanggal Bukti Penggunaan Aktual', type: 'date', required: true }
        ]
      }
    ]
  },

  VERIFIER_AUDITOR: {
    roleCode: 'VERIFIER_AUDITOR',
    roleName: 'Verifikator Independen & Auditor (Verifier / Auditor)',
    stage: 'ALL',
    defaultBoundary: 'INDEPENDENT_AUDIT',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Audit Pengaman Non-Kompensasi (Safeguards)',
        description: 'Pemeriksaan 5 isu kritis mutlak. Status: PASS, FAIL, atau UNKNOWN',
        fields: [
          { name: 'FORCED_LABOR', label: 'Bebas Kerja Paksa', type: 'select', options: ['PASS', 'FAIL', 'UNKNOWN'], required: true },
          { name: 'CHILD_LABOR', label: 'Bebas Pekerja Anak yang Dilarang', type: 'select', options: ['PASS', 'FAIL', 'UNKNOWN'], required: true },
          { name: 'DEFORESTATION', label: 'Bebas Deforestasi (EUDR / Acuan GCP)', type: 'select', options: ['PASS', 'FAIL', 'UNKNOWN'], required: true },
          { name: 'BANNED_PESTICIDES', label: 'Bebas Pestisida Terlarang (WHO Class 1a/1b / Regulasi)', type: 'select', options: ['PASS', 'FAIL', 'UNKNOWN'], required: true },
          { name: 'SEVERE_POLLUTION', label: 'Bebas Pencemaran Berat yang Belum Ditangani', type: 'select', options: ['PASS', 'FAIL', 'UNKNOWN'], required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Validasi Bukti Fisik & Penggunaan Aktual',
        description: 'Pemeriksaan timbang, meteran, transaksi, dan tanggal penggunaan',
        fields: [
          { name: 'evidence_audit_status', label: 'Status Audit Seluruh Berkas Bukti', type: 'select', options: ['VERIFIED', 'REQUIRES_REVISION', 'REJECTED'], required: true },
          { name: 'auditor_notes', label: 'Catatan & Temuan Audit Lapangan', type: 'textarea', required: true },
          { name: 'publication_authorized', label: 'Otorisasi Publikasi Skor ke Paspor Digital / QR (PUBLISHED)', type: 'boolean', default: false }
        ]
      }
    ]
  },

  FARMER_GROUP: {
    roleCode: 'FARMER_GROUP',
    roleName: 'Kelompok Tani (Managing Entity)',
    stage: 'FARMER_GROUP',
    defaultBoundary: 'COLLECTION_POINT',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Titik Kumpul Ceri & Logbook Penerimaan',
        description: 'Pencatatan ceri dari petani anggota, penimbangan, dan alokasi lot',
        fields: [
          { name: 'group_id', label: 'ID Kelompok Tani', type: 'text', required: true },
          { name: 'collection_date', label: 'Tanggal Titik Kumpul', type: 'date', required: true },
          { name: 'total_cherry_kg', label: 'Total Ceri Diterima (kg)', type: 'number', min: 0, required: true },
          { name: 'service_fee_collected_idr', label: 'Biaya Jasa Titik Kumpul (Rp 500/kg)', type: 'number', min: 0, required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Tata Kelola ICS & Checklist ME (33 CP)',
        description: 'Pemenuhan kriteria Managing Entity dan dokumen kelembagaan',
        fields: [
          { name: 'active_farmers_count', label: 'Jumlah Petani Aktif Periode Ini', type: 'number', min: 1, required: true },
          { name: 'internal_inspections_completed', label: 'Inspeksi Internal Selesai Dilakukan', type: 'number', min: 0, required: true },
          { name: 'me_checkpoints_met', label: 'Kepatuhan Checklist Managing Entity (ME01–ME33)', type: 'number', min: 0, max: 33, required: true }
        ]
      }
    ]
  },

  COFFEE_SHOP: {
    roleCode: 'COFFEE_SHOP',
    roleName: 'Coffee Shop (Café & Retail)',
    stage: 'COFFEE_SHOP',
    defaultBoundary: 'CAFE_RETAIL_GATE',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Penerimaan Roasted Bean & Penyeduhan',
        description: 'Input roasted bean terlacak dan penyajian kopi',
        fields: [
          { name: 'cafe_id', label: 'ID Coffee Shop', type: 'text', required: true },
          { name: 'roasted_bean_used_kg', label: 'Roasted Bean Digunakan (kg)', type: 'number', min: 0, required: true },
          { name: 'cups_served_count', label: 'Jumlah Cangkir Disajikan', type: 'number', min: 0, required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Valorisasi Ampas Kopi / SCG (BVC Café)',
        description: 'Pencatatan ampas kopi dan penyaluran untuk kompos / briket',
        fields: [
          { name: 'scg_generated_dry_kg', label: 'Ampas Kopi Kering Dihasilkan (kg)', type: 'number', min: 0, required: true },
          { name: 'scg_destination', label: 'Tujuan Pemanfaatan (Kompos/Briket/Bahan Organik)', type: 'text', required: true },
          { name: 'scg_utilized_dry_kg', label: 'Ampas Kopi yang Dimanfaatkan (kg)', type: 'number', min: 0, required: true },
          { name: 'passport_qr_displayed', label: 'Paspor Digital QR Ditampilkan ke Konsumen', type: 'boolean', default: true }
        ]
      }
    ]
  },

  BUYER: {
    roleCode: 'BUYER',
    roleName: 'Buyer (Pembeli / Offtaker / Eksportir)',
    stage: 'BUYER',
    defaultBoundary: 'MARKET_DESTINATION',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Verifikasi Pra-Beli & Kepatuhan EUDR',
        description: 'Pemeriksaan skor 3 indeks, bukti bebas deforestasi, dan kontrak pembelian',
        fields: [
          { name: 'buyer_id', label: 'ID Buyer / Eksportir', type: 'text', required: true },
          { name: 'lot_id_purchased', label: 'ID Lot Kopi yang Dibeli', type: 'text', required: true },
          { name: 'contract_volume_kg', label: 'Volume Kontrak (kg)', type: 'number', min: 0, required: true },
          { name: 'eudr_due_diligence_passed', label: 'Hasil Uji Tuntas EUDR Memenuhi Syarat', type: 'boolean', default: true },
          { name: 'minimum_ct4ci_met', label: 'Kesiapan Kepatuhan Internal CT-4CI Diterima', type: 'boolean', default: true }
        ]
      }
    ]
  },

  ICS_VERIFIER_FARMER: {
    roleCode: 'ICS_VERIFIER_FARMER',
    roleName: 'Verifikator / ICS untuk Petani',
    stage: 'FARMER',
    defaultBoundary: 'INSPECTION_FARMER',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Inspeksi Kebun & Validasi Plot Geodata',
        description: 'Pemeriksaan batas koordinat plot, bebas deforestasi (P070), dan kebun',
        fields: [
          { name: 'farmer_id', label: 'ID Petani Diperiksa', type: 'text', required: true },
          { name: 'plot_verified', label: 'Plot Koordinat & Poligon Terverifikasi di Lapangan', type: 'boolean', required: true },
          { name: 'p070_deforestation_free', label: 'P070: Lahan Bebas Deforestasi Pasca 2020', type: 'select', options: ['COMPLIANT', 'NON_COMPLIANT'], required: true },
          { name: 'p075_banned_chem_free', label: 'P075: Bebas Bahan Kimia Dilarang (Paraquat, dll)', type: 'select', options: ['COMPLIANT', 'NON_COMPLIANT'], required: true }
        ]
      },
      {
        stepNumber: 2,
        stepTitle: 'Penilaian 108 Checkpoint 4C Producer & Bukti',
        description: 'Penetapan status Applicability (Ai), Kecukupan Bukti (Vi), dan Kepatuhan (Ci)',
        fields: [
          { name: 'producer_checkpoints_evaluated', label: 'Jumlah Checkpoint Diperiksa (dari 108 CP)', type: 'number', min: 1, max: 108, required: true },
          { name: 'major_gate_status', label: 'Status Major Gate 4C', type: 'select', options: ['PASSED', 'UNRESOLVED'], required: true },
          { name: 'inspection_report_uri', label: 'Unggah Berita Acara Inspeksi Lapangan', type: 'file_or_uri', required: true }
        ]
      }
    ]
  },

  ICS_VERIFIER_PROCESSOR: {
    roleCode: 'ICS_VERIFIER_PROCESSOR',
    roleName: 'ICS untuk Pengolah',
    stage: 'PROCESSOR',
    defaultBoundary: 'AUDIT_PROCESSOR',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Audit Neraca Massa Cascara & Meter Air/Energi',
        description: 'Verifikasi bukti timbang BVC, resirkulasi air WC, dan energi terbarukan RE',
        fields: [
          { name: 'processor_id', label: 'ID Fasilitas Pengolah', type: 'text', required: true },
          { name: 'bvc_mass_balance_verified', label: 'Neraca Massa Cascara Terverifikasi (Dry Kg <= Origin)', type: 'boolean', required: true },
          { name: 'bvc_actual_use_proof_valid', label: 'Bukti Penggunaan Aktual (Pupuk/Pakan) Diterima', type: 'boolean', required: true },
          { name: 'water_recycle_meter_verified', label: 'Meteran Air Baru & Resirkulasi Dikalibrasi', type: 'boolean', required: true },
          { name: 'service_provider_cps_met', label: 'Checklist Service Provider Terpenuhi (dari 83 CP)', type: 'number', min: 0, max: 83, required: true }
        ]
      }
    ]
  },

  VERIFIER_WAREHOUSE: {
    roleCode: 'VERIFIER_WAREHOUSE',
    roleName: 'Verifikator Gudang',
    stage: 'WAREHOUSE',
    defaultBoundary: 'AUDIT_WAREHOUSE',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Audit Mutu Fisik & Integritas Penyimpanan',
        description: 'Pemeriksaan alat ukur kadar air, defect count, dan kebersihan gudang',
        fields: [
          { name: 'warehouse_id', label: 'ID Fasilitas Gudang', type: 'text', required: true },
          { name: 'moisture_calibration_valid', label: 'Kalibrasi Moisture Tester Terverifikasi Sah', type: 'boolean', required: true },
          { name: 'storage_sanitation_pass', label: 'Sanitasi & Bebas Kontaminasi Kimia Memenuhi Syarat', type: 'boolean', required: true },
          { name: 'grainpro_packaging_certified', label: 'Kemasan Karung Ekspor Memenuhi Standar Sirkular', type: 'boolean', required: true }
        ]
      }
    ]
  },

  VERIFIER_ROASTERY: {
    roleCode: 'VERIFIER_ROASTERY',
    roleName: 'Verifikator Roastery',
    stage: 'ROASTERY',
    defaultBoundary: 'AUDIT_ROASTERY',
    steps: [
      {
        stepNumber: 1,
        stepTitle: 'Audit Energi Roasting & Valorisasi Kulit Ari (Chaff)',
        description: 'Verifikasi meteran energi sangrai kWh eq dan penyaluran chaff silverskin',
        fields: [
          { name: 'roastery_id', label: 'ID Fasilitas Roastery', type: 'text', required: true },
          { name: 'roasting_energy_verified_kwh', label: 'Konsumsi Energi Terverifikasi (kWh eq)', type: 'number', min: 0, required: true },
          { name: 'chaff_valorization_proof_valid', label: 'Bukti Valorisasi Chaff Kulit Ari Terverifikasi', type: 'boolean', required: true },
          { name: 'k3_roasting_standard_met', label: 'Standar K3 & Penanganan Emisi Sangrai Terpenuhi', type: 'boolean', required: true }
        ]
      }
    ]
  }
};
