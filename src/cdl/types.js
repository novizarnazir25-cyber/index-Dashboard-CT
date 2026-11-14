/**
 * CIRCULARTRACE COMMON DATA LAYER (CDL) - Types & Constants
 * Method Specifications: CT-CCI-Lite-1.0 & CT-SDI-Lite-1.0
 * Prepared for Prof. Dr. Novizar Nazir (4 October 2026)
 */

export const SystemBoundaryStage = {
  FARMER: 'FARMER',
  PROCESSOR: 'PROCESSOR',
  WAREHOUSE_EXPORTER: 'WAREHOUSE_EXPORTER',
  ROASTERY: 'ROASTERY'
};

export const DataQualitySourceType = {
  MEASURED: 'MEASURED',
  ESTIMATED: 'ESTIMATED',
  SECONDARY: 'SECONDARY'
};

export const PathwayCategory = {
  MATERIAL_BIOLOGICAL: 'MATERIAL_BIOLOGICAL', // VF = 1.00
  ENERGY_RECOVERY: 'ENERGY_RECOVERY',         // VF = 0.50
  DISPOSAL_OR_UNUSED: 'DISPOSAL_OR_UNUSED'    // VF = 0.00
};

export const ValorizationFactors = {
  [PathwayCategory.MATERIAL_BIOLOGICAL]: 1.00,
  [PathwayCategory.ENERGY_RECOVERY]: 0.50,
  [PathwayCategory.DISPOSAL_OR_UNUSED]: 0.00
};

export const SafeguardStatus = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  UNKNOWN: 'UNKNOWN'
};

export const SafeguardIssues = {
  FORCED_LABOR: 'FORCED_LABOR',
  CHILD_LABOR: 'CHILD_LABOR',
  DEFORESTATION: 'DEFORESTATION',
  BANNED_PESTICIDES: 'BANNED_PESTICIDES',
  SEVERE_POLLUTION: 'SEVERE_POLLUTION'
};

export const CalculationStatus = {
  DRAFT: 'DRAFT',
  READY_FOR_REVIEW: 'READY_FOR_REVIEW',
  VERIFIED: 'VERIFIED',
  PUBLISHED: 'PUBLISHED',
  BLOCKED: 'BLOCKED'
};

export const ApplicabilityType = {
  APPLICABLE: 'APPLICABLE',
  NOT_APPLICABLE: 'NOT_APPLICABLE'
};

export const ManagerialCategory = {
  LOW: 'rendah',         // 0 - <40
  EARLY: 'awal',         // 40 - <60
  DEVELOPING: 'berkembang', // 60 - <80
  HIGH: 'tinggi'         // 80 - 100
};

export function getManagerialCategory(score) {
  if (score === null || score === undefined || isNaN(score)) return 'N/A';
  if (score < 40) return ManagerialCategory.LOW;
  if (score < 60) return ManagerialCategory.EARLY;
  if (score < 80) return ManagerialCategory.DEVELOPING;
  return ManagerialCategory.HIGH;
}
