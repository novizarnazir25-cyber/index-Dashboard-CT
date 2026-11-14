-- ============================================================================
-- MIGRATION: 002_add_ct4ci_farmer_ics_modules.sql
-- Purpose: Add Farmer Registration, Farm & Plot, Cultivation Practices,
--          ICS Inspections, 4C Checkpoint Register, Verification, CT-4CI Snapshots,
--          CAPA, Audit Trail, and Offline Drafts.
-- Preserves all legacy and CDL 001 tables.
-- ============================================================================

-- 1. Farmers
CREATE TABLE IF NOT EXISTS "ct_farmers" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "farmerCode" TEXT UNIQUE NOT NULL,
    "groupId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "membershipStatus" TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'PENDING'
    "joinedDate" DATETIME,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subDistrict" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "phone" TEXT,
    "farmRole" TEXT NOT NULL DEFAULT 'OWNER_OPERATOR', -- 'OWNER_OPERATOR', 'SHARECROPPER', 'MANAGER', 'FAMILY_WORKER'
    "smartphoneAccess" TEXT NOT NULL DEFAULT 'YES', -- 'YES', 'NO', 'SHARED'
    "connectivityStatus" TEXT NOT NULL DEFAULT 'GOOD', -- 'GOOD', 'LIMITED', 'OFFLINE_ONLY'
    "assistanceNeeded" BOOLEAN NOT NULL DEFAULT 0,
    "preferredConfirmationMethod" TEXT NOT NULL DEFAULT 'DIGITAL_APP', -- 'DIGITAL_APP', 'ORAL_ASSISTED', 'PHYSICAL_SIGNATURE'
    "dataConsentGiven" BOOLEAN NOT NULL DEFAULT 1,
    "dataConsentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConsentMethod" TEXT NOT NULL DEFAULT 'DIGITAL_APP', -- 'DIGITAL_APP', 'ORAL_RECORDED', 'WRITTEN_FORM'
    "recordedByOfficerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("groupId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("recordedByOfficerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 2. Farms
CREATE TABLE IF NOT EXISTS "ct_farms" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "farmCode" TEXT UNIQUE NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAreaHa" REAL NOT NULL DEFAULT 0,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "subDistrict" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("farmerId") REFERENCES "ct_farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Plots
CREATE TABLE IF NOT EXISTS "ct_plots" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "plotCode" TEXT UNIQUE NOT NULL,
    "farmId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "polygonGeoJson" TEXT,
    "geodataMethod" TEXT, -- 'GPS_HANDHELD', 'MOBILE_APP', 'SATELLITE_DIGITIZED', 'ESTIMATED'
    "geodataAccuracyMeters" REAL,
    "geodataOfficer" TEXT,
    "geodataDate" DATETIME,
    "areaHa" REAL NOT NULL,
    "areaUnit" TEXT NOT NULL DEFAULT 'HECTARE',
    "areaSource" TEXT NOT NULL DEFAULT 'GPS_SURVEY', -- 'GPS_SURVEY', 'LAND_TITLE', 'FARMER_DECLARATION'
    "tenureStatus" TEXT NOT NULL DEFAULT 'OWNED_CERTIFIED', -- 'OWNED_CERTIFIED', 'OWNED_CUSTOMARY', 'LEASED', 'FOREST_CONCESSION_LEGAL'
    "tenureDocumentRef" TEXT,
    "coffeeSpecies" TEXT NOT NULL DEFAULT 'ARABICA', -- 'ARABICA', 'ROBUSTA', 'LIBERICA'
    "varieties" TEXT,
    "plantingYear" INTEGER,
    "plantPopulation" INTEGER,
    "shadeTreesDescription" TEXT,
    "landSlopeCondition" TEXT, -- 'FLAT', 'GENTLE', 'STEEP'
    "waterSourceDescription" TEXT,
    "sensitiveAreaProximity" TEXT,
    "estimatedAnnualProductionKg" REAL,
    "productForm" TEXT NOT NULL DEFAULT 'FRESH_CHERRY',
    "productionStatus" TEXT NOT NULL DEFAULT 'MEASURED', -- 'MEASURED', 'REPORTED', 'ESTIMATED'
    "isDuplicateFlagged" BOOLEAN NOT NULL DEFAULT 0,
    "duplicateNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("farmId") REFERENCES "ct_farms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("farmerId") REFERENCES "ct_farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Practice Records (A. Soil/Crop, B. Pest/Chemical, C. Water/Waste, D. Labor/Safety, E. Economy/Inst)
CREATE TABLE IF NOT EXISTS "ct_practice_records" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "farmerId" TEXT NOT NULL,
    "plotId" TEXT,
    "category" TEXT NOT NULL, -- 'SOIL_CROP', 'PEST_CHEMICAL', 'WATER_WASTE_ENV', 'LABOR_SAFETY', 'ECON_INST'
    "observationDate" DATETIME NOT NULL,
    "periodId" TEXT NOT NULL,
    "sourceInfo" TEXT NOT NULL DEFAULT 'DIRECT_OBSERVATION',
    "recordedByUserId" TEXT,
    "dataPayloadJson" TEXT NOT NULL,
    "farmerConfirmationStatus" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'DISPUTED'
    "confirmationMethod" TEXT,
    "confirmationDate" DATETIME,
    "confirmationNotes" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'REJECTED'
    "verifierUserId" TEXT,
    "verificationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("farmerId") REFERENCES "ct_farmers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("plotId") REFERENCES "ct_plots" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("recordedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("verifierUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 5. ICS Inspections
CREATE TABLE IF NOT EXISTS "ct_ics_inspections" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "inspectionCode" TEXT UNIQUE NOT NULL,
    "farmerId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "plotIdsJson" TEXT NOT NULL,
    "inspectorUserId" TEXT NOT NULL,
    "inspectionDate" DATETIME NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'ROUTINE_ANNUAL',
    "findingsSummary" TEXT,
    "farmerConfirmation" TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'REFUTED'
    "confirmationProofUri" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'DRAFT', 'SUBMITTED', 'REVIEWED'
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("farmerId") REFERENCES "ct_farmers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("farmId") REFERENCES "ct_farms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("inspectorUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 6. Checkpoint Register (Official 4C Code of Conduct)
CREATE TABLE IF NOT EXISTS "ct_checkpoint_register" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "checkpointCode" TEXT UNIQUE NOT NULL, -- e.g. 'P001' .. 'P108', 'ME001' .. 'ME033', 'SP001' .. 'SP083'
    "module" TEXT NOT NULL DEFAULT 'PRODUCER', -- 'PRODUCER', 'MANAGING_ENTITY', 'SERVICE_PROVIDER'
    "dimension" TEXT NOT NULL, -- 'ECONOMIC', 'SOCIAL', 'ENVIRONMENTAL', 'GOVERNANCE'
    "title" TEXT NOT NULL,
    "officialRef" TEXT NOT NULL,
    "sourceDoc" TEXT NOT NULL DEFAULT '4C Code of Conduct v4.1',
    "sourceVersion" TEXT NOT NULL DEFAULT 'v4.1',
    "sourceLocation" TEXT,
    "isMajor" BOOLEAN NOT NULL DEFAULT 0,
    "assessmentLevel" TEXT NOT NULL DEFAULT 'LEVEL_1_ENTRY', -- 'LEVEL_1_ENTRY', 'LEVEL_2_MEDIUM', 'LEVEL_3_ADVANCED'
    "applicabilityRule" TEXT NOT NULL DEFAULT 'ALL_PRODUCERS',
    "assessmentScope" TEXT NOT NULL DEFAULT 'PRODUCER_WIDE', -- 'PRODUCER_WIDE', 'PER_PLOT_ALL_MUST_PASS', 'GROUP_WIDE'
    "fieldQuestionPrompt" TEXT NOT NULL,
    "requiredEvidenceDescription" TEXT NOT NULL,
    "evidenceSufficiencyRule" TEXT NOT NULL,
    "scoringRule" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'VALIDATED', -- 'VALIDATED', 'PENDING_SOURCE_VALIDATION'
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Field Questions & Question-to-Checkpoint Mappings
CREATE TABLE IF NOT EXISTS "ct_field_questions" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "questionCode" TEXT UNIQUE NOT NULL,
    "category" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE', -- 'BOOLEAN', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'NUMERIC', 'TEXT', 'PHOTO'
    "optionsJson" TEXT,
    "conditionalLogicJson" TEXT,
    "helpText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ct_question_mappings" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "questionId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "mappingNotes" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'VALIDATED',
    FOREIGN KEY ("questionId") REFERENCES "ct_field_questions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("checkpointId") REFERENCES "ct_checkpoint_register" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 8. Evidence Items
CREATE TABLE IF NOT EXISTS "ct_evidence_items" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "evidenceCode" TEXT UNIQUE NOT NULL,
    "title" TEXT NOT NULL,
    "docType" TEXT NOT NULL, -- 'PHOTO_FIELD', 'INTERVIEW_NOTE', 'PURCHASE_RECEIPT', 'TRAINING_LOG', 'LAB_TEST', 'GEODATA_POLYGON', 'DISPUTE_MEMO'
    "fileUri" TEXT NOT NULL,
    "sha256Hash" TEXT,
    "farmerId" TEXT,
    "plotId" TEXT,
    "practiceRecordId" TEXT,
    "inspectionId" TEXT,
    "checkpointIdsJson" TEXT,
    "uploadedByUserId" TEXT,
    "sufficiencyStatus" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION', -- 'NOT_AVAILABLE', 'PENDING_VERIFICATION', 'INSUFFICIENT', 'SUFFICIENT', 'NEEDS_REVIEW'
    "verifierUserId" TEXT,
    "verifierDecisionDate" DATETIME,
    "verifierNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("farmerId") REFERENCES "ct_farmers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("plotId") REFERENCES "ct_plots" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("practiceRecordId") REFERENCES "ct_practice_records" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("inspectionId") REFERENCES "ct_ics_inspections" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("uploadedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("verifierUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 9. Checkpoint Assessment
CREATE TABLE IF NOT EXISTS "ct_checkpoint_assessments" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "period" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL, -- 'PRODUCER', 'PLOT', 'GROUP'
    "scopeId" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "applicability" TEXT NOT NULL DEFAULT 'APPLICABLE', -- 'APPLICABLE', 'NOT_APPLICABLE', 'UNDECIDED'
    "nonApplicabilityReason" TEXT,
    "applicabilityApprovedBy" TEXT,
    "evidenceSufficiency" TEXT NOT NULL DEFAULT 'NOT_AVAILABLE', -- 'NOT_AVAILABLE', 'PENDING_VERIFICATION', 'INSUFFICIENT', 'SUFFICIENT', 'NEEDS_REVIEW'
    "linkedEvidenceIdsJson" TEXT,
    "complianceResult" TEXT NOT NULL DEFAULT 'UNDETERMINED', -- 'COMPLIANT', 'NON_COMPLIANT', 'UNDETERMINED'
    "evaluationNotes" TEXT,
    "verifierUserId" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("checkpointId") REFERENCES "ct_checkpoint_register" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("applicabilityApprovedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("verifierUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 10. CT-4CI Calculation Snapshots
CREATE TABLE IF NOT EXISTS "ct_4ci_snapshots" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "period" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL, -- 'PRODUCER', 'GROUP'
    "scopeId" TEXT NOT NULL,
    "registerVersion" TEXT NOT NULL DEFAULT '4C-v4.1',
    "totalInventory" INTEGER NOT NULL,
    "applicableCount" INTEGER NOT NULL,
    "approvedNotApplicableCount" INTEGER NOT NULL,
    "undecidedApplicabilityCount" INTEGER NOT NULL,
    "sufficientEvidenceCount" INTEGER NOT NULL,
    "compliantWithSufficientEvidenceCount" INTEGER NOT NULL,
    "nonCompliantWithSufficientEvidenceCount" INTEGER NOT NULL,
    "insufficientEvidenceCount" INTEGER NOT NULL,
    "ct4ciScore" REAL, -- null if cannot calculate
    "evidenceCoveragePct" REAL, -- null if cannot calculate
    "calculationStatus" TEXT NOT NULL DEFAULT 'CALCULATED', -- 'CALCULATED', 'PROVISIONAL', 'CANNOT_CALCULATE'
    "cannotCalculateReason" TEXT,
    "majorGateStatus" TEXT NOT NULL DEFAULT 'PASSED', -- 'PASSED', 'UNRESOLVED'
    "majorNonCompliantCount" INTEGER NOT NULL DEFAULT 0,
    "majorInsufficientCount" INTEGER NOT NULL DEFAULT 0,
    "majorUndecidedCount" INTEGER NOT NULL DEFAULT 0,
    "dimensionBreakdownJson" TEXT NOT NULL,
    "idsmRulesSummaryJson" TEXT NOT NULL,
    "isSampleSimulation" BOOLEAN NOT NULL DEFAULT 0,
    "calculatedByUserId" TEXT,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("calculatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 11. CAPA Records (Corrective Action Plans)
CREATE TABLE IF NOT EXISTS "ct_capa_records" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "capaCode" TEXT UNIQUE NOT NULL,
    "findingTitle" TEXT NOT NULL,
    "checkpointId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL, -- 'PRODUCER', 'PLOT', 'GROUP'
    "scopeId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL DEFAULT 'MAJOR_NON_COMPLIANT', -- 'MAJOR_NON_COMPLIANT', 'MAJOR_INSUFFICIENT_EVIDENCE', 'MINOR_GAP', 'DATA_QUALITY'
    "rootCauseAnalysis" TEXT,
    "correctiveActionPlan" TEXT NOT NULL,
    "responsiblePerson" TEXT NOT NULL,
    "deadlineDate" DATETIME NOT NULL,
    "estimatedCostIdr" REAL DEFAULT 0,
    "actualCostIdr" REAL DEFAULT 0,
    "completionProofRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'CLOSED', 'REJECTED'
    "verifierUserId" TEXT,
    "verifierClosureDecision" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("checkpointId") REFERENCES "ct_checkpoint_register" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("verifierUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 12. Audit Trail
CREATE TABLE IF NOT EXISTS "ct_audit_trail" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'CALCULATE', 'CONFIRM'
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "changeReason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 13. Offline Drafts & Synchronization
CREATE TABLE IF NOT EXISTS "ct_offline_drafts" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "clientId" TEXT NOT NULL,
    "idempotencyKey" TEXT UNIQUE NOT NULL,
    "entityType" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SYNCED', 'CONFLICT'
    "conflictNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" DATETIME
);
