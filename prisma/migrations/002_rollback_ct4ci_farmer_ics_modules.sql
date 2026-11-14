-- ============================================================================
-- ROLLBACK MIGRATION: 002_rollback_ct4ci_farmer_ics_modules.sql
-- Purpose: Revert migration 002 by safely dropping the newly added CT-4CI tables.
-- ============================================================================

DROP TABLE IF EXISTS "ct_offline_drafts";
DROP TABLE IF EXISTS "ct_audit_trail";
DROP TABLE IF EXISTS "ct_capa_records";
DROP TABLE IF EXISTS "ct_4ci_snapshots";
DROP TABLE IF EXISTS "ct_checkpoint_assessments";
DROP TABLE IF EXISTS "ct_evidence_items";
DROP TABLE IF EXISTS "ct_question_mappings";
DROP TABLE IF EXISTS "ct_field_questions";
DROP TABLE IF EXISTS "ct_checkpoint_register";
DROP TABLE IF EXISTS "ct_ics_inspections";
DROP TABLE IF EXISTS "ct_practice_records";
DROP TABLE IF EXISTS "ct_plots";
DROP TABLE IF EXISTS "ct_farms";
DROP TABLE IF EXISTS "ct_farmers";
