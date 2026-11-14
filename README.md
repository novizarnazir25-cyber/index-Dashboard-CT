# CircularTrace Calculation Engine & Common Data Layer (Lite 1.0)

Implementasi spesifikasi teknis dan mesin perhitungan **CT-CCI-Lite-1.0** (Coffee Circularity Index) dan **CT-SDI-Lite-1.0** (Sustainable Development Index) untuk ekosistem **CircularTrace**, merujuk dokumen rancangan Prof. Dr. Novizar Nazir (4 Oktober 2026).

---

## 🚀 Fitur Utama & Arsitektur

1. **Dual Independent Indices (Skala 0–100)**:
   - **CT-CCI-Lite-1.0**: Pengukuran kuantitatif aliran material dan sumber daya fisik berbasis 4 rasio:
     - `CMI` (Circular Material Input) - Bobot 20%
     - `BVC` (Byproduct Valorization Circularity) - Bobot 45% (3 kelas VF: Material/Biologis 1.00, Energi 0.50, Dibuang 0.00)
     - `WC` (Water Circularity / Pemakaian Ulang Air) - Bobot 20%
     - `RE` (Renewable and Recovered Energy) - Bobot 15%
   - **CT-SDI-Lite-1.0**: 12 indikator inti dalam 4 dimensi FAO SAFA (Environmental, Social, Economic, Governance) dengan bobot masing-masing dimensi 25% (1/12 per indikator).

2. **Common Data Layer (CDL)**:
   - Lapisan data bersama berbasis batas fasilitas atau aktor selama periode produksi tertentu (`linked_lot_ids`).
   - 10 entitas kanonikal: `assessments`, `material_inputs`, `byproduct_origins`, `byproduct_destinations`, `utilities_observations`, `indicator_observations`, `benchmark_registry`, `safeguards_observations`, `evidence_records`, dan `calculation_snapshots`.

3. **Integritas Data Historis & Migrasi Reversibel**:
   - Model lama (`CciScore` & `CsdiScore` v2.1-research) tetap dipertahankan tanpa overwrite.
   - Disediakan SQL forward migration (`001_add_cdl_and_lite_engines.sql`) dan rollback migration (`001_rollback_cdl_and_lite_engines.sql`).

4. **Pipeline Kalkulasi 9-Langkah di Server**:
   ```
   Validasi Unit & Periode
     → Cek Applicability
     → Rekonsiliasi Aliran & Neraca Massa
     → Cek Kelengkapan
     → Normalisasi Indikator (Benchmark Registry)
     → Hitung Komponen/Dimensi
     → Cek Pengaman Non-Kompensasi (Safeguards)
     → Tentukan Status
     → Simpan Snapshot Berversi
   ```

5. **5 Pengaman Non-Kompensasi (Safeguards)**:
   - Bebas Kerja Paksa, Bebas Pekerja Anak, Bebas Deforestasi, Bebas Pestisida Terlarang, Bebas Pencemaran Berat.
   - Status per isu: `PASS`, `FAIL`, `UNKNOWN`.
   - **1 FAIL** $\rightarrow$ `BLOCKED` (skor tersimpan untuk evaluasi internal, klaim publik diblokir).
   - **UNKNOWN** $\rightarrow$ `DRAFT` (tidak dapat dipublikasikan).
   - Skor tinggi **tidak dapat** menutup pelanggaran kritis.

6. **Formulir Bertahap Menurut Peran**:
   - Petani (`FARMER`), Pengolah (`PROCESSOR`), Gudang/Eksportir (`WAREHOUSE_EXPORTER`), Roastery (`ROASTERY`), Auditor (`VERIFIER_AUDITOR`).
   - Pengguna **hanya memasukkan data mentah dan bukti**.
   - Input skor manual dinonaktifkan secara ketat untuk menjamin objektivitas audit.

---

## 🧪 Hasil Uji Kriteria Penerimaan Mesin (Acceptance Tests)

Seluruh 7 skenario verifikasi penerimaan mesin lolos pengujian otomatis 100%:

