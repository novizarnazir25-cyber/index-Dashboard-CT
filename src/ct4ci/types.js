/**
 * CIRCULARTRACE - CT-4CI & ICS Types & Constants
 * Based on 4C Code of Conduct v4.1, Paper Sections 3.11 & 3.12, and CT-IDSM
 */

export const UserRole = {
  // 1. Supply Chain Operators (Pelaku Rantai Pasok)
  FARMER: 'FARMER',                               // 1. Petani
  FARMER_GROUP: 'FARMER_GROUP',                   // 2. Kelompok Tani (Managing Entity)
  PROCESSOR: 'PROCESSOR',                         // 3. Pengolah (Wet & Dry Mill)
  WAREHOUSE: 'WAREHOUSE',                         // 4. Gudang & Penyimpanan Transit
  ROASTERY: 'ROASTERY',                           // 5. Roasting (Penyangrai Kopi)
  COFFEE_SHOP: 'COFFEE_SHOP',                     // 6. Coffee Shop & Café Ritel
  BUYER: 'BUYER',                                 // 7. Buyer (Pembeli & Eksportir)

  // 2. Verification & Inspection Actors (Pelaku Verifikasi & ICS)
  ICS_VERIFIER_FARMER: 'ICS_VERIFIER_FARMER',     // 8. Verifikator / ICS untuk Petani
  ICS_VERIFIER_PROCESSOR: 'ICS_VERIFIER_PROCESSOR', // 9. ICS untuk Pengolah
  VERIFIER_WAREHOUSE: 'VERIFIER_WAREHOUSE',       // 10. Verifikator Gudang
  VERIFIER_ROASTERY: 'VERIFIER_ROASTERY',         // 11. Verifikator Roastery

  // 3. Administrative & Governance Roles (Backward Compatibility)
  VERIFIER: 'VERIFIER',                           // General Verifier / Lead Auditor
  ICS_OPERATOR: 'ICS_OPERATOR',                   // Field ICS Operator
  MANAGER: 'MANAGER',                             // Project & Supply Chain Manager
  METHODOLOGY_ADMIN: 'METHODOLOGY_ADMIN',         // Methodology Administrator
  REVIEWER: 'REVIEWER'                            // Independent Reviewer
};

export const StakeholderCategory = {
  SUPPLY_CHAIN_OPERATOR: 'SUPPLY_CHAIN_OPERATOR',
  VERIFICATION_AUDITOR: 'VERIFICATION_AUDITOR',
  COMMERCIAL_BUYER: 'COMMERCIAL_BUYER',
  GOVERNANCE: 'GOVERNANCE'
};

/**
 * 11 Synchronized Stakeholders Registry
 * Aligns the supply chain stages with dedicated verification actors.
 */
