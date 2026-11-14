# Audit Skema & Pemetaan Data CircularTrace ke Versi Lite

**Dokumen:** Spesifikasi Teknis & Audit Arsitektur Data  
**Versi Mesin Baru:** `CT-CCI-Lite-1.0` & `CT-SDI-Lite-1.0`  
**Target:** CircularTrace Common Data Layer (CDL) & Execution Engine  
**Tanggal:** 4 Oktober 2026  

---

## 1. Ringkasan Eksekutif & Tujuan Audit

Sistem CircularTrace sebelumnya menggunakan model penilaian berbasis skor subjektif teragregasi per-lot (`CciScore` dan `CsdiScore` versi `2.1-research`) dengan pilar Petani (35%) dan Pengolah (65%) untuk CCI, serta tiga pilar ESG untuk CSDI.

Sesuai spesifikasi **"Metode sederhana pengukuran sirkularitas dan keberlanjutan kopi" (Prof. Dr. Novizar Nazir, 4 Oktober 2026)**, CircularTrace beralih ke:
1. **Dua indeks terpisah berskala 0–100**:
   - **CT-CCI-Lite-1.0**: 4 rasio aliran sumber daya berbasis kuantitatif fisik (`CMI`, `BVC`, `WC`, `RE`), dengan bobot `20 : 45 : 20 : 15`.
   - **CT-SDI-Lite-1.0**: 12 indikator inti dalam 4 dimensi (`Environmental`, `Social`, `Economic`, `Governance`), bobot dimensi masing-masing `25%` (atau `1/12` per indikator jika seluruhnya berlaku).
2. **Prinsip Batas Sistem**: Unit utama adalah **fasilitas atau aktor selama periode produksi tertentu** (musim/bulan), yang dapat ditautkan ke lot (`linked_lot_ids`).
3. **Data Integrity & Immutability**:
   - Seluruh data historis dan identitas record (UUID, relasi lot, verifikasi lama) **wajib dipertahankan**.
   - Versi lama (`2.1-research`) **tidak boleh ditimpa**. Versi Lite dihadirkan sebagai metode baru independen.
   - Perubahan data mentah memicu pembuatan snapshot kalkulasi baru berversi tanpa menghapus snapshot sebelumnya.
   - Status verifikasi **tidak dikalikan** ke skor numerik.

---

## 2. Audit Skema Eksisting vs Kebutuhan Metode Lite

| Entitas Eksisting | Field Eksisting | Kelemahan untuk Versi Lite | Penanganan / Strategi Migrasi |
| :--- | :--- | :--- | :--- |
| `lots` | `id`, `lotNumber`, `lotType`, `weightKg`, `status`, `organizationId` | Menghubungkan skor langsung ke lot tunggal tanpa batas periode fasilitas | Tetap pertahankan identitas `Lot`. Pada CDL, `Assessment` menaungi periode & fasilitas dan menautkan array `linked_lot_ids`. |
| `cci_scores` | `id`, `lotId`, `totalScore`, `farmerSubscore`, `procSubscore`, `tier`, `breakdownJson` | Struktur pilar Petani/Pengolah lama, tidak ada pemisahan CMI, BVC, WC, RE yang terstandardisasi | **JANGAN DIUBAH/DITIMPA.** Tabel `cci_scores` dipertahankan untuk histori versi `2.1-research`. Hasil Lite disimpan dalam `calculation_snapshots`. |
| `csdi_scores` | `id`, `lotId`, `totalScore`, `envSubscore`, `econSubscore`, `socSubscore`, `tier` | Membagi 3 pilar lama (Environmental 40%, Economic 35%, Social 25%), tanpa dimensi Governance (G) | **JANGAN DIUBAH/DITIMPA.** Tetap dipertahankan untuk data historis. Hasil CT-SDI-Lite-1.0 (4 dimensi SAFA E, S, Ec, G) disimpan di CDL snapshot. |
| `processing_batches` | `inputCherryWeight`, `outputGreenBeanWeight`, `waterUsedLiters`, `energyUsedKwh` | Tidak membedakan kadar air/massa kering biomassa; tidak membedakan air baru vs air daur ulang; energi belum ekuivalen kWh | Nilai mentah tetap disimpan. Pada CDL ditambahkan entitas `utilities` dan `byproduct_origin` yang menghitung kg kering (`kg_basah * (1 - kadar_air/100)`). |
| `waste_records` & `waste_valorizations` | `quantityGenerated`, `unit`, `valorizedQuantity`, `destination`, `valorizationMethod` | Menggunakan massa basah campuran; metode valorisasi tidak memiliki faktor nilai terukur (VF 1.0, 0.5, 0.0); belum ada validasi bukti penggunaan aktual | Dipetakan ke `byproduct_origin` dan `byproduct_destination`. Ditambahkan validasi bahwa massa tujuan $\le$ asal, serta syarat `actual_use_date` dan `evidence_id`. |
| `verifications` | `id`, `verificationStage`, `lotId`, `status`, `evidenceUrl` | Status verifikasi memblokir kalkulasi atau dianggap faktor pengali; belum ada pengaman non-kompensasi | Verifikasi dipisahkan menjadi `evidence` dan `safeguards`. Status verifikasi tidak mengalikan skor. Pengaman FAIL memblokir klaim (`BLOCKED`), UNKNOWN menahan publikasi (`DRAFT`). |

