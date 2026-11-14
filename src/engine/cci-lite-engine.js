/**
 * CIRCULARTRACE - CT-CCI-Lite-1.0 Calculation Engine
 *
 * Formula:
 * CT-CCI = 100 * [0.20 * CMI + 0.45 * BVC + 0.20 * WC + 0.15 * RE]
 *
 * Rules:
 * 1. Simpan presisi penuh (floating-point double), pembulatan 2 desimal hanya saat display.
 * 2. CMI: Circular support mass / Total support mass. Virgin bio-based does NOT automatically count.
 *    If no support materials exist -> CMI is NOT_APPLICABLE; weights 0.45, 0.20, 0.15 divided by 0.80.
 * 3. BVC: Sum(utilized_dry_kg * VF) / total_generated_dry_kg.
 *    VF: Material/Biological = 1.00, Energy = 0.50, Disposal/Unused = 0.00.
 *    Actual use evidence/date required for numerator; unproven claims get VF 0.0 in numerator.
 *    Potential BVC calculated separately for draft visibility.
 * 4. WC: water_reused / (water_new + water_reused).
 * 5. RE: renewable_and_recovered_energy / total_energy.
 *    If total energy is missing -> RE is null and CCI is DRAFT (never assumed zero).
 */

import { PathwayCategory, ValorizationFactors, ApplicabilityType } from '../cdl/types.js';
import { ValidationError, validateProportion } from '../cdl/validator.js';

