/**
 * CIRCULARTRACE - Step 3: Flow Reconciliation & Mass Balance
 *
 * Rules:
 * 1. Biomass dry mass conversion: kg_kering = kg_basah * (1 - moisture_pct / 100).
 * 2. Destination mass must NOT exceed origin generated dry mass (Massa tujuan melebihi asal -> Error).
 * 3. Flow ID uniqueness: Single flow_id credited only once on the same system boundary.
 * 4. Cascara with NADES: Added water/NADES/solvents cannot increase credited dry cascara mass.
 * 5. Unexplained discrepancy > 5% flagged for quality audit.
 */

import { ValidationError } from './validator.js';

export function calculateDryMass(wetKg, moisturePct) {
  if (wetKg === null || wetKg === undefined || wetKg < 0) {
    throw new ValidationError('Massa basah harus bernilai non-negatif (>= 0)', 'wetKg');
  }
  const pct = Number(moisturePct ?? 0);
  if (pct < 0 || pct >= 100) {
    throw new ValidationError('Kadar air harus berada pada rentang 0% hingga <100%', 'moisturePct');
  }
  return Number((wetKg * (1 - pct / 100)).toFixed(6));
}

export function reconcileByproductFlows(originRecords, destinationRecords) {
  const reconciliationReport = {
    isValid: true,
    origins: {},
    flowIdSet: new Set(),
    flags: [],
    errors: []
  };

  // 1. Process and map origins
  for (const origin of originRecords) {
    const { origin_flow_id, generated_dry_kg, wet_kg, moisture_pct, byproduct_type } = origin;

    if (!origin_flow_id) {
      throw new ValidationError('origin_flow_id is required for byproduct origin', 'origin_flow_id');
    }

    if (reconciliationReport.flowIdSet.has(origin_flow_id)) {
      throw new ValidationError(
        `Duplikasi flow_id terdeteksi: origin_flow_id ${origin_flow_id} sudah terdaftar. flow_id harus unik.`,
        'origin_flow_id',
        'DUPLICATE_FLOW_ID'
      );
    }
    reconciliationReport.flowIdSet.add(origin_flow_id);

    const calculatedDry = (generated_dry_kg !== undefined && generated_dry_kg !== null)
      ? Number(generated_dry_kg)
      : calculateDryMass(wet_kg, moisture_pct);

    reconciliationReport.origins[origin_flow_id] = {
      origin_flow_id,
      byproduct_type,
      wet_kg: Number(wet_kg || 0),
      moisture_pct: Number(moisture_pct || 0),
      generated_dry_kg: calculatedDry,
      allocated_dry_kg: 0,
      destinations: []
    };
  }

  // 2. Process destinations and verify against origins
  for (const dest of destinationRecords) {
    const { origin_flow_id, terminal_flow_id, utilized_dry_kg, pathway, destination_detail, added_solvent_kg, solvent_deduction_applied } = dest;

    if (!terminal_flow_id) {
      throw new ValidationError('terminal_flow_id is required for destination record', 'terminal_flow_id');
    }

    if (reconciliationReport.flowIdSet.has(terminal_flow_id)) {
      throw new ValidationError(
        `Duplikasi flow_id terdeteksi: terminal_flow_id ${terminal_flow_id} sudah terdaftar. flow_id harus unik.`,
        'terminal_flow_id',
        'DUPLICATE_FLOW_ID'
      );
    }
    reconciliationReport.flowIdSet.add(terminal_flow_id);

    const origin = reconciliationReport.origins[origin_flow_id];
    if (!origin) {
      throw new ValidationError(
        `Aliran tujuan ${terminal_flow_id} merujuk ke origin_flow_id ${origin_flow_id} yang tidak ditemukan.`,
        'origin_flow_id',
        'ORPHAN_FLOW'
      );
    }

    let effectiveDryKg = Number(utilized_dry_kg || 0);

    // Rule: NADES or added liquid solvent does not increase credited cascara dry mass!
    if (added_solvent_kg && added_solvent_kg > 0 && !solvent_deduction_applied) {
      // If added solvent was mistakenly included in utilized_dry_kg, deduct it
      effectiveDryKg = Math.max(0, effectiveDryKg - Number(added_solvent_kg));
    }

    origin.allocated_dry_kg += effectiveDryKg;
    origin.destinations.push({
      terminal_flow_id,
      pathway,
      destination_detail,
      utilized_dry_kg: effectiveDryKg,
      raw_utilized_kg: Number(utilized_dry_kg || 0),
      actual_use_date: dest.actual_use_date,
      evidence_id: dest.evidence_id
    });
  }

  // 3. Strict Check: Massa tujuan melebihi asal -> Validation Error (Do NOT issue score)
  for (const originId in reconciliationReport.origins) {
    const origin = reconciliationReport.origins[originId];
    const diff = origin.allocated_dry_kg - origin.generated_dry_kg;

    // Allow 1e-6 float precision margin
    if (diff > 1e-4) {
      throw new ValidationError(
        `Kesalahan rekonsiliasi massa: Total massa tujuan (${origin.allocated_dry_kg.toFixed(4)} kg) melebihi massa asal (${origin.generated_dry_kg.toFixed(4)} kg) untuk aliran ${originId}. Jangan menerbitkan skor.`,
        originId,
        'DESTINATION_EXCEEDS_ORIGIN'
      );
    }

    // Check for unexplained loss > 5%
    const unallocatedKg = origin.generated_dry_kg - origin.allocated_dry_kg;
    const lossPct = (unallocatedKg / origin.generated_dry_kg) * 100;
    if (lossPct > 5.0 && origin.generated_dry_kg > 0) {
      reconciliationReport.flags.push({
        origin_flow_id: originId,
        message: `Peringatan kendali mutu: Selisih tak terjelaskan ${lossPct.toFixed(2)}% (>5%) dari input biomassa.`
      });
    }
  }

  return reconciliationReport;
}
