/**
 * CIRCULARTRACE - HTTP REST API Integration Test Suite
 * Tests all endpoints end-to-end against the live HTTP server.
 */

process.env.NODE_ENV = 'test';

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { server, globalDataStore } from '../src/api/server.js';

describe('CIRCULARTRACE - HTTP REST API INTEGRATION TESTS', () => {
  const PORT = 3001;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  before(() => {
    return new Promise((resolve) => {
      server.listen(PORT, '127.0.0.1', () => {
        resolve();
      });
    });
  });

  after(() => {
    return new Promise((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  function makeRequest(path, options = {}, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const reqOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Actor-Role': 'VERIFIER',
          'X-Actor-Id': 'USR-VER-01',
          ...(options.headers || {})
        }
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk.toString(); });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  it('1. GET /api/farmers returns list with profile summaries', async () => {
    const res = await makeRequest('/api/farmers');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.farmers));
    assert.ok(res.body.farmers.length >= 2);
    const syamsul = res.body.farmers.find(f => f.farmerCode === 'F-SLK-001');
    assert.ok(syamsul);
    assert.strictEqual(syamsul.plotCount, 2);
    assert.strictEqual(syamsul.totalAreaHa, 2.0);
  });

  it('2. GET /api/dashboard/overview returns integrated CT-4CI, CT-CI, and CT-SDI', async () => {
    const res = await makeRequest('/api/dashboard/overview?farmerId=FARMER-SLK-001&period=2026-PANEN-RAYA');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.disclaimer.includes('Bukan sertifikat atau keputusan audit resmi 4C'));
    assert.strictEqual(res.body.isSimulationData, true);

    const { indices } = res.body;
    assert.strictEqual(indices.ct4ci.score, 95.9);
    assert.strictEqual(indices.ct4ci.coverage, 100.0);
    assert.strictEqual(indices.ct4ci.majorGateStatus, 'PASSED');
    assert.strictEqual(indices.ctCci.score, 56.04);
    assert.strictEqual(indices.ctSdi.score, 84.44);
  });

  it('3. GET /api/checkpoints returns all 108 Producer checkpoints', async () => {
    const res = await makeRequest('/api/checkpoints?module=PRODUCER');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.total, 108);

    const econ = res.body.checkpoints.filter(c => c.dimension === 'ECONOMIC');
    const soc = res.body.checkpoints.filter(c => c.dimension === 'SOCIAL');
    const env = res.body.checkpoints.filter(c => c.dimension === 'ENVIRONMENTAL');

    assert.strictEqual(econ.length, 19, 'Ekonomi harus 19 item (P001..P019)');
    assert.strictEqual(soc.length, 50, 'Sosial harus 50 item (P020..P069)');
    assert.strictEqual(env.length, 39, 'Lingkungan harus 39 item (P070..P108)');
  });

  it('4. POST /api/plots validates coordinates and detects proximity duplicates', async () => {
    const res = await makeRequest('/api/plots', { method: 'POST' }, {
      plotCode: 'PLT-DUP-TEST',
      farmerId: 'FARMER-SLK-001',
      latitude: -1.042503,
      longitude: 100.751202,
      areaHa: 0.5
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.plot.isDuplicateFlagged, true);
    assert.ok(res.body.duplicateWarning.includes('meter'));
  });

  it('5. POST /api/practices detects banned chemicals (Paraquat)', async () => {
    const res = await makeRequest('/api/practices', { method: 'POST' }, {
      farmerId: 'FARMER-SLK-001',
      category: 'PEST_CHEMICAL',
      observationDate: '2026-05-01',
      dataPayloadJson: {
        pesticideApplications: [
          { productName: 'Gramoxone Herbisida', activeIngredient: 'Paraquat dichloride', dose: '2 L/Ha' }
        ]
      }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.validation.hasBannedPesticide, true);
    assert.strictEqual(res.body.validation.bannedPesticides[0].bannedItem, 'Paraquat');
  });

  it('6. POST /api/sync enforces idempotency and handles offline batches', async () => {
    const idKey = `TEST-IDEMPOTENT-${Date.now()}`;
    const res1 = await makeRequest('/api/sync', { method: 'POST' }, {
      idempotencyKey: idKey,
      entityType: 'DRAFT_BATCH',
      payload: { count: 3 }
    });
    assert.strictEqual(res1.body.synced, true);

    // Second call with same idempotency key
    const res2 = await makeRequest('/api/sync', { method: 'POST' }, {
      idempotencyKey: idKey,
      entityType: 'DRAFT_BATCH',
      payload: { count: 3 }
    });
    assert.strictEqual(res2.body.synced, false);
    assert.strictEqual(res2.body.isDuplicate, true);
  });

  it('7. GET /api/export?type=csv returns downloadable CSV', async () => {
    const res = await makeRequest('/api/export?type=csv');
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/csv'));
    assert.ok(res.body.includes('farmerCode,fullName'));
    assert.ok(res.body.includes('Syamsul Arifin'));
  });

  it('8. GET /api/stakeholders returns all 11 synchronized stakeholders and supply chain flow', async () => {
    const res = await makeRequest('/api/stakeholders');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.totalStakeholders, 11);
    assert.strictEqual(res.body.stakeholders.length, 11);
    
    // Check specific required stakeholders
    const roles = res.body.stakeholders.map(s => s.roleCode);
    assert.ok(roles.includes('FARMER'));
    assert.ok(roles.includes('FARMER_GROUP'));
    assert.ok(roles.includes('PROCESSOR'));
    assert.ok(roles.includes('WAREHOUSE'));
    assert.ok(roles.includes('ROASTERY'));
    assert.ok(roles.includes('COFFEE_SHOP'));
    assert.ok(roles.includes('BUYER'));
    assert.ok(roles.includes('ICS_VERIFIER_FARMER'));
    assert.ok(roles.includes('ICS_VERIFIER_PROCESSOR'));
    assert.ok(roles.includes('VERIFIER_WAREHOUSE'));
    assert.ok(roles.includes('VERIFIER_ROASTERY'));

    // Check paired verifier relations
    const farmer = res.body.stakeholders.find(s => s.roleCode === 'FARMER');
    assert.strictEqual(farmer.pairedVerifierRole, 'ICS_VERIFIER_FARMER');

    const processor = res.body.stakeholders.find(s => s.roleCode === 'PROCESSOR');
    assert.strictEqual(processor.pairedVerifierRole, 'ICS_VERIFIER_PROCESSOR');

    const warehouse = res.body.stakeholders.find(s => s.roleCode === 'WAREHOUSE');
    assert.strictEqual(warehouse.pairedVerifierRole, 'VERIFIER_WAREHOUSE');

    const roastery = res.body.stakeholders.find(s => s.roleCode === 'ROASTERY');
    assert.strictEqual(roastery.pairedVerifierRole, 'VERIFIER_ROASTERY');

    // Check supply chain steps
    assert.strictEqual(res.body.supplyChainFlow.length, 6);
    assert.strictEqual(res.body.supplyChainFlow[0].from, 'FARMER');
    assert.strictEqual(res.body.supplyChainFlow[5].to, 'BUYER');
  });

  it('9. POST /api/practices/evaluate-readiness evaluates questionnaire answers and updates CT-4CI snapshot', async () => {
    // 1. Fetch presets
    const presetsRes = await makeRequest('/api/practices/presets');
    assert.strictEqual(presetsRes.status, 200);
    assert.ok(presetsRes.body.presets.READY_4C_COMPLIANT);
    assert.ok(presetsRes.body.presets.MAJOR_FAIL_VIOLATION);

    // 2. Submit compliant questionnaire
    const evalRes1 = await makeRequest('/api/practices/evaluate-readiness', { method: 'POST' }, {
      farmerId: 'FARMER-SLK-001',
      period: '2026-PANEN-RAYA',
      answers: presetsRes.body.presets.READY_4C_COMPLIANT
    });

    assert.strictEqual(evalRes1.status, 200);
    assert.strictEqual(evalRes1.body.success, true);
    assert.strictEqual(evalRes1.body.bannedChemicalDetected, false);
    assert.ok(evalRes1.body.snapshot.ct4ciScore >= 95.0);
    assert.strictEqual(evalRes1.body.snapshot.majorGateStatus, 'PASSED');

    // 3. Submit violation questionnaire (Paraquat + Deforestation)
    const evalRes2 = await makeRequest('/api/practices/evaluate-readiness', { method: 'POST' }, {
      farmerId: 'FARMER-SLK-001',
      period: '2026-PANEN-RAYA',
      answers: presetsRes.body.presets.MAJOR_FAIL_VIOLATION
    });

    assert.strictEqual(evalRes2.status, 200);
    assert.strictEqual(evalRes2.body.bannedChemicalDetected, true);
    assert.ok(evalRes2.body.bannedChemicalReason.includes('Paraquat'));
    assert.strictEqual(evalRes2.body.snapshot.majorGateStatus, 'UNRESOLVED');
    assert.ok(evalRes2.body.generatedCapasCount > 0);
  });

  it('10. GET /api/capa/playbook returns 4C remedial action guides with steps and evidence', async () => {
    const res = await makeRequest('/api/capa/playbook');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.playbook));
    assert.ok(res.body.playbook.length >= 8);

    const bannedChemAction = res.body.playbook.find(p => p.id === 'ACT-01-BANNED-CHEMICALS');
    assert.ok(bannedChemAction);
    assert.strictEqual(bannedChemAction.isMajor, true);
    assert.ok(bannedChemAction.actionSteps.length >= 3);
    assert.ok(bannedChemAction.requiredEvidence.length >= 2);
  });

  it('11. POST /api/capa/resolve-all resolves open CAPAs and unlocks CT-4CI Major Gate to PASSED', async () => {
    // 1. Get open CAPAs
    const capaListRes = await makeRequest('/api/capa?farmerId=FARMER-SLK-001');
    assert.strictEqual(capaListRes.status, 200);

    // 2. Resolve all CAPAs
    const resolveRes = await makeRequest('/api/capa/resolve-all', { method: 'POST' }, {
      farmerId: 'FARMER-SLK-001',
      period: '2026-PANEN-RAYA',
      notes: 'Verifikasi pemenuhan tindakan perbaikan 4C lengkap'
    });

    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.success, true);
    assert.ok(resolveRes.body.snapshot);
    assert.strictEqual(resolveRes.body.snapshot.majorGateStatus, 'PASSED');
    assert.strictEqual(resolveRes.body.snapshot.ct4ciScore, 100);
  });
});