export const SYNCHRONIZED_STAKEHOLDERS = [
  {
    roleCode: UserRole.FARMER,
    name: 'Petani (Farmer)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'FARMER_GATE',
    stageOrder: 1,
    description: 'Pelaku budidaya kopi di tingkat kebun/plot. Menginput praktik kebun, logbook panen, konfirmasi data, dan sanggahan.',
    relatedIndices: ['CT-4CI (Producer 108 CP)', 'CT-CCI (Bahan Masuk CMI)', 'CT-SDI (E1, S1, Ec1)'],
    governingCheckpoints: '4C Producer Module (P001–P108)',
    pairedVerifierRole: UserRole.ICS_VERIFIER_FARMER,
    pairedVerifierTitle: 'Verifikator / ICS untuk Petani',
    keyEvidenceTypes: ['Foto geotagging plot', 'Logbook panen', 'Kuitansi pembelian pupuk hayati', 'Bukti pelatihan GAP/K3']
  },
  {
    roleCode: UserRole.FARMER_GROUP,
    name: 'Kelompok Tani (Farmer Group)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'COLLECTION_POINT',
    stageOrder: 2,
    description: 'Pengorganisasi petani, titik kumpul ceri kopi kolektif, pengelola ICS tingkat kelompok, dan penjaminan ketertelusuran lot panen.',
    relatedIndices: ['CT-4CI (Managing Entity 33 CP)', 'CT-SDI (G1, G2, Ec2)'],
    governingCheckpoints: '4C Managing Entity Module (ME001–ME033)',
    pairedVerifierRole: UserRole.ICS_VERIFIER_FARMER,
    pairedVerifierTitle: 'Verifikator / ICS untuk Petani',
    keyEvidenceTypes: ['Buku register anggota petani', 'Catatan timbang ceri di titik kumpul', 'SOP ICS kelompok', 'Alokasi anggaran layanan Rp 500/kg']
  },
  {
    roleCode: UserRole.PROCESSOR,
    name: 'Pengolah (Processor / Wet/Dry Mill)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'PROCESSING_FACILITY',
    stageOrder: 3,
    description: 'Unit pengolahan ceri kopi menjadi green bean. Mencatat aliran massa biomassa kulit/cascara (BVC), konsumsi air resirkulasi (WC), dan energi terbarukan (RE).',
    relatedIndices: ['CT-CCI (BVC 45%, WC 20%, RE 15%, CMI 20%)', 'CT-SDI (E1–E3, S1–S3, Ec1–Ec3, G1–G3)', 'CT-4CI (Service Provider 83 CP)'],
    governingCheckpoints: '4C Service Provider Module (SP001–SP083) & Neraca Massa CDL',
    pairedVerifierRole: UserRole.ICS_VERIFIER_PROCESSOR,
    pairedVerifierTitle: 'ICS untuk Pengolah',
    keyEvidenceTypes: ['Neraca timbang cascara basah & kering', 'Meteran air proses pulper & resirkulasi', 'Catatan konsumsi kWh solar dome & listrik', 'BAST serah terima pupuk kompos cascara']
  },
  {
    roleCode: UserRole.WAREHOUSE,
    name: 'Gudang (Warehouse & Storage)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'WAREHOUSE_QA_GATE',
    stageOrder: 4,
    description: 'Fasilitas penyimpanan dan transit green bean, pengujian mutu laboratorium (kadar air, defect, cupping), pengemasan ekspor, dan pengendalian suhu/kelembaban.',
    relatedIndices: ['CT-CCI (Kemasan Ekspor Daur Ulang CMI)', 'CT-SDI (Ec3 Mutu Kontrak, G1 Keterlacakan Dokumen)'],
    governingCheckpoints: 'Standar Penyimpanan Kopi, Uji Mutu SCAA, & CDL Transfer Integrity',
    pairedVerifierRole: UserRole.VERIFIER_WAREHOUSE,
    pairedVerifierTitle: 'Verifikator Gudang',
    keyEvidenceTypes: ['Hasil uji kadar air (<12.5%) & defect count', 'Lembar cupping score laboratorium', 'Sertifikat karung GrainPro/goni daur ulang', 'BAST penerimaan dan pengeluaran lot']
  },
  {
    roleCode: UserRole.ROASTERY,
    name: 'Roasting (Roastery / Penyangrai)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'ROASTERY_GATE',
    stageOrder: 5,
    description: 'Fasilitas penyangraian green bean menjadi roasted bean. Mencatat profil sangrai, rendemen yield, konsumsi energi roaster (gas/listrik), dan valorisasi kulit ari (chaff/silverskin).',
    relatedIndices: ['CT-CCI (BVC Silverskin Chaff, RE Roasting)', 'CT-SDI (E2 Efisiensi Energi, S2 K3 Sangrai)'],
    governingCheckpoints: 'Standar Operasi Roastery & Pemanfaatan Sampingan Kering CDL',
    pairedVerifierRole: UserRole.VERIFIER_ROASTERY,
    pairedVerifierTitle: 'Verifikator Roastery',
    keyEvidenceTypes: ['Logbook batch roasting & yield rendemen', 'Catatan meteran gas & listrik mesin roaster', 'Bukti penyaluran chaff silverskin ke pakan/kompos', 'SOP K3 & APD operator roaster']
  },
  {
    roleCode: UserRole.COFFEE_SHOP,
    name: 'Coffee Shop (Café & Retail)',
    category: StakeholderCategory.SUPPLY_CHAIN_OPERATOR,
    supplyChainStage: 'CAFE_RETAIL_GATE',
    stageOrder: 6,
    description: 'Titik hilir penyajian kopi kepada konsumen akhir. Mencatat penyeduhan, pengelolaan ampas kopi (Spent Coffee Grounds / SCG), paspor digital lot QR, dan transparansi asal kebun.',
    relatedIndices: ['CT-CCI (BVC Ampas Kopi / SCG)', 'CT-SDI (G1 Transparansi Konsumen, E3 Pengelolaan Residu)'],
    governingCheckpoints: 'Standar Sirkularitas Ritel & Paspor Digital Konsumen',
    pairedVerifierRole: UserRole.VERIFIER_ROASTERY,
    pairedVerifierTitle: 'Verifikator Roastery / Retail Auditor',
    keyEvidenceTypes: ['Catatan penimbangan ampas kopi harian', 'Tanda terima penyaluran ampas kopi ke pembuat kompos/briket', 'Display Paspor Digital QR pada kemasan/menu']
  },
  {
    roleCode: UserRole.BUYER,
    name: 'Buyer (Pembeli / Offtaker / Eksportir)',
    category: StakeholderCategory.COMMERCIAL_BUYER,
    supplyChainStage: 'MARKET_DESTINATION',
    stageOrder: 7,
    description: 'Entitas pembeli komersial kopi (green bean/roasted bean). Memeriksa integritas rantai pasok, sertifikat kepatuhan pra-audit CT-4CI, skor sirkularitas CT-CCI, keberlanjutan CT-SDI, serta kepatuhan EUDR.',
    relatedIndices: ['Review Komprehensif: CT-4CI, CT-CCI, CT-SDI & EUDR Due Diligence'],
    governingCheckpoints: 'Kontrak Pembelian Berkelanjutan & Verifikasi Due Diligence CDL',
    pairedVerifierRole: UserRole.VERIFIER_WAREHOUSE,
    pairedVerifierTitle: 'Verifikator Gudang / Auditor Ekspor',
    keyEvidenceTypes: ['Dokumen Purchase Order & Kontrak Pembelian', 'Laporan Due Diligence EUDR & Titik Poligon Plot', 'Verifikasi Digital Product Passport (DPP)']
  },
  {
    roleCode: UserRole.ICS_VERIFIER_FARMER,
    name: 'Verifikator / ICS untuk Petani',
    category: StakeholderCategory.VERIFICATION_AUDITOR,
    supplyChainStage: 'INSPECTION_FARMER',
    stageOrder: 8,
    description: 'Auditor/inspektur internal ICS yang bertugas memeriksa kebun, plot, batas poligon, praktik budidaya, kepatuhan 108 checkpoint Producer, kecukupan bukti, dan validasi perbaikan CAPA petani.',
    relatedIndices: ['Verifikasi CT-4CI (108 CP)', 'Verifikasi EC (Evidence Coverage)', 'Major Gate Status'],
    governingCheckpoints: '4C Producer Checkpoints (P1–P108) & Prosedur Audit Internal ICS',
    pairedVerifierRole: UserRole.FARMER,
    pairedVerifierTitle: 'Mitra Periksa: Petani & Kelompok Tani',
    keyEvidenceTypes: ['Berita Acara Inspeksi Kebun Tahunan', 'Laporan Verifikasi GPS & Uji Tumpang Tindih Kawasan Hutan', 'Persetujuan Kecukupan Bukti & Status Major Gate']
  },
  {
    roleCode: UserRole.ICS_VERIFIER_PROCESSOR,
    name: 'ICS untuk Pengolah',
    category: StakeholderCategory.VERIFICATION_AUDITOR,
    supplyChainStage: 'AUDIT_PROCESSOR',
    stageOrder: 9,
    description: 'Inspektur teknis yang memverifikasi fasilitas pengolahan basah dan kering: validitas neraca massa biomassa cascara (BVC), meteran air resirkulasi (WC), energi terbarukan (RE), dan standar fasilitas pengolah (83 CP).',
    relatedIndices: ['Verifikasi CT-CCI (BVC, WC, RE)', 'Verifikasi 4C Service Provider Module (83 CP)', 'Verifikasi Limbah E1'],
    governingCheckpoints: 'Metodologi Formula CT-CCI & 4C Service Provider Checklist',
    pairedVerifierRole: UserRole.PROCESSOR,
    pairedVerifierTitle: 'Mitra Periksa: Unit Fasilitas Pengolah',
    keyEvidenceTypes: ['Laporan Audit Neraca Massa Cascara', 'Verifikasi Kalibrasi Meter Air & Logbook Pengolahan', 'Hasil Uji Kualitas Air Limbah Pencucian Ceri']
  },
  {
    roleCode: UserRole.VERIFIER_WAREHOUSE,
    name: 'Verifikator Gudang',
    category: StakeholderCategory.VERIFICATION_AUDITOR,
    supplyChainStage: 'AUDIT_WAREHOUSE',
    stageOrder: 10,
    description: 'Auditor mutu dan integritas gudang penyimpanan: memverifikasi kalibrasi alat ukur moisture meter, kebersihan gudang, pencegahan kontaminasi silang, kemasan bersertifikat, dan keterlacakan lot CDL ekspor.',
    relatedIndices: ['Verifikasi Mutu Green Bean Ec3', 'Verifikasi Kemasan CMI', 'Verifikasi Integritas Lot G1'],
    governingCheckpoints: 'Standar Mutu Fisik Kopi Ekspor & Integritas Penyimpanan',
    pairedVerifierRole: UserRole.WAREHOUSE,
    pairedVerifierTitle: 'Mitra Periksa: Gudang & Eksportir',
    keyEvidenceTypes: ['Berita Acara Kalibrasi Alat Ukur Kadar Air', 'Laporan Inspeksi Sanitasi & Pengendalian Hama Gudang', 'Log Verifikasi Keterlacakan Lot Keluar-Masuk']
  },
  {
    roleCode: UserRole.VERIFIER_ROASTERY,
    name: 'Verifikator Roastery',
    category: StakeholderCategory.VERIFICATION_AUDITOR,
    supplyChainStage: 'AUDIT_ROASTERY',
    stageOrder: 11,
    description: 'Auditor fasilitas sangrai dan ritel kopi: memverifikasi catatan energi sangrai (kWh eq), rendemen sangrai, pemanfaatan sampingan kulit ari silverskin (BVC), standar K3 mesin sangrai, dan alur ampas kopi café.',
    relatedIndices: ['Verifikasi BVC Silverskin Chaff', 'Verifikasi Efisiensi Energi Roasting E2', 'Verifikasi K3 S2'],
    governingCheckpoints: 'Standar Operasional Penyangraian & Sirkularitas Hilir',
    pairedVerifierRole: UserRole.ROASTERY,
    pairedVerifierTitle: 'Mitra Periksa: Roastery & Coffee Shop',
    keyEvidenceTypes: ['Laporan Verifikasi Konsumsi Energi Roaster', 'Bukti Audit Valorisasi Chaff Kulit Ari', 'Checklist Kepatuhan K3 & Penanganan Kebakaran Roastery']
  }
];

