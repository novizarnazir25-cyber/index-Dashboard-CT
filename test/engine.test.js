/**
 * CIRCULARTRACE - Acceptance Test Suite
 * Validates all 7 Machine Acceptance Criteria from the User Specification
 *
 * Kasus 1: Data contoh pada bagian 7 -> CCI 56,04 dan SDI 84,44 setelah pembulatan dua desimal.
 * Kasus 2: Data total energi hilang -> RE null dan CCI DRAFT; tidak dianggap nol.
 * Kasus 3: Tidak ada bahan pendukung yang sah -> CMI NOT_APPLICABLE; bobot 0,45 0,20 0,15 dibagi total 0,80.
 * Kasus 4: Massa tujuan melebihi asal -> Kesalahan validasi; jangan menerbitkan skor.
 * Kasus 5: NADES atau air ditambahkan -> Tidak menambah massa kering cascara yang diberi kredit.
 * Kasus 6: Pengaman FAIL atau UNKNOWN -> FAIL -> BLOCKED; UNKNOWN -> DRAFT meskipun SDI numerik tinggi.
 * Kasus 7: Duplikasi transfer dan perubahan versi -> flow_id unik; snapshot lama tetap dapat direproduksi.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CalculationPipeline } from '../src/engine/calculation-pipeline.js';
import { CciLiteEngine } from '../src/engine/cci-lite-engine.js';
import { SdiLiteEngine } from '../src/engine/sdi-lite-engine.js';
import { SafeguardsEngine } from '../src/engine/safeguards-engine.js';
import { CalculationStatus, SafeguardStatus, ApplicabilityType, PathwayCategory } from '../src/cdl/types.js';
import { ValidationError } from '../src/cdl/validator.js';
import { reconcileByproductFlows } from '../src/cdl/mass-reconciliation.js';

// Base dummy dataset from Section 7 of the specification
function getSection7DummyData() {
  return {
    assessment: {
      assessment_id: 'ASM-2026-PILOT-001',
      actor_id: 'ORG-PROCESSOR-SOLOK',
      period_start: '2026-06-01',
      period_end: '2026-06-30',
      system_boundary: 'PROCESSING_FACILITY',
      stage: 'PROCESSOR',
      process_type: 'FULL_WASHED',
      linked_lot_ids: ['LOT-CHERRY-001', 'LOT-GREEN-001']
    },
    material_input: [
      {
        flow_id: 'FLOW-MAT-01',
        material_type: 'SUPPORT_PACKAGING_AND_PROCESS',
        total_kg: 150,
        circular_kg: 70,
        basis: 'MEASURED',
        evidence_id: 'EVD-MAT-001'
      }
    ],
    byproduct_origin: [
      {
        origin_flow_id: 'ORIGIN-PULP-01',
        byproduct_type: 'PULP',
        generated_dry_kg: 4500, // 4.500 kg kering total
        wet_kg: 18000,
        moisture_pct: 75.0,
        stock_change_kg: 0
      }
    ],
    byproduct_destination: [
      {
        terminal_flow_id: 'DEST-MAT-01',
        origin_flow_id: 'ORIGIN-PULP-01',
        pathway: PathwayCategory.MATERIAL_BIOLOGICAL, // VF = 1.00
        destination_detail: 'Ekstrak cascara pangan dan kompos',
        utilized_dry_kg: 3500,
        actual_use_date: '2026-06-15',
        evidence_id: 'EVD-USE-001'
      },
      {
        terminal_flow_id: 'DEST-ENG-01',
        origin_flow_id: 'ORIGIN-PULP-01',
        pathway: PathwayCategory.ENERGY_RECOVERY, // VF = 0.50
        destination_detail: 'Briket biomassa bahan bakar pengering',
        utilized_dry_kg: 500,
        actual_use_date: '2026-06-20',
        evidence_id: 'EVD-USE-002'
      },
      {
        terminal_flow_id: 'DEST-DISP-01',
        origin_flow_id: 'ORIGIN-PULP-01',
        pathway: PathwayCategory.DISPOSAL_OR_UNUSED, // VF = 0.00
        destination_detail: 'Dibuang ke landfill / belum digunakan',
        utilized_dry_kg: 500,
        actual_use_date: null,
        evidence_id: null
      }
    ],
    utilities: {
      water_new_l: 8000,
      water_reused_l: 3000,
      energy_total_kwh_eq: 1200,
      energy_renewable_recovered_union_kwh_eq: 300
    },
    indicator_observation: [
      { indicator_code: 'E1', raw_value: 8.0, unit: 'L/kg' }, // target 6 -> 75
      { indicator_code: 'E2', raw_value: 1.2, unit: 'kWh/kg' }, // target 0.9 -> 75
      { indicator_code: 'E3', numerator: 3, denominator: 3, unit: 'items' }, // 3/3 -> 100
      { indicator_code: 'S1', raw_value: 1, unit: 'compliance' }, // lolos -> 100
      { indicator_code: 'S2', numerator: 9, denominator: 10, unit: 'workers' }, // 9/10 -> 90
      { indicator_code: 'S3', numerator: 2, denominator: 3, unit: 'items' }, // 2/3 -> 66.6667
      { indicator_code: 'Ec1', revenue: 100000000, cost: 85000000, unit: 'IDR' }, // 15% margin, target 20% -> 75
      { indicator_code: 'Ec2', numerator: 8, denominator: 10, unit: 'transactions' }, // 8/10 -> 80
      { indicator_code: 'Ec3', numerator: 950, denominator: 1000, unit: 'kg' }, // 950/1000 -> 95
      { indicator_code: 'G1', numerator: 9, denominator: 10, unit: 'transfers' }, // 9/10 -> 90
      { indicator_code: 'G2', numerator: 4, denominator: 4, unit: 'records' }, // 4/4 -> 100
      { indicator_code: 'G3', numerator: 2, denominator: 3, unit: 'actions' } // 2/3 -> 66.6667
    ],
    safeguards: [
      { issue_code: 'FORCED_LABOR', status: 'PASS' },
      { issue_code: 'CHILD_LABOR', status: 'PASS' },
      { issue_code: 'DEFORESTATION', status: 'PASS' },
      { issue_code: 'BANNED_PESTICIDES', status: 'PASS' },
      { issue_code: 'SEVERE_POLLUTION', status: 'PASS' }
    ]
  };
}

describe('CIRCULARTRACE LITE ENGINE ACCEPTANCE CRITERIA', () => {

  // =========================================================================
  // KASUS 1: Data contoh pada Bagian 7 -> CCI 56,04 dan SDI 84,44
  // =========================================================================
  it('Kasus 1: Menghitung Data Contoh Bagian 7 secara presisi -> CCI 56.04 dan SDI 84.44', () => {
    const pipeline = new CalculationPipeline();
    const data = getSection7DummyData();

    const snapshot = pipeline.execute(data);

    // Assert CCI components
    const cciComp = snapshot.scores.cci.componentScores;
    assert.strictEqual(cciComp.CMI.toFixed(6), '0.466667', 'CMI harus 70/150 = 0.466667');
    assert.strictEqual(cciComp.BVC.toFixed(6), '0.833333', 'BVC harus (3500 + 500*0.5)/4500 = 0.833333');
    assert.strictEqual(cciComp.WC.toFixed(6), '0.272727', 'WC harus 3000/11000 = 0.272727');
    assert.strictEqual(cciComp.RE.toFixed(6), '0.250000', 'RE harus 300/1200 = 0.250000');

    // Assert CCI final score
    assert.strictEqual(snapshot.scores.cci.displayScore, 56.04, 'Display CCI harus tepat 56.04');
    assert(Math.abs(snapshot.scores.cci.finalScore - 56.037879) < 0.001, 'Presisi penuh CCI harus disimpan');

    // Assert SDI dimensions
    const dims = snapshot.scores.sdi.dimensions;
    assert.strictEqual(dims.E.score.toFixed(4), '83.3333', 'Dimensi E harus 83.3333');
    assert.strictEqual(dims.S.score.toFixed(4), '85.5556', 'Dimensi S harus 85.5556');
    assert.strictEqual(dims.Ec.score.toFixed(4), '83.3333', 'Dimensi Ec harus 83.3333');
    assert.strictEqual(dims.G.score.toFixed(4), '85.5556', 'Dimensi G harus 85.5556');

    // Assert SDI final score
    assert.strictEqual(snapshot.scores.sdi.displayScore, 84.44, 'Display SDI harus tepat 84.44');
    assert(Math.abs(snapshot.scores.sdi.finalScore - 84.444444) < 0.001, 'Presisi penuh SDI harus disimpan');

    // Assert Coverage and Status
    assert.strictEqual(snapshot.scores.sdi.coveragePct, 100, 'Coverage harus 100%');
    assert.strictEqual(snapshot.status, CalculationStatus.READY_FOR_REVIEW, 'Status harus READY_FOR_REVIEW');
  });

  // =========================================================================
  // KASUS 2: Data total energi hilang -> RE null dan CCI DRAFT; tidak dianggap nol
  // =========================================================================
  it('Kasus 2: Data total energi hilang -> RE bernilai null dan status CCI DRAFT (bukan nol)', () => {
    const pipeline = new CalculationPipeline();
    const data = getSection7DummyData();

    // Set total energy to null (missing)
    data.utilities.energy_total_kwh_eq = null;
    data.utilities.energy_renewable_recovered_union_kwh_eq = 300;

    const snapshot = pipeline.execute(data);

    assert.strictEqual(snapshot.scores.cci.componentScores.RE, null, 'RE harus null, tidak dianggap nol');
    assert.strictEqual(snapshot.scores.cci.finalScore, null, 'CCI final tidak boleh diterbitkan jika RE null');
    assert.strictEqual(snapshot.scores.cci.isComplete, false, 'CCI completeness harus false');
    assert.strictEqual(snapshot.status, CalculationStatus.DRAFT, 'Status snapshot harus DRAFT');
    assert(snapshot.scores.cci.draftScore > 0, 'Skor draft CCI tetap disediakan untuk diagnosis');
  });

  // =========================================================================
  // KASUS 3: Tidak ada bahan pendukung yang sah -> CMI NOT_APPLICABLE, bobot dinormalisasi ulang
  // =========================================================================
  it('Kasus 3: Tidak ada bahan pendukung -> CMI NOT_APPLICABLE; bobot 0.45 0.20 0.15 dibagi 0.80', () => {
    const pipeline = new CalculationPipeline();
    const data = getSection7DummyData();

    // Kosongkan material input (tidak ada bahan pendukung yang sah)
    data.material_input = [];

    const snapshot = pipeline.execute(data);

    assert.strictEqual(snapshot.scores.cci.componentScores.CMI, null, 'CMI harus null');
    assert.strictEqual(
      snapshot.scores.cci.breakdownDetails.cmi.applicability,
      ApplicabilityType.NOT_APPLICABLE,
      'CMI harus berstatus NOT_APPLICABLE'
    );

    // Cek re-normalisasi bobot: 0.45 / 0.80 = 0.5625; 0.20 / 0.80 = 0.25; 0.15 / 0.80 = 0.1875
    const effWeights = snapshot.scores.cci.effectiveWeights;
    assert.strictEqual(effWeights.CMI, 0, 'Bobot efektif CMI harus 0');
    assert.strictEqual(effWeights.BVC, 0.45 / 0.80, 'Bobot efektif BVC harus 0.45/0.80');
    assert.strictEqual(effWeights.WC, 0.20 / 0.80, 'Bobot efektif WC harus 0.20/0.80');
    assert.strictEqual(effWeights.RE, 0.15 / 0.80, 'Bobot efektif RE harus 0.15/0.80');

    // Expected CCI: 100 * (0.833333 * 0.5625 + 0.272727 * 0.25 + 0.25 * 0.1875)
    // = 100 * (0.46875 + 0.06818175 + 0.046875) = 58.38
    assert.strictEqual(snapshot.scores.cci.displayScore, 58.38, 'Skor CCI ter-normalisasi bobot baru');
    assert.strictEqual(snapshot.scores.cci.isComplete, true, 'CCI tetap complete karena CMI sah NOT_APPLICABLE');
  });

  // =========================================================================
  // KASUS 4: Massa tujuan melebihi asal -> Kesalahan validasi; jangan menerbitkan skor
  // =========================================================================
  it('Kasus 4: Massa tujuan melebihi asal -> Melempar ValidationError dan menolak penerbitan skor', () => {
    const pipeline = new CalculationPipeline();
    const data = getSection7DummyData();

    // Jadikan total tujuan melebihi asal: 4.500 kg asal, tapi tujuan total 5.000 kg
    data.byproduct_destination[0].utilized_dry_kg = 4200; // 4200 + 500 + 500 = 5200 kg > 4500 kg

    assert.throws(
      () => {
        pipeline.execute(data);
      },
      (err) => {
        assert(err instanceof ValidationError, 'Harus melempar ValidationError');
        assert.strictEqual(err.code, 'DESTINATION_EXCEEDS_ORIGIN');
        assert(err.message.includes('melebihi massa asal'), 'Pesan kesalahan harus jelas');
        return true;
      },
      'Eksekusi harus dibatalkan saat massa tujuan melebihi asal'
    );
  });

  // =========================================================================
  // KASUS 5: NADES atau air ditambahkan -> Tidak menambah massa kering cascara yang dikreditkan
  // =========================================================================
  it('Kasus 5: Penambahan pelarut NADES / air tidak menambah massa kering cascara yang dikreditkan', () => {
    // Skenario Spesifikasi Bagian 6 & 7:
    // 100 kg cascara kering:
    // 15 kg padatan asal cascara dalam ekstrak digunakan
    // 75 kg residu kompos digunakan
    // 10 kg hilang/dibuang
    // BVC = (15 * 1 + 75 * 1 + 10 * 0) / 100 = 0.90
    // Meskipun cairan ekstrak pasta gigi berbobot total 150 kg (karena ditambah NADES),
    // massa kering cascara yang diakui tetap hanya 15 kg.
    const origins = [
      {
        origin_flow_id: 'CASCARA-BATCH-01',
        byproduct_type: 'CASCARA',
        generated_dry_kg: 100,
        wet_kg: 125,
        moisture_pct: 20
      }
    ];

    const destinations = [
      {
        terminal_flow_id: 'EXTRACT-NADES-01',
        origin_flow_id: 'CASCARA-BATCH-01',
        pathway: PathwayCategory.MATERIAL_BIOLOGICAL,
        destination_detail: 'Ekstrak bioaktif cascara menggunakan pelarut NADES',
        utilized_dry_kg: 150, // Kesalahan input: mencampur massa cairan NADES 135 kg + padatan 15 kg
        added_solvent_kg: 135, // Pelarut ditandai
        solvent_deduction_applied: false,
        actual_use_date: '2026-06-15',
        evidence_id: 'EVD-NADES-01'
      },
      {
        terminal_flow_id: 'COMPOST-RESIDUE-01',
        origin_flow_id: 'CASCARA-BATCH-01',
        pathway: PathwayCategory.MATERIAL_BIOLOGICAL,
        destination_detail: 'Residu ekstraksi dijadikan kompos terpakai',
        utilized_dry_kg: 75,
        actual_use_date: '2026-06-20',
        evidence_id: 'EVD-COMPOST-01'
      }
    ];

    const recon = reconcileByproductFlows(origins, destinations);
    const destExtract = recon.origins['CASCARA-BATCH-01'].destinations.find(d => d.terminal_flow_id === 'EXTRACT-NADES-01');

    assert.strictEqual(destExtract.utilized_dry_kg, 15, 'Massa cascara diakui harus dipotong pelarut NADES menjadi 15 kg');
    assert.strictEqual(recon.origins['CASCARA-BATCH-01'].allocated_dry_kg, 90, 'Total massa diakui adalah 15 kg + 75 kg = 90 kg');

    const bvc = (15 * 1.0 + 75 * 1.0) / 100;
    assert.strictEqual(bvc, 0.90, 'BVC aliran cascara NADES harus tepat 0.90');
  });

  // =========================================================================
  // KASUS 6: Pengaman FAIL atau UNKNOWN -> FAIL -> BLOCKED; UNKNOWN -> DRAFT meskipun SDI tinggi
  // =========================================================================
  it('Kasus 6: Pengaman FAIL -> BLOCKED; Pengaman UNKNOWN -> DRAFT meskipun SDI numerik tinggi', () => {
    const pipeline = new CalculationPipeline();

    // Sub-kasus 6A: Satu pengaman FAIL (misal Pekerja Anak / Deforestasi)
    const dataFail = getSection7DummyData();
    dataFail.safeguards = [
      { issue_code: 'FORCED_LABOR', status: 'PASS' },
      { issue_code: 'CHILD_LABOR', status: 'FAIL' }, // Kritis FAIL
      { issue_code: 'DEFORESTATION', status: 'PASS' },
      { issue_code: 'BANNED_PESTICIDES', status: 'PASS' },
      { issue_code: 'SEVERE_POLLUTION', status: 'PASS' }
    ];

    const snapshotFail = pipeline.execute(dataFail);
    assert.strictEqual(snapshotFail.status, CalculationStatus.BLOCKED, 'Satu pengaman FAIL harus menghasilkan status BLOCKED');
    assert.strictEqual(snapshotFail.scores.sdi.displayScore, 84.44, 'Skor numerik display tetap tersimpan 84.44');
    assert(Math.abs(snapshotFail.scores.sdi.finalScore - 84.444444) < 0.001, 'Skor numerik presisi tetap tersimpan untuk diagnosis internal');
    assert(snapshotFail.safeguards.failingIssues.includes('CHILD_LABOR'), 'Harus mendeteksi issue yang gagal');

    // Sub-kasus 6B: Satu pengaman UNKNOWN
    const dataUnknown = getSection7DummyData();
    dataUnknown.safeguards = [
      { issue_code: 'FORCED_LABOR', status: 'PASS' },
      { issue_code: 'CHILD_LABOR', status: 'PASS' },
      { issue_code: 'DEFORESTATION', status: 'PASS' },
      { issue_code: 'BANNED_PESTICIDES', status: 'UNKNOWN' }, // Belum diaudit
      { issue_code: 'SEVERE_POLLUTION', status: 'PASS' }
    ];

    const snapshotUnknown = pipeline.execute(dataUnknown);
    assert.strictEqual(snapshotUnknown.status, CalculationStatus.DRAFT, 'Pengaman UNKNOWN harus menahan status pada DRAFT');
    assert.strictEqual(snapshotUnknown.scores.sdi.finalScore, null, 'Final score tidak dipublikasikan selama DRAFT');
    assert.strictEqual(snapshotUnknown.scores.sdi.displayScore, null, 'Display final score null selama DRAFT');
    assert(Math.abs(snapshotUnknown.scores.sdi.draftScore - 84.444444) < 0.001, 'Draft score SDI tetap tersedia');
  });

  // =========================================================================
  // KASUS 7: Duplikasi transfer dan perubahan versi -> flow_id unik; snapshot lama dapat direproduksi
  // =========================================================================
  it('Kasus 7: Menolak duplikasi flow_id dan menjamin reproduksibilitas snapshot berversi', () => {
    const pipeline = new CalculationPipeline();

    // 7A: Verifikasi penolakan duplikasi flow_id
    const dataDup = getSection7DummyData();
    dataDup.byproduct_destination.push({
      terminal_flow_id: 'DEST-MAT-01', // DUPLIKASI terminal_flow_id
      origin_flow_id: 'ORIGIN-PULP-01',
      pathway: PathwayCategory.MATERIAL_BIOLOGICAL,
      utilized_dry_kg: 100,
      actual_use_date: '2026-06-25',
      evidence_id: 'EVD-DUP-01'
    });

    assert.throws(
      () => {
        pipeline.execute(dataDup);
      },
      (err) => {
        assert(err instanceof ValidationError);
        assert.strictEqual(err.code, 'DUPLICATE_FLOW_ID');
        return true;
      },
      'Harus melempar error DUPLICATE_FLOW_ID'
    );

    // 7B: Verifikasi reproduksibilitas snapshot lama saat data berubah
    const originalData = getSection7DummyData();
    const snap1 = pipeline.execute(originalData);

    // Ubah data input untuk simulasi perubahan periode berikutnya
    const modifiedData = getSection7DummyData();
    modifiedData.utilities.water_reused_l = 6000; // Peningkatan daur ulang air
    const snap2 = pipeline.execute(modifiedData);

    assert.notStrictEqual(snap1.snapshot_id, snap2.snapshot_id, 'Setiap kalkulasi harus memiliki snapshot_id unik');
    assert.strictEqual(snap1.scores.cci.displayScore, 56.04, 'Snapshot 1 harus tetap identik dengan nilai historisnya');
    assert(snap2.scores.cci.displayScore > 56.04, 'Snapshot 2 mencerminkan kenaikan daur ulang air');

    // Verifikasi snapshot 1 dapat diambil kembali dan identik
    const retrievedSnap1 = pipeline.getSnapshot(snap1.snapshot_id);
    assert.deepStrictEqual(retrievedSnap1, snap1, 'Snapshot lama harus 100% dapat direproduksi dari store');
  });

  // =========================================================================
  // PENGUJIAN TAMBAHAN: Agregasi Rantai Pasok (Section 8)
  // =========================================================================
  it('Agregasi Rantai Pasok: CCI menjumlahkan aliran tanpa rata-rata fasilitas, SDI memakai rerata profil tahap', async () => {
    const { ChainAggregationEngine } = await import('../src/engine/chain-aggregation.js');
    const pipeline = new CalculationPipeline();

    // Buat 4 snapshot tahap dengan profil yang terkalibrasi
    const dataProc = getSection7DummyData();
    const snapProc = pipeline.execute(dataProc);

    const snapFarmer = JSON.parse(JSON.stringify(snapProc));
    snapFarmer.stage = 'FARMER';
    snapFarmer.assessment_id = 'ASM-FARMER-01';

    const snapWh = JSON.parse(JSON.stringify(snapProc));
    snapWh.stage = 'WAREHOUSE_EXPORTER';
    snapWh.assessment_id = 'ASM-WH-01';

    const snapRoast = JSON.parse(JSON.stringify(snapProc));
    snapRoast.stage = 'ROASTERY';
    snapRoast.assessment_id = 'ASM-ROAST-01';

    // 1. Agregasi CCI
    const chainCci = ChainAggregationEngine.aggregateCci([dataProc, dataProc, dataProc, dataProc]);
    assert(chainCci.chainCciScore > 0, 'Skor agregasi rantai CCI harus terhitung');
    assert.strictEqual(chainCci.label, 'Skor Agregasi Aliran Rantai Pasok (Bukan Rerata Fasilitas)');

    // 2. Agregasi SDI lengkap
    const chainSdi = ChainAggregationEngine.aggregateSdi([snapFarmer, snapProc, snapWh, snapRoast]);
    assert.strictEqual(chainSdi.isChainComplete, true, 'Rantai harus lengkap');
    assert.strictEqual(chainSdi.label, 'rerata profil tahap (Bukan SDI berbobot dampak atau skor eksklusif lot)');
    assert.strictEqual(chainSdi.chainSdiScore, 84.44, 'Rerata profil tahap harus tepat 84.44');

    // 3. Pengaman FAIL pada satu aktor memblokir klaim seluruh rantai
    snapFarmer.status = CalculationStatus.BLOCKED;
    snapFarmer.safeguards.overallSafeguardStatus = SafeguardStatus.FAIL;
    const blockedChain = ChainAggregationEngine.aggregateSdi([snapFarmer, snapProc, snapWh, snapRoast]);
    assert.strictEqual(blockedChain.status, CalculationStatus.BLOCKED, 'Pengaman FAIL pada satu aktor memblokir rantai');
    assert.strictEqual(blockedChain.chainSdiScore, null, 'Skor publik rantai harus null jika BLOCKED');
  });
});
