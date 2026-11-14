/**
 * CIRCULARTRACE - Section 8: Multi-Actor and Supply Chain Aggregation Engine
 *
 * Rules:
 * Agregasi CCI:
 * - Hitung ulang setiap rasio dari penjumlahan pembilang dan penyebut yang tidak ganda dalam batas rantai;
 *   JANGAN merata-ratakan skor fasilitas.
 * - Transfer internal tidak dihitung sebagai hasil samping baru.
 * - WC agregat adalah rasio pemakaian di titik terdefinisi.
 *
 * Agregasi SDI:
 * - Skor rantai hanya dibuat jika SEMUA tahap dalam batas memiliki hasil final.
 * - Rerata dimensi tahap dengan bobot tahap sama ("rerata profil tahap", bukan SDI berbobot dampak).
 * - Multi-aktor dalam satu tahap: bobot kontribusi volume tertelusur (sum = 1).
 * - Pengaman FAIL pada satu aktor memblokir klaim seluruh rantai (BLOCKED).
 * - Tahap hilang membuat hasil rantai DRAFT (tidak diabaikan).
 */

import { CalculationStatus, SafeguardStatus } from '../cdl/types.js';

export class ChainAggregationEngine {
  /**
   * Aggregate CCI across supply chain stages by recomputing flow sums
   */
  static aggregateCci(stageAssessments) {
    let totalSupportKg = 0;
    let circularSupportKg = 0;

    let totalGeneratedDryKg = 0;
    let actualWeightedNumerator = 0;

    let totalWaterNew = 0;
    let totalWaterReused = 0;

    let totalEnergyKwh = 0;
    let totalRenewableEnergyKwh = 0;
    let hasMissingEnergy = false;

    for (const record of stageAssessments) {
      // Support inputs
      for (const mat of (record.material_input || [])) {
        totalSupportKg += Number(mat.total_kg || 0);
        circularSupportKg += Number(mat.circular_kg || 0);
      }

      // Byproduct origins & destinations
      for (const orig of (record.byproduct_origin || [])) {
        totalGeneratedDryKg += Number(orig.generated_dry_kg || 0);
      }
      for (const dest of (record.byproduct_destination || [])) {
        const util = Number(dest.utilized_dry_kg || 0);
        const vf = dest.pathway === 'MATERIAL_BIOLOGICAL' ? 1.00 : dest.pathway === 'ENERGY_RECOVERY' ? 0.50 : 0.00;
        if (dest.actual_use_date && dest.evidence_id) {
          actualWeightedNumerator += util * vf;
        }
      }

      // Utilities
      if (record.utilities) {
        totalWaterNew += Number(record.utilities.water_new_l || 0);
        totalWaterReused += Number(record.utilities.water_reused_l || 0);

        if (record.utilities.energy_total_kwh_eq === null || record.utilities.energy_total_kwh_eq === undefined) {
          hasMissingEnergy = true;
        } else {
          totalEnergyKwh += Number(record.utilities.energy_total_kwh_eq || 0);
          totalRenewableEnergyKwh += Number(record.utilities.energy_renewable_recovered_union_kwh_eq || 0);
        }
      }
    }

    const cmi = totalSupportKg > 0 ? circularSupportKg / totalSupportKg : null;
    const bvc = totalGeneratedDryKg > 0 ? actualWeightedNumerator / totalGeneratedDryKg : null;
    const wc = (totalWaterNew + totalWaterReused) > 0 ? totalWaterReused / (totalWaterNew + totalWaterReused) : null;
    const re = !hasMissingEnergy && totalEnergyKwh > 0 ? totalRenewableEnergyKwh / totalEnergyKwh : null;

    // Default weights: 20 CMI, 45 BVC, 20 WC, 15 RE
    let w_cmi = cmi !== null ? 0.20 : 0;
    let w_bvc = bvc !== null ? 0.45 : 0;
    let w_wc = wc !== null ? 0.20 : 0;
    let w_re = re !== null ? 0.15 : 0;
    const w_sum = w_cmi + w_bvc + w_wc + w_re;

    let chainCciScore = null;
    if (w_sum > 0 && !hasMissingEnergy && cmi !== null && bvc !== null && wc !== null && re !== null) {
      chainCciScore = 100 * ((cmi * w_cmi + bvc * w_bvc + wc * w_wc + re * w_re) / w_sum);
    }

    return {
      label: 'Skor Agregasi Aliran Rantai Pasok (Bukan Rerata Fasilitas)',
      chainCciScore: chainCciScore !== null ? Number(chainCciScore.toFixed(2)) : null,
      components: { cmi, bvc, wc, re },
      totals: {
        totalSupportKg,
        circularSupportKg,
        totalGeneratedDryKg,
        actualWeightedNumerator,
        totalWaterNew,
        totalWaterReused,
        totalEnergyKwh,
        totalRenewableEnergyKwh
      }
    };
  }