export class CciLiteEngine {
  static calculate(inputs) {
    const {
      materialInputs = [],
      byproductOrigins = [],
      byproductDestinations = [],
      utilities = {}
    } = inputs;

    const baseWeights = {
      CMI: 0.20,
      BVC: 0.45,
      WC: 0.20,
      RE: 0.15
    };

    const componentScores = {
      CMI: null,
      BVC: null,
      WC: null,
      RE: null
    };

    const componentApplicability = {
      CMI: ApplicabilityType.APPLICABLE,
      BVC: ApplicabilityType.APPLICABLE,
      WC: ApplicabilityType.APPLICABLE,
      RE: ApplicabilityType.APPLICABLE
    };

    const breakdownDetails = {};

    // =========================================================================
    // 1. CMI (Circular Material Input)
    // =========================================================================
    let totalSupportKg = 0;
    let circularSupportKg = 0;

    for (const mat of materialInputs) {
      const tot = Number(mat.total_kg || 0);
      const circ = Number(mat.circular_kg || 0);
      validateProportion(circ, tot, `Bahan Pendukung (${mat.material_type || mat.flow_id})`);
      totalSupportKg += tot;
      circularSupportKg += circ;
    }

    if (materialInputs.length === 0 || totalSupportKg === 0) {
      // Rule: Tidak ada bahan pendukung yang sah -> CMI NOT_APPLICABLE
      componentApplicability.CMI = ApplicabilityType.NOT_APPLICABLE;
      componentScores.CMI = null;
      breakdownDetails.cmi = {
        totalSupportKg: 0,
        circularSupportKg: 0,
        applicability: ApplicabilityType.NOT_APPLICABLE,
        note: 'Tidak ada aktivitas bahan pendukung terukur; CMI NOT_APPLICABLE, bobot dinormalisasi ulang.'
      };
    } else {
      componentApplicability.CMI = ApplicabilityType.APPLICABLE;
      componentScores.CMI = circularSupportKg / totalSupportKg;
      breakdownDetails.cmi = {
        totalSupportKg,
        circularSupportKg,
        value: componentScores.CMI,
        applicability: ApplicabilityType.APPLICABLE
      };
    }

    // =========================================================================
    // 2. BVC (Byproduct Valorization Circularity)
    // =========================================================================
    let totalGeneratedDryKg = 0;
    let actualWeightedNumerator = 0;
    let potentialWeightedNumerator = 0;

    const originMap = new Map();
    for (const orig of byproductOrigins) {
      const genDry = Number(orig.generated_dry_kg || 0);
      totalGeneratedDryKg += genDry;
      originMap.set(orig.origin_flow_id, orig);
    }

    for (const dest of byproductDestinations) {
      const utilizedDry = Number(dest.utilized_dry_kg || 0);
      const pathway = dest.pathway || PathwayCategory.DISPOSAL_OR_UNUSED;
      const vf = ValorizationFactors[pathway] ?? 0.0;

      // Check evidence / actual use date
      const hasActualUse = Boolean(dest.actual_use_date && (dest.evidence_id || dest.is_verified_use));

      if (hasActualUse) {
        actualWeightedNumerator += utilizedDry * vf;
      }
      potentialWeightedNumerator += utilizedDry * vf;
    }

    if (totalGeneratedDryKg === 0) {
      componentApplicability.BVC = ApplicabilityType.NOT_APPLICABLE;
      componentScores.BVC = null;
      breakdownDetails.bvc = {
        totalGeneratedDryKg: 0,
        applicability: ApplicabilityType.NOT_APPLICABLE,
        note: 'Tidak ada hasil samping biomassa dihasilkan pada periode ini.'
      };
    } else {
      componentApplicability.BVC = ApplicabilityType.APPLICABLE;
      componentScores.BVC = actualWeightedNumerator / totalGeneratedDryKg;
      breakdownDetails.bvc = {
        totalGeneratedDryKg,
        actualWeightedNumerator,
        potentialWeightedNumerator,
        value: componentScores.BVC,
        potentialBvc: potentialWeightedNumerator / totalGeneratedDryKg,
        applicability: ApplicabilityType.APPLICABLE
      };
    }

    // =========================================================================
    // 3. WC (Water Circularity)
    // =========================================================================
    const waterNew = utilities.water_new_l !== undefined && utilities.water_new_l !== null ? Number(utilities.water_new_l) : null;
    const waterReused = utilities.water_reused_l !== undefined && utilities.water_reused_l !== null ? Number(utilities.water_reused_l) : null;

    if (waterNew === null || waterReused === null) {
      componentApplicability.WC = ApplicabilityType.APPLICABLE;
      componentScores.WC = null; // missing data
      breakdownDetails.wc = {
        waterNew,
        waterReused,
        value: null,
        applicability: ApplicabilityType.APPLICABLE,
        note: 'Data volume air baru atau daur ulang belum lengkap (null).'
      };
    } else if (waterNew + waterReused === 0) {
      componentApplicability.WC = ApplicabilityType.NOT_APPLICABLE;
      componentScores.WC = null;
      breakdownDetails.wc = {
        waterNew: 0,
        waterReused: 0,
        applicability: ApplicabilityType.NOT_APPLICABLE,
        note: 'Proses tidak menggunakan air sama sekali.'
      };
    } else {
      componentApplicability.WC = ApplicabilityType.APPLICABLE;
      componentScores.WC = waterReused / (waterNew + waterReused);
      breakdownDetails.wc = {
        waterNew,
        waterReused,
        totalWater: waterNew + waterReused,
        value: componentScores.WC,
        applicability: ApplicabilityType.APPLICABLE
      };
    }

    // =========================================================================
    // 4. RE (Renewable and Recovered Energy)
    // =========================================================================
    const energyTotal = utilities.energy_total_kwh_eq !== undefined && utilities.energy_total_kwh_eq !== null ? Number(utilities.energy_total_kwh_eq) : null;
    const energyRenewable = utilities.energy_renewable_recovered_union_kwh_eq !== undefined && utilities.energy_renewable_recovered_union_kwh_eq !== null
      ? Number(utilities.energy_renewable_recovered_union_kwh_eq)
      : null;

    if (energyTotal === null) {
      // Rule: Data total energi hilang -> RE null dan CCI DRAFT; TIDAK DIANGGAP NOL
      componentApplicability.RE = ApplicabilityType.APPLICABLE;
      componentScores.RE = null;
      breakdownDetails.re = {
        energyTotal: null,
        energyRenewable,
        value: null,
        applicability: ApplicabilityType.APPLICABLE,
        note: 'Data total energi tidak tersedia (null). Tidak dianggap nol.'
      };
    } else if (energyTotal === 0) {
      componentApplicability.RE = ApplicabilityType.NOT_APPLICABLE;
      componentScores.RE = null;
      breakdownDetails.re = {
        energyTotal: 0,
        energyRenewable: 0,
        applicability: ApplicabilityType.NOT_APPLICABLE,
        note: 'Tidak ada pemakaian energi pada batas fasilitas.'
      };
    } else {
      const renewableVal = energyRenewable !== null ? energyRenewable : 0;
      validateProportion(renewableVal, energyTotal, 'Energi Terbarukan');
      componentApplicability.RE = ApplicabilityType.APPLICABLE;
      componentScores.RE = renewableVal / energyTotal;
      breakdownDetails.re = {
        energyTotal,
        energyRenewable: renewableVal,
        value: componentScores.RE,
        applicability: ApplicabilityType.APPLICABLE
      };
    }

    // =========================================================================
    // 5. Weight Re-normalization for NOT_APPLICABLE components
    // =========================================================================
    let sumApplicableBaseWeight = 0;
    for (const comp of ['CMI', 'BVC', 'WC', 'RE']) {
      if (componentApplicability[comp] === ApplicabilityType.APPLICABLE) {
        sumApplicableBaseWeight += baseWeights[comp];
      }
    }

    const effectiveWeights = {};
    for (const comp of ['CMI', 'BVC', 'WC', 'RE']) {
      if (componentApplicability[comp] === ApplicabilityType.APPLICABLE) {
        effectiveWeights[comp] = sumApplicableBaseWeight > 0 ? baseWeights[comp] / sumApplicableBaseWeight : 0;
      } else {
        effectiveWeights[comp] = 0;
      }
    }

    // =========================================================================
    // 6. Completeness Check & CCI Composite Score
    // =========================================================================
    let isComplete = true;
    let missingComponents = [];

    for (const comp of ['CMI', 'BVC', 'WC', 'RE']) {
      if (componentApplicability[comp] === ApplicabilityType.APPLICABLE && componentScores[comp] === null) {
        isComplete = false;
        missingComponents.push(comp);
      }
    }

    let cciScore = null;
    let draftCciScore = null;

    if (sumApplicableBaseWeight > 0) {
      let draftSum = 0;
      let availableWeightSum = 0;
      let finalSum = 0;

      for (const comp of ['CMI', 'BVC', 'WC', 'RE']) {
        if (componentApplicability[comp] === ApplicabilityType.APPLICABLE) {
          if (componentScores[comp] !== null) {
            draftSum += componentScores[comp] * baseWeights[comp];
            availableWeightSum += baseWeights[comp];
            finalSum += componentScores[comp] * effectiveWeights[comp];
          }
        }
      }

      if (availableWeightSum > 0) {
        draftCciScore = Math.min(Math.max((draftSum / availableWeightSum) * 100, 0), 100);
      }

      if (isComplete) {
        cciScore = Math.min(Math.max(finalSum * 100, 0), 100);
      }
    }

    return {
      formulaVersion: 'CT-CCI-Lite-1.0',
      isComplete,
      missingComponents,
      cciScore: cciScore !== null ? Number(cciScore.toFixed(6)) : null,
      displayScore: cciScore !== null ? Number(cciScore.toFixed(2)) : null,
      draftCciScore: draftCciScore !== null ? Number(draftCciScore.toFixed(6)) : null,
      componentScores,
      componentApplicability,
      baseWeights,
      effectiveWeights,
      breakdownDetails
    };
  }
}
