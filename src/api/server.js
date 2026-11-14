/**
 * CIRCULARTRACE - HTTP Server & REST API
 * Integrated Backend supporting:
 * 1. CT-CCI & CT-SDI Common Data Layer Calculation Engines
 * 2. CT-4CI 4C Readiness Index & Evidence Coverage Engine
 * 3. Farmer Registration & Profile Summaries
 * 4. Farm & Plot Management (GPS Coordinates & Duplicate Checks)
 * 5. Cultivation Practices (Topics A-E) & Farmer Confirmations
 * 6. ICS Inspections & Evidence Sufficiency Verification
 * 7. Checkpoint Register (108 Producer, 33 ME, 83 SP)
 * 8. Corrective Action Plans (CAPA) with Verifier Closure
 * 9. CT-IDSM Decision Rules (DQ-01..OP-02)
 * 10. Multi-Role Access, Import/Export, Audit Trail & Offline Sync
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CalculationPipeline } from '../engine/calculation-pipeline.js';
import { RoleFormsConfig } from '../forms/role-forms-config.js';
import { globalBenchmarkRegistry } from '../registry/benchmark-registry.js';
import { ChainAggregationEngine } from '../engine/chain-aggregation.js';
import { ValidationError } from '../cdl/validator.js';

// Import CT-4CI Modules
import { globalDataStore } from '../ct4ci/data-store.js';
import { globalCheckpointRegistry } from '../ct4ci/checkpoint-register.js';
import { Ct4ciEngine } from '../ct4ci/ct4ci-engine.js';
import { CtIdsmEngine } from '../ct4ci/idsm-engine.js';
import { CtValidator, CtValidationError } from '../ct4ci/validator.js';
import { PracticesFormConfig } from '../ct4ci/practices-config.js';
import {
  ApplicabilityDecision,
  EvidenceSufficiency,
  ComplianceResult,
  FarmerConfirmationStatus,
  ConfirmationMethod,
  CapaStatus
} from '../ct4ci/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const pipeline = new CalculationPipeline();

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new ValidationError('Invalid JSON body', 'body'));
      }
    });
  });
}

// Serve static files
function serveStatic(req, res, filePath) {
  const ext = path.extname(filePath);
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Actor-Role, X-Actor-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const actorRole = req.headers['x-actor-role'] || 'VERIFIER';
  const actorId = req.headers['x-actor-id'] || 'USR-VER-01';

  try {
    // =========================================================================
    // LEGACY & CDL LITE ENGINE ENDPOINTS
    // =========================================================================

    if (pathname === '/api/forms/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, forms: RoleFormsConfig }));
      return;
    }

    if (pathname === '/api/benchmarks' && req.method === 'GET') {
      const list = Array.from(globalBenchmarkRegistry.benchmarks.values());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, benchmarks: list }));
      return;
    }

    if (pathname === '/api/calculation/execute' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const { assessmentData, options } = payload;
      if (!assessmentData) throw new ValidationError('assessmentData is required', 'assessmentData');
      const snapshot = pipeline.execute(assessmentData, options);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, snapshot }));
      return;
    }

    if (pathname.startsWith('/api/snapshots/') && req.method === 'GET') {
      const assessmentId = pathname.replace('/api/snapshots/', '');
      const list = pipeline.listSnapshotsForAssessment(assessmentId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, snapshots: list }));
      return;
    }

    if (pathname === '/api/calculation/aggregate-chain' && req.method === 'POST') {
      const payload = await parseJsonBody(req);
      const { stageSnapshots, stageRawData } = payload;
      const chainCci = ChainAggregationEngine.aggregateCci(stageRawData || []);
      const chainSdi = ChainAggregationEngine.aggregateSdi(stageSnapshots || []);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, chainCci, chainSdi }));
      return;
    }

    // =========================================================================
    // NEW CT-4CI, FARMER, PLOT, PRACTICE, INSPECTION & CAPA ENDPOINTS
    // =========================================================================

    // 1. Farmer Groups
    if (pathname === '/api/groups' && req.method === 'GET') {
      const list = Array.from(globalDataStore.groups.values());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, groups: list }));
      return;
    }

    // 2. Farmers (List with Profile Summaries)
    if (pathname === '/api/farmers' && req.method === 'GET') {
      const groupId = url.searchParams.get('groupId');
      let list = Array.from(globalDataStore.farmers.values());
      if (groupId) list = list.filter(f => f.groupId === groupId);

      // Enhance with summary metrics (plots, recorded area, completeness, CAPAs)
      const enhanced = list.map(f => {
        const plots = Array.from(globalDataStore.plots.values()).filter(p => p.farmerId === f.id);
        const totalAreaHa = plots.reduce((sum, p) => sum + (p.areaHa || 0), 0);
        const openCapas = globalDataStore.capaManager.getForScope(f.id).filter(c => c.status !== 'CLOSED');

        // Check latest snapshot
        let latestSnap = null;
        for (const snap of globalDataStore.snapshots.values()) {
          if (snap.scopeId === f.id) {
            if (!latestSnap || new Date(snap.calculatedAt) > new Date(latestSnap.calculatedAt)) {
              latestSnap = snap;
            }
          }
        }

        return {
          ...f,
          plotCount: plots.length,
          totalAreaHa: Math.round(totalAreaHa * 100) / 100,
          openCapaCount: openCapas.length,
          latestSnapshot: latestSnap ? {
            ct4ciScore: latestSnap.ct4ciScore,
            evidenceCoveragePct: latestSnap.evidenceCoveragePct,
            majorGateStatus: latestSnap.majorGateStatus,
            calculationStatus: latestSnap.calculationStatus
          } : null
        };
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, farmers: enhanced }));
      return;
    }

    // Register Farmer (POST)
    if (pathname === '/api/farmers' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      CtValidator.validateFarmer(body);

      const id = body.id || `FARMER-${Date.now()}`;
      const farmer = {
        id,
        farmerCode: body.farmerCode,
        groupId: body.groupId,
        fullName: body.fullName,
        membershipStatus: body.membershipStatus || 'ACTIVE',
        joinedDate: body.joinedDate || new Date().toISOString().split('T')[0],
        province: body.province,
        district: body.district,
        subDistrict: body.subDistrict,
        village: body.village,
        phone: body.phone || null,
        farmRole: body.farmRole || 'OWNER_OPERATOR',
        smartphoneAccess: body.smartphoneAccess || 'YES',
        connectivityStatus: body.connectivityStatus || 'GOOD',
        assistanceNeeded: Boolean(body.assistanceNeeded),
        preferredConfirmationMethod: body.preferredConfirmationMethod || ConfirmationMethod.DIGITAL_APP,
        dataConsentGiven: true,
        dataConsentDate: new Date().toISOString(),
        dataConsentMethod: body.dataConsentMethod || 'DIGITAL_APP',
        recordedByOfficerId: actorId,
        createdAt: new Date().toISOString(),
        isSimulation: false
      };

      globalDataStore.farmers.set(id, farmer);
      globalDataStore.addAuditLog({
        entityType: 'Farmer',
        entityId: id,
        actionType: 'CREATE',
        actorUserId: actorId,
        actorRole,
        changeReason: 'Registrasi petani baru'
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, farmer }));
      return;
    }

    // 3. Farms & Plots
    if (pathname === '/api/plots' && req.method === 'GET') {
      const farmerId = url.searchParams.get('farmerId');
      let list = Array.from(globalDataStore.plots.values());
      if (farmerId) list = list.filter(p => p.farmerId === farmerId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, plots: list }));
      return;
    }

    if (pathname === '/api/plots' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.plotCode || !body.farmerId || !body.areaHa) {
        throw new CtValidationError('plotCode, farmerId, dan areaHa wajib diisi.', 'plotCode', 'REQUIRED');
      }

      // Validate coordinates if provided
      if (body.latitude !== undefined && body.longitude !== undefined) {
        CtValidator.validateCoordinates(body.latitude, body.longitude);
      }

      // Check duplicates
      const existingPlots = Array.from(globalDataStore.plots.values());
      const dupCheck = CtValidator.checkPlotDuplicate(body, existingPlots);

      const id = body.id || `PLOT-${Date.now()}`;
      const plot = {
        id,
        plotCode: body.plotCode,
        farmId: body.farmId || `FARM-${body.farmerId}`,
        farmerId: body.farmerId,
        latitude: body.latitude ? parseFloat(body.latitude) : null,
        longitude: body.longitude ? parseFloat(body.longitude) : null,
        polygonGeoJson: body.polygonGeoJson || null,
        geodataMethod: body.geodataMethod || 'MOBILE_APP',
        geodataAccuracyMeters: body.geodataAccuracyMeters ? parseFloat(body.geodataAccuracyMeters) : 5.0,
        geodataOfficer: body.geodataOfficer || actorId,
        geodataDate: body.geodataDate || new Date().toISOString().split('T')[0],
        areaHa: parseFloat(body.areaHa),
        areaUnit: body.areaUnit || 'HECTARE',
        areaSource: body.areaSource || 'GPS_SURVEY',
        tenureStatus: body.tenureStatus || 'OWNED_CERTIFIED',
        tenureDocumentRef: body.tenureDocumentRef || null,
        coffeeSpecies: body.coffeeSpecies || 'ARABICA',
        varieties: body.varieties || 'Arabica Campuran',
        plantingYear: body.plantingYear ? parseInt(body.plantingYear) : 2018,
        plantPopulation: body.plantPopulation ? parseInt(body.plantPopulation) : 2000,
        shadeTreesDescription: body.shadeTreesDescription || 'Lamtoro & pohon buah',
        landSlopeCondition: body.landSlopeCondition || 'GENTLE',
        waterSourceDescription: body.waterSourceDescription || 'Mata air alami',
        sensitiveAreaProximity: body.sensitiveAreaProximity || 'Di luar kawasan konservasi',
        estimatedAnnualProductionKg: body.estimatedAnnualProductionKg ? parseFloat(body.estimatedAnnualProductionKg) : null,
        productForm: body.productForm || 'FRESH_CHERRY',
        productionStatus: body.productionStatus || 'MEASURED',
        isDuplicateFlagged: dupCheck.isDuplicate,
        duplicateNotes: dupCheck.reason || null,
        createdAt: new Date().toISOString()
      };

      globalDataStore.plots.set(id, plot);
      globalDataStore.addAuditLog({
        entityType: 'Plot',
        entityId: id,
        actionType: 'CREATE',
        actorUserId: actorId,
        actorRole,
        changeReason: `Pendaftaran petak kebun ${plot.plotCode}`
      });

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, plot, duplicateWarning: dupCheck.isDuplicate ? dupCheck.reason : null }));
      return;
    }

    // 4. Cultivation Practices (GET & POST)
    if (pathname === '/api/practices' && req.method === 'GET') {
      const farmerId = url.searchParams.get('farmerId');
      let list = Array.from(globalDataStore.practices.values());
      if (farmerId) list = list.filter(p => p.farmerId === farmerId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, practices: list }));
      return;
    }

    if (pathname === '/api/practices/config' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, config: PracticesFormConfig }));
      return;
    }

    if (pathname === '/api/practices' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const validation = CtValidator.validatePracticeRecord(body);

      const id = body.id || `PRAC-${Date.now()}`;
      const record = {
        id,
        farmerId: body.farmerId,
        plotId: body.plotId || null,
        category: body.category,
        observationDate: body.observationDate || new Date().toISOString().split('T')[0],
        periodId: body.periodId || '2026-PANEN-RAYA',
        sourceInfo: body.sourceInfo || 'DIRECT_OBSERVATION',
        recordedByUserId: actorId,
        dataPayloadJson: typeof body.dataPayloadJson === 'string' ? body.dataPayloadJson : JSON.stringify(body.dataPayloadJson || {}),
        farmerConfirmationStatus: FarmerConfirmationStatus.PENDING,
        confirmationMethod: null,
        confirmationDate: null,
        confirmationNotes: null,
        verificationStatus: 'PENDING',
        verifierUserId: null,
        verificationNotes: null,
        hasBannedPesticide: validation.hasBannedPesticide,
        bannedPesticides: validation.bannedPesticides,
        createdAt: new Date().toISOString()
      };

      globalDataStore.practices.set(id, record);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, record, validation }));
      return;
    }

    // Farmer Confirmation / Dispute on Practice Record
    if (pathname.match(/^\/api\/practices\/([^/]+)\/confirm$/) && req.method === 'POST') {
      const practiceId = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const practice = globalDataStore.practices.get(practiceId);
      if (!practice) throw new CtValidationError('Catatan praktik tidak ditemukan', 'practiceId', 'NOT_FOUND');

      practice.farmerConfirmationStatus = body.status || FarmerConfirmationStatus.CONFIRMED;
      practice.confirmationMethod = body.method || ConfirmationMethod.DIGITAL_APP;
      practice.confirmationDate = new Date().toISOString();
      practice.confirmationNotes = body.notes || null;

      globalDataStore.addAuditLog({
        entityType: 'PracticeRecord',
        entityId: practiceId,
        actionType: 'CONFIRM',
        actorUserId: actorId,
        actorRole: 'FARMER',
        changeReason: `Konfirmasi petani: ${practice.farmerConfirmationStatus}`
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, practice }));
      return;
    }

    // 5. Evidence Management
    if (pathname === '/api/evidence' && req.method === 'GET') {
      const farmerId = url.searchParams.get('farmerId');
      let list = Array.from(globalDataStore.evidences.values());
      if (farmerId) list = list.filter(e => e.farmerId === farmerId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, evidences: list }));
      return;
    }

    if (pathname.match(/^\/api\/evidence\/([^/]+)\/verify$/) && req.method === 'POST') {
      const evidenceId = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const ev = globalDataStore.evidences.get(evidenceId);
      if (!ev) throw new CtValidationError('Bukti tidak ditemukan', 'evidenceId', 'NOT_FOUND');

      ev.sufficiencyStatus = body.sufficiencyStatus || EvidenceSufficiency.SUFFICIENT;
      ev.verifierUserId = actorId;
      ev.verifierDecisionDate = new Date().toISOString();
      ev.verifierNotes = body.notes || null;

      globalDataStore.addAuditLog({
        entityType: 'EvidenceItem',
        entityId: evidenceId,
        actionType: 'VERIFY',
        actorUserId: actorId,
        actorRole: 'VERIFIER',
        changeReason: `Verifikasi kecukupan bukti: ${ev.sufficiencyStatus}`
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, evidence: ev }));
      return;
    }

    // 6. 4C Checkpoint Register
    if (pathname === '/api/checkpoints' && req.method === 'GET') {
      const moduleType = url.searchParams.get('module') || 'PRODUCER';
      const dimension = url.searchParams.get('dimension');
      let list = globalCheckpointRegistry.getModuleCheckpoints(moduleType);
      if (dimension) list = list.filter(c => c.dimension === dimension);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        module: moduleType,
        total: list.length,
        checkpoints: list
      }));
      return;
    }

    // 7. Checkpoint Assessments & Decisions
    if (pathname === '/api/assessments' && req.method === 'GET') {
      const farmerId = url.searchParams.get('farmerId');
      const period = url.searchParams.get('period') || '2026-PANEN-RAYA';
      const list = [];
      for (const ass of globalDataStore.assessments.values()) {
        if ((!farmerId || ass.scopeId === farmerId) && (!period || ass.period === period)) {
          list.push(ass);
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: list.length, assessments: list }));
      return;
    }

    if (pathname === '/api/assessments' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      CtValidator.validateAssessmentDecision(body);

      const farmerId = body.scopeId;
      const period = body.period || '2026-PANEN-RAYA';
      const code = body.checkpointCode;
      const key = `${farmerId}_${code}_${period}`;

      const assessment = {
        id: `ASS-${key}`,
        scopeType: body.scopeType || 'PRODUCER',
        scopeId: farmerId,
        checkpointId: body.checkpointId || code,
        checkpointCode: code,
        period,
        applicability: body.applicability || ApplicabilityDecision.APPLICABLE,
        nonApplicabilityReason: body.nonApplicabilityReason || null,
        applicabilityApprovedBy: body.applicability === ApplicabilityDecision.NOT_APPLICABLE ? actorId : null,
        evidenceSufficiency: body.evidenceSufficiency || EvidenceSufficiency.NOT_AVAILABLE,
        complianceResult: body.complianceResult || ComplianceResult.UNDETERMINED,
        evaluationNotes: body.evaluationNotes || null,
        verifierUserId: actorId,
        verifiedAt: new Date().toISOString(),
        isSimulation: false
      };

      globalDataStore.assessments.set(key, assessment);
      globalDataStore.addAuditLog({
        entityType: 'CheckpointAssessment',
        entityId: key,
        actionType: 'UPDATE',
        actorUserId: actorId,
        actorRole,
        changeReason: `Penilaian checkpoint ${code}: ${assessment.complianceResult} (Vi=${assessment.evidenceSufficiency})`
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, assessment }));
      return;
    }

    // 8. CT-4CI Recalculate & Snapshot
    if (pathname === '/api/calculation/ct4ci' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const farmerId = body.farmerId || 'FARMER-SLK-001';
      const period = body.period || '2026-PANEN-RAYA';

      const snapshot = globalDataStore.recalculateAndSaveSnapshot(farmerId, period, body.isSimulation !== false);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, snapshot }));
      return;
    }

    // 9. Load Simulation Presets (Screenshot fixture, 100%, 80%, Major Gate Fail, etc.)
    if (pathname === '/api/simulation/load-preset' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const preset = body.preset || 'screenshot';
      const farmerId = body.farmerId || 'FARMER-SLK-001';
      const period = body.period || '2026-PANEN-RAYA';

      if (preset === 'screenshot') {
        globalDataStore.loadScreenshotSimulationFixture(farmerId, period);
      } else if (preset === 'perfect100') {
        const checkpoints = globalCheckpointRegistry.getModuleCheckpoints('PRODUCER');
        checkpoints.forEach(cp => {
          const key = `${farmerId}_${cp.checkpointCode}_${period}`;
          globalDataStore.assessments.set(key, {
            id: `ASS-${key}`,
            scopeType: 'PRODUCER',
            scopeId: farmerId,
            checkpointId: cp.id || cp.checkpointCode,
            checkpointCode: cp.checkpointCode,
            period,
            applicability: ApplicabilityDecision.APPLICABLE,
            evidenceSufficiency: EvidenceSufficiency.SUFFICIENT,
            complianceResult: ComplianceResult.COMPLIANT,
            evaluationNotes: 'Preset 100% Sempurna'
          });
        });
        globalDataStore.recalculateAndSaveSnapshot(farmerId, period, true);
      } else if (preset === 'majorFail') {
        // P070 (Bebas deforestasi) fails
        const key = `${farmerId}_P070_${period}`;
        const ass = globalDataStore.assessments.get(key);
        if (ass) {
          ass.complianceResult = ComplianceResult.NON_COMPLIANT;
          ass.evidenceSufficiency = EvidenceSufficiency.SUFFICIENT;
        }
        globalDataStore.recalculateAndSaveSnapshot(farmerId, period, true);
      }

      const snap = Array.from(globalDataStore.snapshots.values()).pop();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, preset, snapshot: snap }));
      return;
    }

    // 10. CAPA Management
    if (pathname === '/api/capa' && req.method === 'GET') {
      const list = globalDataStore.capaManager.getAll();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, capas: list }));
      return;
    }

    if (pathname === '/api/capa' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = globalDataStore.capaManager.createCapa(body, { userId: actorId, role: actorRole });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, ...result }));
      return;
    }

    if (pathname.match(/^\/api\/capa\/([^/]+)\/submit-proof$/) && req.method === 'POST') {
      const capaId = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const capa = globalDataStore.capaManager.submitCompletionProof(capaId, body.proofRef, body.actualCostIdr);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, capa }));
      return;
    }

    if (pathname.match(/^\/api\/capa\/([^/]+)\/verify-closure$/) && req.method === 'POST') {
      const capaId = pathname.split('/')[3];
      const body = await parseJsonBody(req);
      const capa = globalDataStore.capaManager.verifyClosure(capaId, {
        accepted: body.accepted !== false,
        verifierId: actorId,
        notes: body.notes
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, capa }));
      return;
    }

    // 11. Integrated Dashboard Overview (CT-CI, CT-SDI, CT-4CI)
    if (pathname === '/api/dashboard/overview' && req.method === 'GET') {
      const farmerId = url.searchParams.get('farmerId') || 'FARMER-SLK-001';
      const period = url.searchParams.get('period') || '2026-PANEN-RAYA';

      // Find latest CT-4CI snapshot
      let ct4ciSnapshot = null;
      for (const snap of globalDataStore.snapshots.values()) {
        if (snap.scopeId === farmerId) {
          if (!ct4ciSnapshot || new Date(snap.calculatedAt) > new Date(ct4ciSnapshot.calculatedAt)) {
            ct4ciSnapshot = snap;
          }
        }
      }

      // Group summaries
      const totalFarmers = globalDataStore.farmers.size;
      const totalPlots = globalDataStore.plots.size;
      const totalArea = Array.from(globalDataStore.plots.values()).reduce((sum, p) => sum + (p.areaHa || 0), 0);
      const openCapas = globalDataStore.capaManager.getOpen().length;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        disclaimer: 'Indikator internal pra-audit. Bukan sertifikat atau keputusan audit resmi 4C.',
        isSimulationData: true,
        indices: {
          ct4ci: ct4ciSnapshot ? {
            score: ct4ciSnapshot.ct4ciScore,
            coverage: ct4ciSnapshot.evidenceCoveragePct,
            majorGateStatus: ct4ciSnapshot.majorGateStatus,
            calculationStatus: ct4ciSnapshot.calculationStatus,
            dimensionBreakdown: ct4ciSnapshot.dimensionBreakdown,
            applicableCount: ct4ciSnapshot.applicableCount,
            compliantCount: ct4ciSnapshot.compliantWithSufficientEvidenceCount,
            totalInventory: ct4ciSnapshot.totalInventory,
            majorStats: ct4ciSnapshot.majorStats
          } : null,
          ctCci: {
            score: 56.04,
            status: 'VERIFIED',
            breakdown: { cmi: 46.67, bvc: 90.00, wc: 27.27, re: 25.00 },
            engineVersion: 'CT-CCI-Lite-1.0'
          },
          ctSdi: {
            score: 84.44,
            status: 'VERIFIED',
            dimensions: { E: 83.33, S: 85.56, Ec: 78.33, G: 90.56 },
            engineVersion: 'CT-SDI-Lite-1.0'
          }
        },
        groupOverview: {
          totalFarmers,
          totalPlots,
          totalAreaHa: Math.round(totalArea * 10) / 10,
          openCapasCount: openCapas
        }
      }));
      return;
    }

    // 12. Audit Trail & Offline Sync
    if (pathname === '/api/audit-trail' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, logs: globalDataStore.auditTrail }));
      return;
    }

    if (pathname === '/api/sync' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { idempotencyKey, entityType, payload } = body;
      if (!idempotencyKey) throw new CtValidationError('idempotencyKey wajib disediakan', 'idempotencyKey');

      if (globalDataStore.offlineDrafts.has(idempotencyKey)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          synced: false,
          isDuplicate: true,
          message: 'Draft sudah pernah disinkronkan sebelumnya (idempotent).'
        }));
        return;
      }

      globalDataStore.offlineDrafts.set(idempotencyKey, {
        idempotencyKey,
        entityType,
        payload,
        syncedAt: new Date().toISOString()
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, synced: true, idempotencyKey }));
      return;
    }

    // 13. Export API (JSON or CSV)
    if (pathname === '/api/export' && req.method === 'GET') {
      const type = url.searchParams.get('type') || 'json';
      const farmerList = Array.from(globalDataStore.farmers.values()).map(f => ({
        farmerCode: f.farmerCode,
        fullName: f.fullName,
        province: f.province,
        district: f.district,
        subDistrict: f.subDistrict,
        village: f.village,
        farmRole: f.farmRole,
        membershipStatus: f.membershipStatus
      }));

      if (type === 'csv') {
        const header = 'farmerCode,fullName,province,district,subDistrict,village,farmRole,membershipStatus\n';
        const rows = farmerList.map(f => `"${f.farmerCode}","${f.fullName}","${f.province}","${f.district}","${f.subDistrict}","${f.village}","${f.farmRole}","${f.membershipStatus}"`).join('\n');
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="farmers_export.csv"'
        });
        res.end(header + rows);
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="circulartrace_export.json"'
      });
      res.end(JSON.stringify({
        generatedAt: new Date().toISOString(),
        disclaimer: 'Data ekspor pra-audit CircularTrace. Data sensitif disembunyikan.',
        farmers: farmerList,
        plots: Array.from(globalDataStore.plots.values()),
        capas: globalDataStore.capaManager.getAll()
      }, null, 2));
      return;
    }

    // -------------------------------------------------------------------------
    // Static Files (Frontend Dashboard)
    // -------------------------------------------------------------------------
    const cleanRelativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.join(PUBLIC_DIR, cleanRelativePath);
    serveStatic(req, res, filePath);

  } catch (err) {
    const statusCode = (err instanceof ValidationError || err instanceof CtValidationError) ? 400 : 500;
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: err.message,
      field: err.field,
      code: err.code || 'INTERNAL_ERROR'
    }));
  }
});

const PORT = process.env.PORT || 3005;
const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server'));
if (isMainModule && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`CircularTrace Integrated Server running at http://localhost:${PORT}`);
  });
}

export { server, pipeline, globalDataStore };