export const CheckpointModule = {
  PRODUCER: 'PRODUCER',                 // 108 Checkpoints (P1..P108)
  MANAGING_ENTITY: 'MANAGING_ENTITY',   // 33 Checkpoints (ME1..ME33)
  SERVICE_PROVIDER: 'SERVICE_PROVIDER'  // 83 Checkpoints (SP1..SP83)
};

export const DimensionType = {
  ECONOMIC: 'ECONOMIC',
  SOCIAL: 'SOCIAL',
  ENVIRONMENTAL: 'ENVIRONMENTAL',
  GOVERNANCE: 'GOVERNANCE'
};

// 3 Separate decisions as mandated by paper Section 3.11 / User prompt item 8
export const ApplicabilityDecision = {
  APPLICABLE: 'APPLICABLE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',     // Requires verifier approval & recorded justification
  UNDECIDED: 'UNDECIDED'                // Baseline candidate: included in denominator, no numerator credit
};

export const EvidenceSufficiency = {
  NOT_AVAILABLE: 'NOT_AVAILABLE',               // Belum tersedia
  PENDING_VERIFICATION: 'PENDING_VERIFICATION', // Menunggu verifikasi
  INSUFFICIENT: 'INSUFFICIENT',                 // Tidak cukup / ditolak
  SUFFICIENT: 'SUFFICIENT',                     // Cukup dan diterima
  NEEDS_REVIEW: 'NEEDS_REVIEW'                  // Perlu peninjauan ulang
};

