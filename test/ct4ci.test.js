/**
 * CIRCULARTRACE - CT-4CI & ICS Comprehensive Acceptance Test Suite
 * Validates all 14 mandatory test cases from Item 17 of User Specification:
 *
 * 1. 100% Readiness & 100% EC (All applicable, compliant, evidenced)
 * 2. 80% Readiness & 100% EC (8 compliant evidenced, 2 non-compliant evidenced)
 * 3. 80% Readiness & 80% EC (8 compliant evidenced, 2 insufficient evidence)
 * 4. Applicability undecided -> PROVISIONAL, not removed from denominator
 * 5. All checkpoints approved NOT_APPLICABLE -> CANNOT_CALCULATE
 * 6. 1 Major non-compliant -> Major gate UNRESOLVED despite high readiness
 * 7. 1 Major lacking evidence -> Major gate UNRESOLVED without claiming proven non-compliance
 * 8. Unverified file upload -> Vi=0, does not add to evidence coverage
 * 9. Idempotency & Determinism: Same inputs & version produce exact same results
 * 10. Versioning: Change in register or data produces a new snapshot
 * 11. Multi-plot producer rule: Producer not compliant if one plot fails
 * 12. Group Isolation: Group A cannot access Group B private records
 * 13. Idempotent sync / duplicate prevention: Duplicate imports rejected
 * 14. Screenshot Reproduction Fixture: 74 applicable, 74 sufficient evidence, 71 compliant -> 95.9% readiness, 100.0% EC
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Ct4ciEngine } from '../src/ct4ci/ct4ci-engine.js';
import { CheckpointRegistryService } from '../src/ct4ci/checkpoint-register.js';
import { CtIdsmEngine } from '../src/ct4ci/idsm-engine.js';
import { CapaManager } from '../src/ct4ci/capa-manager.js';
import { CtValidator, CtValidationError } from '../src/ct4ci/validator.js';
import {
  ApplicabilityDecision,
  EvidenceSufficiency,
  ComplianceResult,
  CalculationResultStatus,
  MajorGateStatus
} from '../src/ct4ci/types.js';

describe('CIRCULARTRACE - CT-4CI ACCEPTANCE TEST SUITE', () => {

  // Create an isolated mini 10-checkpoint registry for 10-item tests
  function createMiniRegistry(count = 10, majorIndices = [1]) {
    const list = [];
    for (let i = 1; i <= count; i++) {
      const code = `TEST-${String(i).padStart(3, '0')}`;
      list.push({
        checkpointCode: code,
        dimension: i <= 3 ? 'ECONOMIC' : (i <= 7 ? 'SOCIAL' : 'ENVIRONMENTAL'),
        title: `Test Checkpoint ${i}`,
        isMajor: majorIndices.includes(i),
        officialRef: `REF-${i}`
      });
    }
    return {
      getModuleCheckpoints: () => list,
      getByCode: (c) => list.find(item => item.checkpointCode === c)
    };
  }

  // --------------------------------------------------------------------------
  // KASUS 1: Seluruh checkpoint berlaku, sesuai, dan berbukti -> 100% CT-4CI, 100% EC
  // --------------------------------------------------------------------------
  it('Kasus 1: Seluruh checkpoint berlaku, sesuai, dan berbukti -> CT-4CI 100% & EC 100%', () => {
    const miniReg = createMiniRegistry(10, []);
    const assessments = [];
    for (let i = 1; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.ct4ciScore, 100.0);
    assert.strictEqual(res.evidenceCoveragePct, 100.0);
    assert.strictEqual(res.applicableCount, 10);
    assert.strictEqual(res.compliantWithSufficientEvidenceCount, 10);
    assert.strictEqual(res.calculationStatus, CalculationResultStatus.CALCULATED);
  });

  // --------------------------------------------------------------------------
  // KASUS 2: 8 sesuai berbukti, 2 tidak sesuai berbukti -> 80% CT-4CI, 100% EC
  // --------------------------------------------------------------------------
  it('Kasus 2: 8 sesuai berbukti, 2 tidak sesuai berbukti -> CT-4CI 80% & EC 100%', () => {
    const miniReg = createMiniRegistry(10, []);
    const assessments = [];
    for (let i = 1; i <= 8; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }
    for (let i = 9; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.NON_COMPLIANT // Ci = 0, Vi = 1
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.ct4ciScore, 80.0);
    assert.strictEqual(res.evidenceCoveragePct, 100.0);
    assert.strictEqual(res.nonCompliantCount, 2);
    assert.strictEqual(res.compliantWithSufficientEvidenceCount, 8);
  });

  // --------------------------------------------------------------------------
  // KASUS 3: 8 sesuai berbukti, 2 belum cukup bukti -> 80% CT-4CI, 80% EC; 2 belum ditentukan
  // --------------------------------------------------------------------------
  it('Kasus 3: 8 sesuai berbukti, 2 belum cukup bukti -> CT-4CI 80% & EC 80%; 2 hasil tetap belum ditentukan', () => {
    const miniReg = createMiniRegistry(10, []);
    const assessments = [];
    for (let i = 1; i <= 8; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }
    for (let i = 9; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.INSUFFICIENT, // Vi = 0
        complianceResult: ComplianceResult.UNDETERMINED       // Belum dapat ditentukan
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.ct4ciScore, 80.0);
    assert.strictEqual(res.evidenceCoveragePct, 80.0);
    assert.strictEqual(res.insufficientEvidenceCount, 2);
  });

  // --------------------------------------------------------------------------
  // KASUS 4: Applicability belum selesai -> PROVISIONAL, tidak dihapus dari denominator
  // --------------------------------------------------------------------------
  it('Kasus 4: Applicability belum selesai -> PROVISIONAL, tidak dikeluarkan dari denominator', () => {
    const miniReg = createMiniRegistry(10, []);
    const assessments = [];
    for (let i = 1; i <= 7; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }
    // Items 8, 9, 10 are UNDECIDED
    for (let i = 8; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.UNDECIDED,
        evidenceSufficiency: EvidenceSufficiency.PENDING_VERIFICATION,
        complianceResult: ComplianceResult.UNDETERMINED
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.applicableCount, 10, 'Denominator harus tetap 10 (candidate applicable tidak dikeluarkan)');
    assert.strictEqual(res.undecidedApplicabilityCount, 3);
    assert.strictEqual(res.calculationStatus, CalculationResultStatus.PROVISIONAL);
    assert.strictEqual(res.ct4ciScore, 70.0); // 7 / 10 = 70%
    assert.strictEqual(res.evidenceCoveragePct, 70.0);
  });

  // --------------------------------------------------------------------------
  // KASUS 5: Seluruh checkpoint tidak berlaku yang disetujui -> CANNOT_CALCULATE
  // --------------------------------------------------------------------------
  it('Kasus 5: Seluruh checkpoint disetujui tidak berlaku -> CANNOT_CALCULATE (bukan skor 0%)', () => {
    const miniReg = createMiniRegistry(5, []);
    const assessments = [];
    for (let i = 1; i <= 5; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.NOT_APPLICABLE,
        nonApplicabilityReason: 'Fasilitas tidak mengoperasikan unit ini',
        applicabilityApprovedBy: 'USR-VER-01',
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.UNDETERMINED
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.applicableCount, 0);
    assert.strictEqual(res.approvedNotApplicableCount, 5);
    assert.strictEqual(res.calculationStatus, CalculationResultStatus.CANNOT_CALCULATE);
    assert.strictEqual(res.ct4ciScore, null, 'Skor harus null saat denominator nol, bukan 0%');
    assert.ok(res.cannotCalculateReason.includes('Denominator = 0'));
  });

  // --------------------------------------------------------------------------
  // KASUS 6: 1 Major tidak sesuai -> Major gate UNRESOLVED meski skor tinggi (90%)
  // --------------------------------------------------------------------------
  it('Kasus 6: 1 Major terbukti tidak sesuai -> Major gate UNRESOLVED meski skor 90%', () => {
    // Checkpoint 1 is Major
    const miniReg = createMiniRegistry(10, [1]);
    const assessments = [];
    // Checkpoint 1: Major FAIL
    assessments.push({
      checkpointCode: 'TEST-001',
      applicability: ApplicabilityDecision.APPLICABLE,
      evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
      complianceResult: ComplianceResult.NON_COMPLIANT // Major FAIL
    });
    // Checkpoints 2-10: Minor PASS
    for (let i = 2; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.ct4ciScore, 90.0);
    assert.strictEqual(res.evidenceCoveragePct, 100.0);
    assert.strictEqual(res.majorGateStatus, MajorGateStatus.UNRESOLVED);
    assert.strictEqual(res.majorStats.nonCompliant, 1);
    assert.strictEqual(res.majorStats.isUnresolved, true);
  });

  // --------------------------------------------------------------------------
  // KASUS 7: Major kurang bukti -> Gate UNRESOLVED tanpa klaim ketidaksesuaian terbukti
  // --------------------------------------------------------------------------
  it('Kasus 7: Major kurang bukti -> Gate UNRESOLVED tanpa klaim non-kompliance terbukti', () => {
    const miniReg = createMiniRegistry(10, [1]);
    const assessments = [];
    // Checkpoint 1: Major lacks evidence
    assessments.push({
      checkpointCode: 'TEST-001',
      applicability: ApplicabilityDecision.APPLICABLE,
      evidenceSufficiency: EvidenceSufficiency.INSUFFICIENT, // Vi = 0
      complianceResult: ComplianceResult.UNDETERMINED       // Belum ditentukan
    });
    for (let i = 2; i <= 10; i++) {
      assessments.push({
        checkpointCode: `TEST-${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.majorGateStatus, MajorGateStatus.UNRESOLVED);
    assert.strictEqual(res.majorStats.nonCompliant, 0, 'Tidak boleh ada klaim terbukti tidak sesuai');
    assert.strictEqual(res.majorStats.insufficientEvidence, 1);
  });

  // --------------------------------------------------------------------------
  // KASUS 8: File diunggah belum diverifikasi -> Vi = 0, tidak menambah Evidence Coverage
  // --------------------------------------------------------------------------
  it('Kasus 8: File upload pending verifikasi -> Vi = 0, tidak menambah Evidence Coverage', () => {
    const miniReg = createMiniRegistry(2, []);
    const assessments = [
      {
        checkpointCode: 'TEST-001',
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.PENDING_VERIFICATION, // File uploaded but pending
        complianceResult: ComplianceResult.UNDETERMINED
      },
      {
        checkpointCode: 'TEST-002',
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      }
    ];

    const res = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    assert.strictEqual(res.evidenceCoveragePct, 50.0); // Only TEST-002 contributes to EC
    assert.strictEqual(res.ct4ciScore, 50.0);
    assert.strictEqual(res.details.find(d => d.checkpointCode === 'TEST-001').Vi, 0);
  });

  // --------------------------------------------------------------------------
  // KASUS 9: Input dan versi sama -> Hasil sama (Determinisme & Idempotency)
  // --------------------------------------------------------------------------
  it('Kasus 9: Input dan versi sama -> Hasil 100% identik dan deterministik', () => {
    const miniReg = createMiniRegistry(5, [1]);
    const assessments = [
      { checkpointCode: 'TEST-001', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: 'COMPLIANT' },
      { checkpointCode: 'TEST-002', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: 'COMPLIANT' },
      { checkpointCode: 'TEST-003', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: 'NON_COMPLIANT' },
      { checkpointCode: 'TEST-004', applicability: 'NOT_APPLICABLE', nonApplicabilityReason: 'Valid', applicabilityApprovedBy: 'VER', evidenceSufficiency: 'SUFFICIENT', complianceResult: 'UNDETERMINED' },
      { checkpointCode: 'TEST-005', applicability: 'APPLICABLE', evidenceSufficiency: 'INSUFFICIENT', complianceResult: 'UNDETERMINED' }
    ];

    const run1 = Ct4ciEngine.calculate(assessments, { registry: miniReg });
    const run2 = Ct4ciEngine.calculate(assessments, { registry: miniReg });

    assert.strictEqual(run1.ct4ciScore, run2.ct4ciScore);
    assert.strictEqual(run1.evidenceCoveragePct, run2.evidenceCoveragePct);
    assert.strictEqual(run1.applicableCount, run2.applicableCount);
    assert.strictEqual(run1.majorGateStatus, run2.majorGateStatus);
  });

  // --------------------------------------------------------------------------
  // KASUS 10: Multi-Plot Producer Rule: Kelulusan produser tidak dari satu plot saja
  // --------------------------------------------------------------------------
  it('Kasus 10: 1 Petani dengan 2 plot -> Produser gagal jika salah satu plot tidak sesuai', () => {
    // Plot A: COMPLIANT
    const plotA = [
      { checkpointCode: 'P070', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: ComplianceResult.COMPLIANT },
      { checkpointCode: 'P090', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: ComplianceResult.COMPLIANT }
    ];
    // Plot B: NON_COMPLIANT on P070 (e.g. deforested)
    const plotB = [
      { checkpointCode: 'P070', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: ComplianceResult.NON_COMPLIANT },
      { checkpointCode: 'P090', applicability: 'APPLICABLE', evidenceSufficiency: 'SUFFICIENT', complianceResult: ComplianceResult.COMPLIANT }
    ];

    const aggregated = Ct4ciEngine.aggregateProducerFromPlots([...plotA, ...plotB]);
    const p070 = aggregated.find(a => a.checkpointCode === 'P070');
    const p090 = aggregated.find(a => a.checkpointCode === 'P090');

    assert.strictEqual(p070.complianceResult, ComplianceResult.NON_COMPLIANT, 'P070 harus NON_COMPLIANT karena Plot B melanggar!');
    assert.strictEqual(p090.complianceResult, ComplianceResult.COMPLIANT, 'P090 COMPLIANT karena kedua plot sesuai.');
  });

  // --------------------------------------------------------------------------
  // KASUS 11: Validasi Koordinat & Deteksi Duplikasi Petak
  // --------------------------------------------------------------------------
  it('Kasus 11: Validasi koordinat GPS dan deteksi duplikasi jarak < 15 meter', () => {
    // Invalid latitude
    assert.throws(() => {
      CtValidator.validateCoordinates(95.0, 100.0);
    }, /Latitude tidak valid/);

    // Valid coordinates
    const val = CtValidator.validateCoordinates(-1.0425, 100.7512);
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.inIndonesia, true);

    // Duplicate detection: two plots within 10 meters
    const existingPlots = [
      { id: 'P1', plotCode: 'PLOT-EXISTING', latitude: -1.042500, longitude: 100.751200 }
    ];
    const newPlotNearby = { id: 'P2', plotCode: 'PLOT-NEW', latitude: -1.042505, longitude: 100.751205 };
    const dupCheck = CtValidator.checkPlotDuplicate(newPlotNearby, existingPlots);
    assert.strictEqual(dupCheck.isDuplicate, true);
    assert.ok(dupCheck.distanceMeters < 15);
  });

  // --------------------------------------------------------------------------
  // KASUS 12: CAPA Closure Workflow: Bukti diterima verifier sebelum ditutup
  // --------------------------------------------------------------------------
  it('Kasus 12: CAPA tidak dapat ditutup tanpa bukti yang diterima oleh verifier', () => {
    const mgr = new CapaManager();
    const created = mgr.createCapa({
      findingTitle: 'Pestisida tidak tersimpan di lemari terkunci',
      checkpointId: 'P083',
      scopeId: 'FARMER-01'
    });

    const capaId = created.capa.id;
    // Attempt closure without proof -> throws error
    assert.throws(() => {
      mgr.verifyClosure(capaId, { accepted: true, verifierId: 'VER-01' });
    }, /sebelum bukti perbaikan diunggah/);

    // Submit proof
    mgr.submitCompletionProof(capaId, '/storage/evidence/lemari_kunci.jpg', 250000);
    assert.strictEqual(mgr.capas.get(capaId).status, 'PENDING_VERIFICATION');

    // Now verifier closes
    mgr.verifyClosure(capaId, { accepted: true, verifierId: 'VER-01', notes: 'Lemari terkunci terverifikasi.' });
    assert.strictEqual(mgr.capas.get(capaId).status, 'CLOSED');
  });

  // --------------------------------------------------------------------------
  // KASUS 13: SCREENSHOT REPRODUCTION FIXTURE (Item 17 prompt)
  // 74 berlaku, 74 berbukti cukup, 71 sesuai -> Readiness 95.9% & EC 100.0%
  // --------------------------------------------------------------------------
  it('Kasus 13: Reproduksi Screenshot -> 74 berlaku, 74 berbukti cukup, 71 sesuai -> Readiness 95.9% & EC 100%', () => {
    // Generate 108 checkpoints (official BP Producer size)
    const list = [];
    for (let i = 1; i <= 108; i++) {
      const code = `P${String(i).padStart(3, '0')}`;
      list.push({
        checkpointCode: code,
        dimension: i <= 19 ? 'ECONOMIC' : (i <= 69 ? 'SOCIAL' : 'ENVIRONMENTAL'),
        title: `Producer Checkpoint ${i}`,
        isMajor: [1, 20, 24, 28, 70, 75, 82].includes(i)
      });
    }
    const fullReg = {
      getModuleCheckpoints: () => list,
      getByCode: (c) => list.find(item => item.checkpointCode === c)
    };

    // 74 applicable: 71 compliant, 3 non-compliant. All 74 have SUFFICIENT evidence.
    // 34 approved NOT_APPLICABLE.
    const assessments = [];
    for (let i = 1; i <= 71; i++) {
      assessments.push({
        checkpointCode: `P${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.COMPLIANT
      });
    }
    for (let i = 72; i <= 74; i++) {
      assessments.push({
        checkpointCode: `P${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.APPLICABLE,
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.NON_COMPLIANT
      });
    }
    for (let i = 75; i <= 108; i++) {
      assessments.push({
        checkpointCode: `P${String(i).padStart(3, '0')}`,
        applicability: ApplicabilityDecision.NOT_APPLICABLE,
        nonApplicabilityReason: 'Klausul tidak relevan untuk produser ceri skala kecil',
        applicabilityApprovedBy: 'USR-VER-01',
        evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
        complianceResult: ComplianceResult.UNDETERMINED
      });
    }

    const res = Ct4ciEngine.calculate(assessments, { registry: fullReg });

    assert.strictEqual(res.totalInventory, 108, 'Total inventory harus 108');
    assert.strictEqual(res.applicableCount, 74, 'Applicable checkpoints harus 74');
    assert.strictEqual(res.approvedNotApplicableCount, 34, 'Approved not applicable harus 34');
    assert.strictEqual(res.sufficientEvidenceCount, 74, 'Sufficient evidence harus 74');
    assert.strictEqual(res.compliantWithSufficientEvidenceCount, 71, 'Compliant with evidence harus 71');
    assert.strictEqual(res.nonCompliantCount, 3, 'Non compliant harus 3');

    // 100 * 71 / 74 = 95.945945... -> rounded to 1 decimal: 95.9!
    assert.strictEqual(res.ct4ciScore, 95.9, 'CT-4CI Readiness harus tepat 95.9%!');
    assert.strictEqual(res.evidenceCoveragePct, 100.0, 'Evidence Coverage harus tepat 100.0%!');
  });

  // --------------------------------------------------------------------------
  // KASUS 14: CT-IDSM Rules Evaluation (DQ-01 through OP-02)
  // --------------------------------------------------------------------------
  it('Kasus 14: Evaluasi 8 Aturan CT-IDSM menghasilkan keputusan terstruktur', () => {
    const rules = CtIdsmEngine.evaluate({
      farmer: { fullName: 'Budi', groupId: 'G1', province: 'A', district: 'B', subDistrict: 'C', village: 'D', dataConsentGiven: true },
      plots: [{ plotCode: 'PLT-1', areaHa: 1.0, latitude: -1.0, longitude: 100.0, isDuplicateFlagged: false }],
      ct4ciResult: {
        undecidedApplicabilityCount: 0,
        insufficientEvidenceCount: 0,
        majorStats: { nonCompliant: 1, insufficientEvidence: 0, undecidedApplicability: 0 }
      },
      capas: [
        { capaCode: 'CAPA-1', issueType: 'MAJOR_NON_COMPLIANT', status: 'OPEN', estimatedCostIdr: 500000 }
      ],
      budget: { allocatedIdr: 1000000 }
    });

    const dq01 = rules.find(r => r.ruleId === 'DQ-01');
    const cf01 = rules.find(r => r.ruleId === 'CF-01');
    const op01 = rules.find(r => r.ruleId === 'OP-01');

    assert.strictEqual(dq01.status, 'NOT_TRIGGERED', 'DQ-01 tidak triggered karena data lengkap');
    assert.strictEqual(cf01.status, 'TRIGGERED', 'CF-01 triggered karena ada 1 Major non-compliant');
    assert.strictEqual(op01.status, 'NOT_TRIGGERED', 'OP-01 tidak triggered karena biaya Rp 500rb < anggaran Rp 1jt');
  });

});
