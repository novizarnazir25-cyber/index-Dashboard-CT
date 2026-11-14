-- ============================================================================
-- ROLLBACK MIGRATION: 001_rollback_cdl_and_lite_engines.sql
-- Purpose: Safely and cleanly drop all CDL tables and indexes without touching
--          or corrupting legacy CciScore / CsdiScore tables and foreign keys.
-- ============================================================================

DROP INDEX IF EXISTS "idx_cdl_snapshots_assessment";
DROP INDEX IF EXISTS "idx_cdl_safeguards_assessment";
DROP INDEX IF EXISTS "idx_cdl_indicators_assessment";
DROP INDEX IF EXISTS "idx_cdl_byproduct_destinations_origin";
DROP INDEX IF EXISTS "idx_cdl_byproduct_origins_assessment";
DROP INDEX IF EXISTS "idx_cdl_material_inputs_assessment";
DROP INDEX IF EXISTS "idx_cdl_assessments_actor_period";

DROP TABLE IF EXISTS "cdl_calculation_snapshots";
DROP TABLE IF EXISTS "cdl_safeguard_observations";
DROP TABLE IF EXISTS "cdl_indicator_observations";
DROP TABLE IF EXISTS "cdl_utilities_observations";
DROP TABLE IF EXISTS "cdl_byproduct_destinations";
DROP TABLE IF EXISTS "cdl_byproduct_origins";
DROP TABLE IF EXISTS "cdl_material_inputs";
DROP TABLE IF EXISTS "cdl_benchmark_registry";
DROP TABLE IF EXISTS "cdl_evidence_records";
DROP TABLE IF EXISTS "cdl_assessments";
