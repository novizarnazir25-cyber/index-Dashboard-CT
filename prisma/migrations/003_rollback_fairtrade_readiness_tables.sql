-- ============================================================================
-- ROLLBACK: 003_rollback_fairtrade_readiness_tables.sql
-- Purpose: Safely drop Fairtrade Readiness Index tables and indexes.
-- ============================================================================

DROP INDEX IF EXISTS idx_fri_total;
DROP INDEX IF EXISTS idx_fri_entity;
DROP TABLE IF EXISTS fairtrade_readiness_results;
DROP TABLE IF EXISTS fairtrade_assessments;
DROP TABLE IF EXISTS entities;
