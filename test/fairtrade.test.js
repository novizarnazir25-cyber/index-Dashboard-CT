/**
 * CIRCULARTRACE - FAIRTRADE READINESS INDEX (FRI) TEST SUITE
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateFairtradeReadiness } from '../src/engine/fairtrade-engine.js';

describe('FAIRTRADE READINESS INDEX (FRI) ENGINE ACCEPTANCE SUITE', () => {
  it('Kasus 1: Seluruh kriteria terpenuhi -> FRI 100.0% & Ready for Certification', () => {
    const fullData = {
      democratic_premium_mgmt: true,
      transparent_pricing: true,
      no_child_forced_labor: true,
      ohs_ppe_compliance: true,
      fair_wages_contracts: true,
      waste_valorization_cci: true,
      no_forest_conversion: true,
      reduced_chemical_use: true,
      plot_mapping_complete: true,
      physical_segregation: true
    };

    const res = calculateFairtradeReadiness(fullData);
    assert.strictEqual(res.fairtrade_readiness_index, 100.0);
    assert.strictEqual(res.status, 'Ready for Certification (Sangat Siap)');
    assert.strictEqual(res.pillar_scores.economic, 100.0);
    assert.strictEqual(res.pillar_scores.social, 100.0);
    assert.strictEqual(res.pillar_scores.environmental, 100.0);
    assert.strictEqual(res.pillar_scores.governance, 100.0);
    assert.strictEqual(res.identified_gaps.length, 0);
  });

  it('Kasus 2: Progressing status (60 <= FRI < 85) dengan celah teridentifikasi', () => {
    const partialData = {
      democratic_premium_mgmt: false, // Gap 1
      transparent_pricing: true,      // E = 50
      no_child_forced_labor: true,
      ohs_ppe_compliance: true,
      fair_wages_contracts: true,     // S = 100
      waste_valorization_cci: false,  // Gap 2, Env = 50
      no_forest_conversion: true,
      reduced_chemical_use: true,
      plot_mapping_complete: true,
      physical_segregation: true      // G = 100
    };

    // E: 50, S: 100, Env: 50, G: 100
    // Total FRI: (50*0.25) + (100*0.25) + (50*0.25) + (100*0.25) = 12.5 + 25 + 12.5 + 25 = 75.0
    const res = calculateFairtradeReadiness(partialData);
    assert.strictEqual(res.fairtrade_readiness_index, 75.0);
    assert.strictEqual(res.status, 'Progressing (Dalam Proses / Perlu Perbaikan Minor)');
    assert.strictEqual(res.pillar_scores.economic, 50.0);
    assert.strictEqual(res.pillar_scores.social, 100.0);
    assert.strictEqual(res.pillar_scores.environmental, 50.0);
    assert.strictEqual(res.pillar_scores.governance, 100.0);
    assert.ok(res.identified_gaps.some(g => g.includes('premi koperasi')));
    assert.ok(res.identified_gaps.some(g => g.includes('sirkularitas (CCI)')));
  });

  it('Kasus 3: Kriteria rendah (< 60) -> Needs Major Improvement', () => {
    const lowData = {
      democratic_premium_mgmt: false,
      transparent_pricing: false,
      no_child_forced_labor: false,
      ohs_ppe_compliance: false,
      fair_wages_contracts: false,
      waste_valorization_cci: false,
      no_forest_conversion: false,
      reduced_chemical_use: false,
      plot_mapping_complete: false,
      physical_segregation: false
    };

    const res = calculateFairtradeReadiness(lowData);
    assert.strictEqual(res.fairtrade_readiness_index, 0.0);
    assert.strictEqual(res.status, 'Needs Major Improvement (Belum Siap / Butuh Pendampingan)');
    assert.ok(res.identified_gaps.length >= 4);
  });
});