export const ComplianceResult = {
  COMPLIANT: 'COMPLIANT',             // Sesuai (Ci = 1)
  NON_COMPLIANT: 'NON_COMPLIANT',     // Tidak sesuai (Ci = 0)
  UNDETERMINED: 'UNDETERMINED'        // Belum dapat ditentukan (Ci = 0)
};

export const AssessmentScope = {
  PRODUCER_WIDE: 'PRODUCER_WIDE',
  PER_PLOT_ALL_MUST_PASS: 'PER_PLOT_ALL_MUST_PASS',
  GROUP_WIDE: 'GROUP_WIDE',
  FACILITY_WIDE: 'FACILITY_WIDE'
};

export const MajorGateStatus = {
  PASSED: 'PASSED',
  UNRESOLVED: 'UNRESOLVED'
};

export const CalculationResultStatus = {
  CALCULATED: 'CALCULATED',
  PROVISIONAL: 'PROVISIONAL',
  CANNOT_CALCULATE: 'CANNOT_CALCULATE'
};

export const PracticeCategory = {
  SOIL_CROP: 'SOIL_CROP',               // Pengelolaan tanah dan tanaman
  PEST_CHEMICAL: 'PEST_CHEMICAL',       // Pengelolaan hama dan bahan kimia
  WATER_WASTE_ENV: 'WATER_WASTE_ENV',   // Air, limbah, dan lingkungan
  LABOR_SAFETY: 'LABOR_SAFETY',         // Tenaga kerja dan keselamatan
  ECON_INST: 'ECON_INST'                // Ekonomi dan kelembagaan
};

