-- ============================================================================
-- MIGRATION: 003_add_fairtrade_readiness_tables.sql
-- Purpose: Add Fairtrade Readiness Index (FRI) entities, raw audit checklist
--          assessments, calculated readiness results, and analytical indexes.
-- Preserves all existing CDL (001) and CT-4CI (002) tables.
-- ============================================================================

-- 1. Tabel Master Entitas Rantai Pasok (Koperasi, Petani, Prosesor, atau Roastery)
CREATE TABLE IF NOT EXISTS entities (
    entity_id SERIAL PRIMARY KEY,
    entity_name VARCHAR(150) NOT NULL,
    entity_type VARCHAR(50) CHECK (entity_type IN ('cooperative', 'farmer_group', 'processor', 'roaster')),
    region VARCHAR(100), -- Contoh: Argopuro, Kintamani
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Parameter Asesmen Fairtrade (Menyimpan data mentah checklist per audit/periode)
CREATE TABLE IF NOT EXISTS fairtrade_assessments (
    assessment_id SERIAL PRIMARY KEY,
    entity_id INT REFERENCES entities(entity_id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    auditor_name VARCHAR(100),
    
    -- Pilar 1: Ekonomi (Economic Criteria)
    democratic_premium_mgmt BOOLEAN DEFAULT FALSE,
    transparent_pricing BOOLEAN DEFAULT FALSE,
    
    -- Pilar 2: Sosial & Ketenagakerjaan (Social & Labor Criteria)
    no_child_forced_labor BOOLEAN DEFAULT FALSE,
    ohs_ppe_compliance BOOLEAN DEFAULT FALSE,
    fair_wages_contracts BOOLEAN DEFAULT FALSE,
    
    -- Pilar 3: Lingkungan & Sirkularitas (Environmental & CCI Integration)
    waste_valorization_cci BOOLEAN DEFAULT FALSE, -- Terhubung dengan modul Coffee Circularity Index
    no_forest_conversion BOOLEAN DEFAULT FALSE,
    reduced_chemical_use BOOLEAN DEFAULT FALSE,
    
    -- Pilar 4: Tata Kelola & Keterlacakan (Governance & Traceability)
    plot_mapping_complete BOOLEAN DEFAULT FALSE,   -- Terhubung dengan data poligon/koordinat lahan
    physical_segregation BOOLEAN DEFAULT FALSE,    -- Pemisahan stok bersertifikat & non-sertifikat
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Hasil Kalkulasi Indeks (Menyimpan skor akhir dan celah temuan)
CREATE TABLE IF NOT EXISTS fairtrade_readiness_results (
    result_id SERIAL PRIMARY KEY,
    assessment_id INT REFERENCES fairtrade_assessments(assessment_id) ON DELETE CASCADE,
    entity_id INT REFERENCES entities(entity_id) ON DELETE CASCADE,
    
    -- Skor Per Pilar (Skala 0 - 100)
    economic_score DECIMAL(5,2),
    social_score DECIMAL(5,2),
    environmental_score DECIMAL(5,2),
    governance_score DECIMAL(5,2),
    
    -- Skor Total & Status Kesiapan
    fri_total_score DECIMAL(5,2) NOT NULL,
    readiness_status VARCHAR(50) CHECK (readiness_status IN ('Ready for Certification', 'Progressing', 'Needs Major Improvement')),
    
    -- Catatan Rekomendasi / Celah (Disimpan dalam format JSON array untuk fleksibilitas front-end)
    identified_gaps JSONB,
    
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indeks untuk mempercepat query analitik di Dashboard CircularTrace
CREATE INDEX IF NOT EXISTS idx_fri_entity ON fairtrade_readiness_results(entity_id);
CREATE INDEX IF NOT EXISTS idx_fri_total ON fairtrade_readiness_results(fri_total_score);
