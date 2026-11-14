# Panduan Migrasi Data & Arsitektur CDL CircularTrace

Panduan ini mengatur penerapan skema **Common Data Layer (CDL)** berversi baru untuk mendukung metode `CT-CCI-Lite-1.0` dan `CT-SDI-Lite-1.0` tanpa menghapus atau merusak data historis versi terdahulu.

---

## 1. Prinsip Utama Migrasi

1. **Non-Destructive**: Tabel eksisting (`lots`, `organizations`, `users`, `verifications`, `cci_scores`, `csdi_scores`) tetap utuh. Tidak ada kolom atau data lama yang dihapus.
2. **Reversibility (Dapat Dibatalkan)**: Script rollback `001_rollback_cdl_and_lite_engines.sql` disediakan untuk mengembalikan database ke keadaan sebelum migrasi dalam satu langkah aman.
3. **Versi Berdampingan**:
   - Skor lama tetap berlabel versi `2.1-research`.
   - Skor baru dihasilkan oleh engine `CT-CCI-Lite-1.0` dan `CT-SDI-Lite-1.0` dan dicatat dalam `cdl_calculation_snapshots`.
4. **Isolasi Mutu Data**: Status verifikasi bukti dan pengaman tidak mengalikan nilai skor, tetapi menentukan status publikasi (`DRAFT`, `READY_FOR_REVIEW`, `VERIFIED`, `PUBLISHED`, `BLOCKED`).

---

## 2. Cara Menjalankan Migrasi (UP Migration)

### Melalui SQLite CLI / Database Client:
```bash
sqlite3 dev.db < prisma/migrations/001_add_cdl_and_lite_engines.sql
```

### Melalui Prisma Migrate:
```bash
npx prisma db push
```

---

## 3. Cara Membatalkan Migrasi (DOWN / ROLLBACK Migration)

Jika perlu membatalkan migrasi tanpa mengganggu data legacy:
```bash
sqlite3 dev.db < prisma/migrations/001_rollback_cdl_and_lite_engines.sql
```
Seluruh tabel CDL baru akan dihapus bersih, indeks dihapus, sedangkan data operasional dan historis `Lot`, `User`, `Organization`, `CciScore`, dan `CsdiScore` tetap aman tanpa perubahan.

---

## 4. Verifikasi Pasca Migrasi

Jalankan query verifikasi:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cdl_%';
```
Hasil yang diharapkan:
- `cdl_assessments`
- `cdl_material_inputs`
- `cdl_byproduct_origins`
- `cdl_byproduct_destinations`
- `cdl_utilities_observations`
- `cdl_indicator_observations`
- `cdl_benchmark_registry`
- `cdl_safeguard_observations`
- `cdl_evidence_records`
- `cdl_calculation_snapshots`