| Kasus | Skenario | Hasil yang Diharapkan | Status Uji |
| :---: | :--- | :--- | :---: |
| **1** | **Data contoh Bagian 7** | CCI 56,04 dan SDI 84,44 setelah pembulatan 2 desimal | ✅ **PASS** |
| **2** | **Total energi hilang** | RE bernilai null dan status CCI DRAFT; tidak dianggap nol | ✅ **PASS** |
| **3** | **Tanpa bahan pendukung sah** | CMI NOT_APPLICABLE; bobot 0,45 0,20 0,15 dibagi total 0,80 | ✅ **PASS** |
| **4** | **Massa tujuan > asal** | Kesalahan validasi (`ValidationError`); jangan menerbitkan skor | ✅ **PASS** |
| **5** | **Cascara dengan NADES** | Penambahan pelarut NADES/air tidak menambah kredit cascara kering ($BVC = 0,90$) | ✅ **PASS** |
| **6** | **Pengaman FAIL / UNKNOWN** | FAIL $\rightarrow$ BLOCKED; UNKNOWN $\rightarrow$ DRAFT meskipun SDI numerik tinggi | ✅ **PASS** |
| **7** | **Duplikasi & Snapshot** | `flow_id` unik; snapshot historis 100% dapat direproduksi | ✅ **PASS** |
| **8** | **Agregasi Rantai Pasok** | CCI menjumlahkan aliran tanpa rata-rata fasilitas; SDI memakai rerata profil tahap | ✅ **PASS** |

---

## 📂 Struktur Direktori

```
Index CCI SDI/
├── package.json                          # Manifest Node.js ES Modules & scripts
├── README.md                             # Dokumentasi arsitektur dan panduan
├── SCHEMA_AUDIT.md                       # Laporan audit skema & pemetaan kanonikal
├── MIGRATION_GUIDE.md                    # Panduan migrasi up & rollback
├── prisma/
│   ├── schema.prisma                     # Skema Prisma gabungan (Legacy + CDL Lite)
│   └── migrations/
│       ├── 001_add_cdl_and_lite_engines.sql      # Forward migration DDL
│       └── 001_rollback_cdl_and_lite_engines.sql # Reversible rollback DDL
├── src/
│   ├── cdl/
│   │   ├── types.js                      # Definisi tipe, enum, dan konstanta
│   │   ├── validator.js                  # Step 1: Validasi batas, unit, dan periode
│   │   └── mass-reconciliation.js        # Step 3: Rekonsiliasi neraca massa & kadar air
│   ├── registry/
│   │   └── benchmark-registry.js         # Registry target efisiensi E1, E2, Ec1
│   ├── engine/
│   │   ├── safeguards-engine.js          # Step 7: Evaluasi 5 pengaman non-kompensasi
│   │   ├── cci-lite-engine.js            # Step 6: Kalkulasi CT-CCI-Lite-1.0
│   │   ├── sdi-lite-engine.js            # Step 6: Kalkulasi CT-SDI-Lite-1.0
│   │   ├── calculation-pipeline.js       # Pipeline eksekusi 9 langkah server-side
│   │   └── chain-aggregation.js          # Agregasi rantai pasok multi-tahap
│   ├── forms/
│   │   └── role-forms-config.js          # Konfigurasi formulir bertahap menurut peran
│   ├── api/
│   │   └── server.js                     # REST API & static server (Port 3000)
│   └── public/
│       ├── index.html                    # Dashboard antarmuka web interaktif
│       ├── css/style.css                 # Desain tema kopi & keberlanjutan
│       └── js/app.js                     # Logika klien & integrasi API
└── test/
    └── engine.test.js                    # Test suite penerimaan mesin (8 unit tests)
```

---

## 🏃 Cara Menjalankan

### 1. Menjalankan Test Suite Otomatis:
```bash
npm test
```

### 2. Menjalankan Server & Dashboard Interaktif:
```bash
npm start
```
Buka browser pada: `http://localhost:3000`

---

## 🌐 Endpoint REST API

- `POST /api/calculation/execute`: Menjalankan pipeline kalkulasi 9 langkah dan menyimpan snapshot berversi.
- `GET /api/forms/config`: Mengambil skema formulir bertahap berdasarkan peran aktor.
- `GET /api/benchmarks`: Mengambil daftar target efisiensi terdaftar (E1, E2, Ec1).
- `GET /api/snapshots/:assessmentId`: Mengambil riwayat snapshot berversi untuk batas fasilitas tertentu.
- `POST /api/calculation/aggregate-chain`: Menghitung agregasi aliran CCI dan rerata profil tahap SDI lintas aktor.