export const FarmerConfirmationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  DISPUTED: 'DISPUTED'
};

export const ConfirmationMethod = {
  DIGITAL_APP: 'DIGITAL_APP',
  ORAL_ASSISTED: 'ORAL_ASSISTED',
  PHYSICAL_SIGNATURE: 'PHYSICAL_SIGNATURE'
};

export const CapaIssueType = {
  MAJOR_NON_COMPLIANT: 'MAJOR_NON_COMPLIANT',
  MAJOR_INSUFFICIENT_EVIDENCE: 'MAJOR_INSUFFICIENT_EVIDENCE',
  MINOR_GAP: 'MINOR_GAP',
  DATA_QUALITY: 'DATA_QUALITY'
};

export const CapaStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
};

export const IdsmRuleId = {
  DQ_01: 'DQ-01', // Data wajib hilang / tidak valid
  DQ_02: 'DQ-02', // Transaksi duplikat / konflik alokasi
  EV_01: 'EV-01', // Applicability atau bukti belum selesai
  CF_01: 'CF-01', // Major terbukti tidak sesuai
  CF_02: 'CF-02', // Major belum terbukti sesuai
  MB_01: 'MB-01', // Neraca bahan kering melebihi toleransi
  OP_01: 'OP-01', // Biaya tindakan wajib melebihi anggaran
  OP_02: 'OP-02'  // Biaya / anggaran belum valid
};

export const IdsmRuleStatus = {
  TRIGGERED: 'TRIGGERED',
  NOT_TRIGGERED: 'NOT_TRIGGERED',
  NOT_EVALUABLE: 'NOT_EVALUABLE',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
};

export const BannedPesticideSubstances = [
  { name: 'Paraquat', activeIngredient: 'Paraquat dichloride', casNumber: '1910-42-5', bannedSince: '2020-01-01', status: 'BANNED' },
  { name: 'Endosulfan', activeIngredient: 'Endosulfan', casNumber: '115-29-7', bannedSince: '2012-01-01', status: 'BANNED' },
  { name: 'Monocrotophos', activeIngredient: 'Monocrotophos', casNumber: '6923-22-4', bannedSince: '2010-01-01', status: 'BANNED' },
  { name: 'Aldicarb', activeIngredient: 'Aldicarb', casNumber: '116-06-3', bannedSince: '2010-01-01', status: 'BANNED' },
  { name: 'Chlorpyrifos', activeIngredient: 'Chlorpyrifos', casNumber: '2921-88-2', bannedSince: '2022-01-01', status: 'RESTRICTED_BANNED' },
  { name: 'Methyl Parathion', activeIngredient: 'Methyl Parathion', casNumber: '298-00-0', bannedSince: '2010-01-01', status: 'BANNED' }
];
