/**
 * CIRCULARTRACE - Server-Side Calculation Pipeline
 *
 * Implements the exact 9-step calculation pipeline:
 * Step 1: Validasi unit dan periode
 * Step 2: Cek applicability
 * Step 3: Rekonsiliasi aliran
 * Step 4: Cek kelengkapan
 * Step 5: Normalisasi indikator
 * Step 6: Hitung komponen atau dimensi
 * Step 7: Cek pengaman
 * Step 8: Tentukan status (DRAFT, READY_FOR_REVIEW, VERIFIED, PUBLISHED, BLOCKED)
 * Step 9: Simpan snapshot berversi (Immutable server-side snapshots)
 */

import { randomUUID } from 'crypto';
import { CalculationStatus, SafeguardStatus, ApplicabilityType, getManagerialCategory } from '../cdl/types.js';
import { validatePeriodAndBoundary, validateNonNegative } from '../cdl/validator.js';
import { reconcileByproductFlows } from '../cdl/mass-reconciliation.js';
import { globalBenchmarkRegistry } from '../registry/benchmark-registry.js';
import { SafeguardsEngine } from './safeguards-engine.js';
import { CciLiteEngine } from './cci-lite-engine.js';
import { SdiLiteEngine } from './sdi-lite-engine.js';

export class CalculationPipeline {
  constructor(options = {}) {
    this.benchmarkRegistry = options.benchmarkRegistry || globalBenchmarkRegistry;
    this.snapshotsStore = new Map(); // In-memory snapshot store (or database adapter)
  }