  /**
   * Aggregate SDI across supply chain stages using Stage Profile Averages
   */
  static aggregateSdi(stageSnapshots, requiredStages = ['FARMER', 'PROCESSOR', 'WAREHOUSE_EXPORTER', 'ROASTERY']) {
    const stageMap = new Map();
    let hasBlockedActor = false;
    let hasUnknownSafeguard = false;

    for (const snap of stageSnapshots) {
      if (snap.status === CalculationStatus.BLOCKED || snap.safeguards?.overallSafeguardStatus === SafeguardStatus.FAIL) {
        hasBlockedActor = true;
      }
      if (snap.safeguards?.overallSafeguardStatus === SafeguardStatus.UNKNOWN) {
        hasUnknownSafeguard = true;
      }

      const stg = snap.stage;
      if (!stageMap.has(stg)) {
        stageMap.set(stg, []);
      }
      stageMap.get(stg).push(snap);
    }

    // Check if any required stage is missing
    const missingStages = requiredStages.filter(s => !stageMap.has(s) || stageMap.get(s).length === 0);
    const isChainComplete = missingStages.length === 0;

    let overallChainStatus = CalculationStatus.DRAFT;
    if (hasBlockedActor) {
      overallChainStatus = CalculationStatus.BLOCKED;
    } else if (!isChainComplete || hasUnknownSafeguard) {
      overallChainStatus = CalculationStatus.DRAFT;
    } else {
      overallChainStatus = CalculationStatus.READY_FOR_REVIEW;
    }

    // Calculate stage profiles
    const stageProfiles = {};
    const dimensionAverages = { E: 0, S: 0, Ec: 0, G: 0 };
    let presentStagesCount = 0;

    for (const [stg, snaps] of stageMap.entries()) {
      // Calculate weighted score within stage if multiple actors exist
      let stageE = 0, stageS = 0, stageEc = 0, stageG = 0;
      let totalStageWeight = 0;

      for (const s of snaps) {
        const weight = s.lot_contribution_weight || (1 / snaps.length);
        totalStageWeight += weight;

        stageE += (s.scores.sdi.dimensions.E.score ?? s.scores.sdi.dimensions.E.draftScore ?? 0) * weight;
        stageS += (s.scores.sdi.dimensions.S.score ?? s.scores.sdi.dimensions.S.draftScore ?? 0) * weight;
        stageEc += (s.scores.sdi.dimensions.Ec.score ?? s.scores.sdi.dimensions.Ec.draftScore ?? 0) * weight;
        stageG += (s.scores.sdi.dimensions.G.score ?? s.scores.sdi.dimensions.G.draftScore ?? 0) * weight;
      }

      if (totalStageWeight > 0) {
        stageE /= totalStageWeight;
        stageS /= totalStageWeight;
        stageEc /= totalStageWeight;
        stageG /= totalStageWeight;
      }

      const stageSdi = (stageE + stageS + stageEc + stageG) / 4;
      stageProfiles[stg] = {
        stage: stg,
        stageSdi: Number(stageSdi.toFixed(2)),
        dimensions: {
          E: Number(stageE.toFixed(2)),
          S: Number(stageS.toFixed(2)),
          Ec: Number(stageEc.toFixed(2)),
          G: Number(stageG.toFixed(2))
        }
      };

      dimensionAverages.E += stageE;
      dimensionAverages.S += stageS;
      dimensionAverages.Ec += stageEc;
      dimensionAverages.G += stageG;
      presentStagesCount++;
    }

    let chainSdiScore = null;
    if (presentStagesCount > 0) {
      dimensionAverages.E /= presentStagesCount;
      dimensionAverages.S /= presentStagesCount;
      dimensionAverages.Ec /= presentStagesCount;
      dimensionAverages.G /= presentStagesCount;

      const avgAll = (dimensionAverages.E + dimensionAverages.S + dimensionAverages.Ec + dimensionAverages.G) / 4;
      chainSdiScore = Number(avgAll.toFixed(2));
    }

    return {
      label: 'rerata profil tahap (Bukan SDI berbobot dampak atau skor eksklusif lot)',
      status: overallChainStatus,
      isChainComplete,
      missingStages,
      chainSdiScore: isChainComplete && overallChainStatus !== CalculationStatus.BLOCKED ? chainSdiScore : null,
      draftChainSdiScore: chainSdiScore,
      stageProfiles,
      dimensionAverages: {
        E: Number(dimensionAverages.E.toFixed(2)),
        S: Number(dimensionAverages.S.toFixed(2)),
        Ec: Number(dimensionAverages.Ec.toFixed(2)),
        G: Number(dimensionAverages.G.toFixed(2))
      }
    };
  }
}