---

## 3. Kamus Data Common Data Layer (CDL) Versi Lite

Berdasarkan Bagian 8 Spesifikasi CircularTrace, berikut adalah entitas kanonikal baru:

### 3.1. `assessments` (Batas Penilaian Fasilitas & Periode)
- `assessment_id` (UUID, Primary Key)
- `actor_id` (UUID, Relasi ke `organizations`)
- `period_start` (DATE / TIMESTAMP)
- `period_end` (DATE / TIMESTAMP)
- `system_boundary` (VARCHAR: e.g. `FARMER_GATE`, `PROCESSING_FACILITY`, `WAREHOUSE_EXPORTER`, `ROASTERY`)
- `stage` (VARCHAR: `FARM`, `PROCESSOR`, `WAREHOUSE`, `ROASTER`)
- `process_type` (VARCHAR: `FULL_WASHED`, `NATURAL`, `HONEY`, `WET_HULLED`, `ROASTING`, etc.)
- `linked_lot_ids` (JSON Array dari UUID lot terkait)
- `created_at` (TIMESTAMP)

### 3.2. `material_inputs` (Input Material Sirkular - CMI)
- `flow_id` (UUID, Unique)
- `assessment_id` (UUID, Foreign Key)
- `material_type` (VARCHAR: `PACKAGING_DISPOSABLE`, `PROCESS_INPUT`, `FERTILIZER`, `SOIL_AMENDMENT`)
- `total_kg` (DECIMAL(12, 4), $\ge 0$)
- `circular_kg` (DECIMAL(12, 4), $\le \text{total\_kg}$, hanya recycled/recovered/reused yang terbukti)
- `basis` (VARCHAR: `MEASURED`, `ESTIMATED`, `SECONDARY`)
- `evidence_id` (UUID, Foreign Key ke `evidence`)

### 3.3. `byproduct_origins` (Asal Hasil Samping Biomassa)
- `origin_flow_id` (UUID, Unique)
- `assessment_id` (UUID, Foreign Key)
- `byproduct_type` (VARCHAR: `PULP`, `HUSK`, `PARCHMENT`, `MUCILAGE`, `SILVERSKIN`, `SPENT_GROUNDS`)
- `wet_kg` (DECIMAL(12, 4), $\ge 0$)
- `moisture_pct` (DECIMAL(5, 2), $0 \le \text{pct} < 100$)
- `generated_dry_kg` (DECIMAL(12, 4), dihitung: $\text{wet\_kg} \times (1 - \text{moisture\_pct}/100)$)
- `stock_change_kg` (DECIMAL(12, 4))

