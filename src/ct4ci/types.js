/**
 * CIRCULARTRACE - CT-4CI & ICS Types & Constants
 * Based on 4C Code of Conduct v4.1, Paper Sections 3.11 & 3.12, and CT-IDSM
 */

export const UserRole = {
  FARMER: 'FARMER',
  ICS_OPERATOR: 'ICS_OPERATOR',
  VERIFIER: 'VERIFIER',
  MANAGER: 'MANAGER',
  METHODOLOGY_ADMIN: 'METHODOLOGY_ADMIN',
  REVIEWER: 'REVIEWER'
};

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