  /**
   * Execute the full 9-step server-side calculation pipeline
   */
  execute(assessmentData, executionOptions = {}) {
    const {
      isEvidenceAudited = false,
      isPublicationAuthorized = false,
      userRole = 'PROCESSOR'
    } = executionOptions;

    // =========================================================================
    // STEP 1: Validasi Unit dan Periode
    // =========================================================================
    validatePeriodAndBoundary(assessmentData.assessment);

    // Validate non-negative numbers on all incoming records
    if (assessmentData.material_input) {
      for (const mat of assessmentData.material_input) {
        validateNonNegative(mat.total_kg, `material_input.total_kg (${mat.material_type || mat.flow_id})`);
        validateNonNegative(mat.circular_kg, `material_input.circular_kg (${mat.material_type || mat.flow_id})`);
      }
    }

    if (assessmentData.utilities) {
      validateNonNegative(assessmentData.utilities.water_new_l, 'utilities.water_new_l');
      validateNonNegative(assessmentData.utilities.water_reused_l, 'utilities.water_reused_l');
      validateNonNegative(assessmentData.utilities.energy_total_kwh_eq, 'utilities.energy_total_kwh_eq');
      validateNonNegative(assessmentData.utilities.energy_renewable_recovered_union_kwh_eq, 'utilities.energy_renewable_recovered_union_kwh_eq');
    }

    // =========================================================================
    // STEP 2: Cek Applicability
    // =========================================================================
    const indicators = (assessmentData.indicator_observation || []).map(obs => ({ ...obs }));

    // Rule: S2 NOT_APPLICABLE if no paid workers (all family labor)
    for (const ind of indicators) {
      if (ind.indicator_code === 'S2' && ind.denominator === 0 && ind.family_only === true) {
        ind.applicability = ApplicabilityType.NOT_APPLICABLE;
      }
      // Rule: Ec2 NOT_APPLICABLE if no due supplier debts
      if (ind.indicator_code === 'Ec2' && ind.denominator === 0) {
        ind.applicability = ApplicabilityType.NOT_APPLICABLE;
      }
    }

    // =========================================================================
    // STEP 3: Rekonsiliasi Aliran & Neraca Massa
    // =========================================================================
    const reconciliation = reconcileByproductFlows(
      assessmentData.byproduct_origin || [],
      assessmentData.byproduct_destination || []
    );

    // =========================================================================
    // STEP 4 & 5: Normalisasi Indikator & Lookup Benchmark Terverifikasi
    // =========================================================================
    const benchmarks = {};
    const stage = assessmentData.assessment.stage;
    const processType = assessmentData.assessment.process_type;

    // Lookup explicit benchmarks (no automatic fabricated targets)
    const bmE1 = this.benchmarkRegistry.findMatching('E1', stage, processType);
    if (bmE1) benchmarks.E1 = bmE1;

    const bmE2 = this.benchmarkRegistry.findMatching('E2', stage, processType);
    if (bmE2) benchmarks.E2 = bmE2;

    const bmEc1 = this.benchmarkRegistry.findMatching('Ec1', stage, processType);
    if (bmEc1) benchmarks.Ec1 = bmEc1;

    // =========================================================================
    // STEP 6: Hitung Komponen atau Dimensi (CT-CCI-Lite & CT-SDI-Lite)
    // =========================================================================
    const cciResult = CciLiteEngine.calculate({
      materialInputs: assessmentData.material_input || [],
      byproductOrigins: assessmentData.byproduct_origin || [],
      byproductDestinations: assessmentData.byproduct_destination || [],
      utilities: assessmentData.utilities || {}
    });

    const sdiResult = SdiLiteEngine.calculate(indicators, benchmarks);

    // =========================================================================
    // STEP 7: Cek Pengaman (Non-Compensable Safeguards)
    // =========================================================================
    const safeguardsResult = SafeguardsEngine.evaluate(assessmentData.safeguards || []);

    // =========================================================================
    // STEP 8: Tentukan Status Hasil
    // Status rules:
    // - Satu FAIL -> BLOCKED (skor disimpan untuk diagnosis internal, klaim publik diblokir)
    // - UNKNOWN pengaman -> DRAFT (tidak dapat dipublikasikan meskipun skor numerik tinggi)
    // - Belum lengkap (CCI missing components atau SDI coverage < 100%) -> DRAFT
    // - Lengkap & semua pengaman PASS:
    //     - Sebelum verifikasi -> READY_FOR_REVIEW
    //     - Setelah pemeriksaan bukti -> VERIFIED
    //     - Setelah otorisasi publikasi peran -> PUBLISHED
    // =========================================================================
    let finalStatus = CalculationStatus.DRAFT;
    const isDataFullyComplete = cciResult.isComplete && sdiResult.isComplete;

    if (safeguardsResult.overallSafeguardStatus === SafeguardStatus.FAIL) {
      finalStatus = CalculationStatus.BLOCKED;
    } else if (safeguardsResult.overallSafeguardStatus === SafeguardStatus.UNKNOWN) {
      finalStatus = CalculationStatus.DRAFT;
    } else if (!isDataFullyComplete) {
      finalStatus = CalculationStatus.DRAFT;
    } else {
      // All safeguards PASS and data is complete (100% coverage)
      if (isPublicationAuthorized) {
        finalStatus = CalculationStatus.PUBLISHED;
      } else if (isEvidenceAudited) {
        finalStatus = CalculationStatus.VERIFIED;
      } else {
        finalStatus = CalculationStatus.READY_FOR_REVIEW;
      }
    }

    // Determine final scores to expose
    // Note: If DRAFT, final score is null (not issued/published), while draftScore provides the diagnostic view.
    // For BLOCKED, numeric score is preserved for internal diagnosis with status BLOCKED.
    const isPublishableOrBlocked = finalStatus !== CalculationStatus.DRAFT;

    const exposedCciScore = isPublishableOrBlocked && cciResult.isComplete
      ? cciResult.cciScore
      : null;

    const exposedSdiScore = isPublishableOrBlocked && sdiResult.isComplete
      ? sdiResult.sdiScore
      : null;

    const displayCci = exposedCciScore !== null ? Number(exposedCciScore.toFixed(2)) : null;
    const displaySdi = exposedSdiScore !== null ? Number(exposedSdiScore.toFixed(2)) : null;

    // =========================================================================
    // STEP 9: Simpan Snapshot Berversi (Immutable, Server-side, Reproducible)
    // =========================================================================
    const snapshotId = randomUUID();
    const calculatedAt = new Date().toISOString();

    const snapshot = {
      snapshot_id: snapshotId,
      assessment_id: assessmentData.assessment.assessment_id,
      actor_id: assessmentData.assessment.actor_id,
      period: {
        start: assessmentData.assessment.period_start,
        end: assessmentData.assessment.period_end
      },
      system_boundary: assessmentData.assessment.system_boundary,
      stage: assessmentData.assessment.stage,
      process_type: assessmentData.assessment.process_type,
      linked_lot_ids: assessmentData.assessment.linked_lot_ids || [],
      label: 'skor fasilitas periode yang terkait dengan lot',
      formula_versions: {
        cci: 'CT-CCI-Lite-1.0',
        sdi: 'CT-SDI-Lite-1.0',
        engine: 'CircularTrace-Lite-1.0'
      },
      status: finalStatus,
      scores: {
        cci: {
          finalScore: exposedCciScore,
          displayScore: displayCci,
          draftScore: cciResult.draftCciScore,
          category: getManagerialCategory(exposedCciScore ?? cciResult.draftCciScore),
          isComplete: cciResult.isComplete,
          missingComponents: cciResult.missingComponents,
          componentScores: cciResult.componentScores,
          effectiveWeights: cciResult.effectiveWeights,
          breakdownDetails: cciResult.breakdownDetails
        },
        sdi: {
          finalScore: exposedSdiScore,
          displayScore: displaySdi,
          draftScore: sdiResult.draftSdiScore,
          category: getManagerialCategory(exposedSdiScore ?? sdiResult.draftSdiScore),
          isComplete: sdiResult.isComplete,
          coveragePct: sdiResult.coveragePct,
          dimensions: sdiResult.dimensions,
          indicators: sdiResult.indicators
        }
      },
      safeguards: safeguardsResult,
      mass_reconciliation: {
        flags: reconciliation.flags,
        summary: reconciliation.origins
      },
      inputs_snapshot: JSON.parse(JSON.stringify(assessmentData)),
      benchmarks_applied: benchmarks,
      calculated_at: calculatedAt
    };

    // Store snapshot in history without overwriting or deleting previous records
    this.snapshotsStore.set(snapshotId, snapshot);

    return snapshot;
  }

  getSnapshot(snapshotId) {
    return this.snapshotsStore.get(snapshotId) || null;
  }

  listSnapshotsForAssessment(assessmentId) {
    const list = [];
    for (const snap of this.snapshotsStore.values()) {
      if (snap.assessment_id === assessmentId) {
        list.push(snap);
      }
    }
    return list.sort((a, b) => new Date(b.calculated_at) - new Date(a.calculated_at));
  }
}