### 3.4. `byproduct_destinations` (Tujuan Valorisasi Hasil Samping - BVC)
- `terminal_flow_id` (UUID, Unique)
- `origin_flow_id` (UUID, Foreign Key ke `byproduct_origins`)
- `pathway` (ENUM: `MATERIAL_BIOLOGICAL` [VF=1.00], `ENERGY_RECOVERY` [VF=0.50], `DISPOSAL_OR_UNUSED` [VF=0.00])
- `destination_detail` (VARCHAR: e.g. `CASCARA_EXTRACT_FOOD`, `ORGANIC_COMPOST`, `BRIQUETTE_FUEL`, `LANDFILL`)
- `utilized_dry_kg` (DECIMAL(12, 4), $\ge 0$, $\sum \le \text{generated\_dry\_kg}$)
- `actual_use_date` (DATE / TIMESTAMP, wajib diisi untuk masuk pembilang skor)
- `evidence_id` (UUID, Foreign Key ke `evidence`)

### 3.5. `utilities_observations` (Air & Energi - WC & RE)
- `id` (UUID, Primary Key)
- `assessment_id` (UUID, Foreign Key)
- `water_new_l` (DECIMAL(12, 2), $\ge 0$)
- `water_reused_l` (DECIMAL(12, 2), $\ge 0$)
- `energy_total_kwh_eq` (DECIMAL(12, 2), null jika hilang/tidak tercatat)
- `energy_renewable_recovered_union_kwh_eq` (DECIMAL(12, 2), null jika total energi hilang)
- `evidence_id` (UUID, nullable)

### 3.6. `indicator_observations` (12 Indikator Inti CT-SDI)
- `id` (UUID, Primary Key)
- `assessment_id` (UUID, Foreign Key)
- `indicator_code` (ENUM: `E1`, `E2`, `E3`, `S1`, `S2`, `S3`, `Ec1`, `Ec2`, `Ec3`, `G1`, `G2`, `G3`)
- `numerator` (DECIMAL(14, 4), nullable)
- `denominator` (DECIMAL(14, 4), nullable)
- `raw_value` (DECIMAL(14, 4), nullable)
- `unit` (VARCHAR)
- `benchmark_id` (UUID, nullable, Foreign Key ke `benchmark_registry`)
- `applicability` (ENUM: `APPLICABLE`, `NOT_APPLICABLE`)
- `evidence_ids` (JSON Array dari UUID bukti)
- `source_type` (ENUM: `MEASURED`, `ESTIMATED`, `SECONDARY`)

### 3.7. `benchmark_registry` (Target Efisiensi Terverifikasi)
- `benchmark_id` (UUID, Primary Key)
- `indicator_code` (VARCHAR: `E1`, `E2`, `Ec1`)
- `target_value` (DECIMAL(12, 4), $> 0$)
- `unit` (VARCHAR: `L/kg`, `kWh/kg`, `ratio`)
- `stage` (VARCHAR)
- `process_type` (VARCHAR)
- `region` (VARCHAR)
- `year` (INT)
- `reference_source` (VARCHAR)
- `established_by` (VARCHAR)
- `benchmark_version` (VARCHAR)

### 3.8. `safeguards_observations` (5 Pengaman Non-Kompensasi)
- `id` (UUID, Primary Key)
- `assessment_id` (UUID, Foreign Key)
- `issue_code` (ENUM: `FORCED_LABOR`, `CHILD_LABOR`, `DEFORESTATION`, `BANNED_PESTICIDES`, `SEVERE_POLLUTION`)
- `status` (ENUM: `PASS`, `FAIL`, `UNKNOWN`)
- `verifier_id` (UUID, Foreign Key ke `users`)
- `notes` (TEXT)
- `verified_at` (TIMESTAMP)

### 3.9. `evidence_records` (Bukti Audit & Jejak Fisik)
- `evidence_id` (UUID, Primary Key)
- `uri` (VARCHAR: file path, storage URL, hash IPFS)
- `doc_type` (VARCHAR: `WEIGHING_SLIP`, `METER_LOG`, `INVOICE`, `LAB_REPORT`, `INSPECTION_CERT`)
- `sha256_hash` (VARCHAR(64))
- `verifier_id` (UUID, Foreign Key)
- `verification_status` (ENUM: `PENDING`, `VERIFIED`, `REJECTED`)
- `uploaded_at` (TIMESTAMP)

