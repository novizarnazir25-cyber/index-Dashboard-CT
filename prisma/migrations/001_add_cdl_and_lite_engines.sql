-- ============================================================================
-- MIGRATION: 001_add_cdl_and_lite_engines.sql
-- Purpose: Add Common Data Layer (CDL), Benchmark Registry, Evidence, Safeguards,
--          and Calculation Snapshots without touching legacy CciScore / CsdiScore tables.
-- ============================================================================

-- 1. Assessment Boundary Table
CREATE TABLE IF NOT EXISTS "cdl_assessments" (
    "assessmentId" TEXT PRIMARY KEY NOT NULL,
    "actorId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "systemBoundary" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "processType" TEXT NOT NULL,
    "linkedLotIds" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("actorId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 2. Evidence Records
CREATE TABLE IF NOT EXISTS "cdl_evidence_records" (
    "evidenceId" TEXT PRIMARY KEY NOT NULL,
    "uri" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "sha256Hash" TEXT,
    "verifierId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Benchmark Registry
CREATE TABLE IF NOT EXISTS "cdl_benchmark_registry" (
    "benchmarkId" TEXT PRIMARY KEY NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "targetValue" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "processType" TEXT NOT NULL,
    "region" TEXT,
    "year" INTEGER NOT NULL,
    "referenceSource" TEXT NOT NULL,
    "establishedBy" TEXT NOT NULL,
    "benchmarkVersion" TEXT NOT NULL DEFAULT 'v1.0-2026',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Material Inputs (Circular Material Input - CMI)
CREATE TABLE IF NOT EXISTS "cdl_material_inputs" (
    "flowId" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "totalKg" REAL NOT NULL,
    "circularKg" REAL NOT NULL,
    "basis" TEXT NOT NULL DEFAULT 'MEASURED',
    "evidenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("evidenceId") REFERENCES "cdl_evidence_records" ("evidenceId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. Byproduct Origins
CREATE TABLE IF NOT EXISTS "cdl_byproduct_origins" (
    "originFlowId" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "byproductType" TEXT NOT NULL,
    "wetKg" REAL NOT NULL,
    "moisturePct" REAL NOT NULL,
    "generatedDryKg" REAL NOT NULL,
    "stockChangeKg" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Byproduct Destinations (Byproduct Valorization Circularity - BVC)
CREATE TABLE IF NOT EXISTS "cdl_byproduct_destinations" (
    "terminalFlowId" TEXT PRIMARY KEY NOT NULL,
    "originFlowId" TEXT NOT NULL,
    "pathway" TEXT NOT NULL, -- 'MATERIAL_BIOLOGICAL', 'ENERGY_RECOVERY', 'DISPOSAL_OR_UNUSED'
    "destinationDetail" TEXT NOT NULL,
    "utilizedDryKg" REAL NOT NULL,
    "actualUseDate" DATETIME,
    "evidenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("originFlowId") REFERENCES "cdl_byproduct_origins" ("originFlowId") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("evidenceId") REFERENCES "cdl_evidence_records" ("evidenceId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 7. Utilities Observations (Water Circularity - WC & Renewable Energy - RE)
CREATE TABLE IF NOT EXISTS "cdl_utilities_observations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "waterNewL" REAL NOT NULL,
    "waterReusedL" REAL NOT NULL,
    "energyTotalKwhEq" REAL,
    "energyRenewableRecoveredUnionKwhEq" REAL,
    "evidenceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("evidenceId") REFERENCES "cdl_evidence_records" ("evidenceId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 8. Indicator Observations (CT-SDI 12 Core Indicators)
CREATE TABLE IF NOT EXISTS "cdl_indicator_observations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "numerator" REAL,
    "denominator" REAL,
    "rawValue" REAL,
    "unit" TEXT NOT NULL,
    "benchmarkId" TEXT,
    "applicability" TEXT NOT NULL DEFAULT 'APPLICABLE',
    "evidenceIds" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'MEASURED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("benchmarkId") REFERENCES "cdl_benchmark_registry" ("benchmarkId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 9. Safeguard Observations (Non-Compensable Safeguards)
CREATE TABLE IF NOT EXISTS "cdl_safeguard_observations" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "issueCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNKNOWN', -- 'PASS', 'FAIL', 'UNKNOWN'
    "verifierId" TEXT,
    "notes" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("verifierId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 10. Calculation Snapshots (Immutable, Server-Side, Reproducible Audit Trail)
CREATE TABLE IF NOT EXISTS "cdl_calculation_snapshots" (
    "snapshotId" TEXT PRIMARY KEY NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "formulaVersion" TEXT NOT NULL,
    "inputsSnapshot" TEXT NOT NULL,
    "cciScore" REAL,
    "cciBreakdown" TEXT,
    "sdiScore" REAL,
    "sdiDimensions" TEXT,
    "coveragePct" REAL NOT NULL,
    "safeguardStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL DEFAULT 'Lite-1.0',
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("assessmentId") REFERENCES "cdl_assessments" ("assessmentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for high-performance querying and audit integrity
CREATE INDEX IF NOT EXISTS "idx_cdl_assessments_actor_period" ON "cdl_assessments" ("actorId", "periodStart", "periodEnd");
CREATE INDEX IF NOT EXISTS "idx_cdl_material_inputs_assessment" ON "cdl_material_inputs" ("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_cdl_byproduct_origins_assessment" ON "cdl_byproduct_origins" ("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_cdl_byproduct_destinations_origin" ON "cdl_byproduct_destinations" ("originFlowId");
CREATE INDEX IF NOT EXISTS "idx_cdl_indicators_assessment" ON "cdl_indicator_observations" ("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_cdl_safeguards_assessment" ON "cdl_safeguard_observations" ("assessmentId");
CREATE INDEX IF NOT EXISTS "idx_cdl_snapshots_assessment" ON "cdl_calculation_snapshots" ("assessmentId", "calculatedAt");