### 3.10. `calculation_snapshots` (Snapshot Kalkulasi Berversi & Audit Trail)
- `snapshot_id` (UUID, Primary Key)
- `assessment_id` (UUID, Foreign Key)
- `formula_version` (VARCHAR: `CT-CCI-Lite-1.0`, `CT-SDI-Lite-1.0`)
- `inputs_snapshot` (JSONB / JSON Text: rekaman data mentah penuh saat kalkulasi)
- `cci_score` (DECIMAL(5, 2), null jika DRAFT karena data hilang atau NOT_APPLICABLE seluruhnya)
- `cci_breakdown` (JSON: `{ cmi: ..., bvc: ..., wc: ..., re: ..., weights: ... }`)
- `sdi_score` (DECIMAL(5, 2), null jika DRAFT atau belum komplit)
- `sdi_dimensions` (JSON: `{ environmental: ..., social: ..., economic: ..., governance: ... }`)
- `coverage_pct` (DECIMAL(5, 2), persentase indikator berlaku yang terisi data)
- `safeguard_status` (VARCHAR: `PASS`, `FAIL`, `UNKNOWN`)
- `status` (ENUM: `DRAFT`, `READY_FOR_REVIEW`, `VERIFIED`, `PUBLISHED`, `BLOCKED`)
- `calculated_at` (TIMESTAMP)
- `engine_version` (VARCHAR)

---

## 4. Pemetaan Field Legacy ke Canonical CDL

| Field Sumber Legacy | Entitas/Field Canonical CDL | Rationale & Transformasi |
| :--- | :--- | :--- |
| `ProcessingBatch.waterUsedLiters` | `utilities_observations.water_new_l` | Asumsi legacy semua air adalah air baru dari utilitas |
| `ProcessingBatch.energyUsedKwh` | `utilities_observations.energy_total_kwh_eq` | Dipetakan ke total kWh ekuivalen; RE diisi terpisah |
| `ProcessingBatch.inputCherryWeight` | `assessments` & `byproduct_origins` | Dipakai untuk rekonsiliasi neraca massa dan perhitungan intensitas E1 & E2 |
| `WasteRecord.quantityGenerated` | `byproduct_origins.wet_kg` | Ditambahkan konversi kadar air ke `generated_dry_kg` |
| `WasteValorization.valorizedQuantity` | `byproduct_destinations.utilized_dry_kg` | Ditautkan ke `origin_flow_id` dan diverifikasi tidak melebihi asal |
| `WasteValorization.valorizationMethod` | `byproduct_destinations.pathway` | `CASCARA`, `COMPOST`, `FEED`, `BIOCHAR` $\rightarrow$ `MATERIAL_BIOLOGICAL` (VF=1.00); `ENERGY` $\rightarrow$ `ENERGY_RECOVERY` (VF=0.50); `OTHER`/tidak terbukti $\rightarrow$ `DISPOSAL_OR_UNUSED` (VF=0.00) |
| `WarehouseAllocation.specialtyWeightKg` | `indicator_observations(Ec3)` | Pembilang untuk indikator penerimaan mutu produk |
| `SensoryProfile.cuppingScoreTotal` | `indicator_observations(Ec3)` | Bukti spesifikasi mutu produk yang diterima pengiriman pertama |
| `Lot.status` (VERIFIED / PUBLISHED) | `calculation_snapshots.status` | Dipisahkan: status lot tidak lagi otomatis menjadi pengali skor matematis |

---

## 5. Rencana Migrasi Reversibel (Up & Down Migration)

Prinsip migrasi:
1. **Zero Data Loss**: Tidak ada tabel lama yang didrop, tidak ada kolom lama yang dihapus.
2. **Reversibility**: Script `001_rollback_cdl_and_lite_engines.sql` menghapus tabel kanonikal baru dengan bersih tanpa merusak foreign key dari tabel eksisting.
3. **Dual-Read Compatibility**: Sistem dapat membaca data historis lot lama (`CciScore`, `CsdiScore`) sekaligus menghitung penilaian baru menggunakan Common Data Layer.
