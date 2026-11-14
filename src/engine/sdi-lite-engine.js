/**
 * CIRCULARTRACE - CT-SDI-Lite-1.0 Calculation Engine
 *
 * 12 Indikator Inti dalam 4 Dimensi:
 * Environmental (E): E1, E2, E3
 * Social (S): S1, S2, S3
 * Economic (Ec): Ec1, Ec2, Ec3
 * Governance (G): G1, G2, G3
 *
 * CT-SDI = (E + S + Ec + G) / 4
 *
 * Rules:
 * 1. Simpan presisi penuh (floating-point double), pembulatan 2 desimal hanya saat display.
 * 2. Tanpa benchmark E1, E2, Ec1 -> indikator tetap null (tidak boleh buat target otomatis).
 * 3. Indikator NOT_APPLICABLE: bobotnya dibagi rata kepada indikator lain dalam dimensinya.
 * 4. Setiap dimensi wajib memiliki minimal 2 indikator yang berlaku (APPLICABLE).
 * 5. Coverage = jumlah indikator berlaku yang terisi data / jumlah indikator berlaku * 100%.
 * 6. Final mensyaratkan coverage 100% dan seluruh dimensi valid. Rerata tersedia hanya untuk DRAFT.
 */

import { ApplicabilityType } from '../cdl/types.js';
import { ValidationError, validateProportion } from '../cdl/validator.js';

export class SdiLiteEngine {
  static calculate(indicatorObservations = [], benchmarks = {}) {
    const observationMap = new Map();
    for (const obs of indicatorObservations) {
      observationMap.set(obs.indicator_code, obs);
    }

    const indicatorCodes = [
      'E1', 'E2', 'E3',
      'S1', 'S2', 'S3',
      'Ec1', 'Ec2', 'Ec3',
      'G1', 'G2', 'G3'
    ];

    const results = {
      E1: { code: 'E1', name: 'Intensitas air baru', dimension: 'E', score: null, applicability: ApplicabilityType.APPLICABLE },
      E2: { code: 'E2', name: 'Intensitas energi', dimension: 'E', score: null, applicability: ApplicabilityType.APPLICABLE },
      E3: { code: 'E3', name: 'Pencegahan pencemaran', dimension: 'E', score: null, applicability: ApplicabilityType.APPLICABLE },
      S1: { code: 'S1', name: 'Perlindungan hak pekerja', dimension: 'S', score: null, applicability: ApplicabilityType.APPLICABLE },
      S2: { code: 'S2', name: 'Pembayaran pekerja', dimension: 'S', score: null, applicability: ApplicabilityType.APPLICABLE },
      S3: { code: 'S3', name: 'Keselamatan kerja', dimension: 'S', score: null, applicability: ApplicabilityType.APPLICABLE },
      Ec1: { code: 'Ec1', name: 'Margin usaha kopi', dimension: 'Ec', score: null, applicability: ApplicabilityType.APPLICABLE },
      Ec2: { code: 'Ec2', name: 'Pembayaran pemasok', dimension: 'Ec', score: null, applicability: ApplicabilityType.APPLICABLE },
      Ec3: { code: 'Ec3', name: 'Penerimaan mutu produk', dimension: 'Ec', score: null, applicability: ApplicabilityType.APPLICABLE },
      G1: { code: 'G1', name: 'Keterlacakan transaksi', dimension: 'G', score: null, applicability: ApplicabilityType.APPLICABLE },
      G2: { code: 'G2', name: 'Pencatatan usaha', dimension: 'G', score: null, applicability: ApplicabilityType.APPLICABLE },
      G3: { code: 'G3', name: 'Tindak lanjut perbaikan', dimension: 'G', score: null, applicability: ApplicabilityType.APPLICABLE }
    };

    // Calculate individual indicator scores
    for (const code of indicatorCodes) {
      const obs = observationMap.get(code);
      if (!obs) {
        // Not provided -> score remains null (missing)
        continue;
      }

      if (obs.applicability === ApplicabilityType.NOT_APPLICABLE) {
        results[code].applicability = ApplicabilityType.NOT_APPLICABLE;
        results[code].score = null;
        results[code].note = obs.notes || 'Dinyatakan NOT_APPLICABLE dengan persetujuan verifier.';
        continue;
      }

      const score = SdiLiteEngine.computeSingleIndicator(code, obs, benchmarks);
      results[code].score = score;
      results[code].details = obs;
    }

    // Dimension Calculation: E, S, Ec, G
    const dimensions = {
      E: { code: 'E', name: 'Environmental', indicators: ['E1', 'E2', 'E3'], score: null, draftScore: null, valid: false },
      S: { code: 'S', name: 'Social', indicators: ['S1', 'S2', 'S3'], score: null, draftScore: null, valid: false },
      Ec: { code: 'Ec', name: 'Economic', indicators: ['Ec1', 'Ec2', 'Ec3'], score: null, draftScore: null, valid: false },
      G: { code: 'G', name: 'Governance', indicators: ['G1', 'G2', 'G3'], score: null, draftScore: null, valid: false }
    };

    let totalApplicableIndicators = 0;
    let applicableWithData = 0;
    let allDimensionsSufficient = true;
    let allApplicableComplete = true;

    for (const [dimKey, dim] of Object.entries(dimensions)) {
      const dimApplicable = dim.indicators.filter(code => results[code].applicability === ApplicabilityType.APPLICABLE);
      const dimWithData = dimApplicable.filter(code => results[code].score !== null);

      totalApplicableIndicators += dimApplicable.length;
      applicableWithData += dimWithData.length;

      // Rule: Seluruh dimensi harus memiliki minimal dua indikator yang berlaku
      if (dimApplicable.length < 2) {
        allDimensionsSufficient = false;
        dim.error = `Dimensi ${dimKey} hanya memiliki ${dimApplicable.length} indikator berlaku. Minimal 2 indikator berlaku diwajibkan.`;
      } else {
        dim.valid = true;
      }

      // Calculate Dimension Score
      if (dimWithData.length > 0) {
        const sum = dimWithData.reduce((acc, code) => acc + results[code].score, 0);
        dim.draftScore = sum / dimWithData.length;
      }

      if (dimWithData.length === dimApplicable.length && dimApplicable.length >= 2) {
        const sum = dimApplicable.reduce((acc, code) => acc + results[code].score, 0);
        dim.score = sum / dimApplicable.length;
      } else {
        allApplicableComplete = false;
      }
    }

    const coveragePct = totalApplicableIndicators > 0 ? (applicableWithData / totalApplicableIndicators) * 100 : 0;

    let sdiScore = null;
    let draftSdiScore = null;

    // Draft composite if all 4 dimensions have draft scores
    const dimDraftScores = Object.values(dimensions).map(d => d.draftScore).filter(s => s !== null);
    if (dimDraftScores.length === 4) {
      draftSdiScore = dimDraftScores.reduce((acc, s) => acc + s, 0) / 4;
    }

    // Final composite only if 100% coverage, all dimensions valid, and all complete
    if (coveragePct === 100 && allDimensionsSufficient && allApplicableComplete) {
      const dimFinalScores = Object.values(dimensions).map(d => d.score);
      sdiScore = dimFinalScores.reduce((acc, s) => acc + s, 0) / 4;
    }

    return {
      formulaVersion: 'CT-SDI-Lite-1.0',
      sdiScore: sdiScore !== null ? Number(sdiScore.toFixed(6)) : null,
      displayScore: sdiScore !== null ? Number(sdiScore.toFixed(2)) : null,
      draftSdiScore: draftSdiScore !== null ? Number(draftSdiScore.toFixed(6)) : null,
      coveragePct: Number(coveragePct.toFixed(2)),
      isComplete: coveragePct === 100 && allDimensionsSufficient,
      dimensions: {
        E: { score: dimensions.E.score, draftScore: dimensions.E.draftScore },
        S: { score: dimensions.S.score, draftScore: dimensions.S.draftScore },
        Ec: { score: dimensions.Ec.score, draftScore: dimensions.Ec.draftScore },
        G: { score: dimensions.G.score, draftScore: dimensions.G.draftScore }
      },
      indicators: results
    };
  }

  static computeSingleIndicator(code, obs, benchmarks) {
    const { numerator, denominator, raw_value } = obs;

    switch (code) {
      // E1: Intensitas air baru (I = liter air baru / kg produk). Skor = 100 * min(1, Tair / I).
      // Jika I = 0 terukur -> skor = 100.
      case 'E1': {
        const target = benchmarks.E1?.target ?? benchmarks.E1 ?? obs.target;
        if (!target || target <= 0) return null; // Tanpa benchmark -> null!

        let intensity = null;
        if (numerator !== undefined && denominator !== undefined && denominator > 0) {
          intensity = Number(numerator) / Number(denominator);
        } else if (raw_value !== undefined && raw_value !== null) {
          intensity = Number(raw_value);
        }

        if (intensity === null) return null;
        if (intensity === 0) return 100;
        return Number((100 * Math.min(1.0, target / intensity)).toFixed(6));
      }

      // E2: Intensitas energi (I = kWh eq / kg produk). Skor = 100 * min(1, Tenergi / I).
      // Jika I = 0 terukur -> skor = 100.
      case 'E2': {
        const target = benchmarks.E2?.target ?? benchmarks.E2 ?? obs.target;
        if (!target || target <= 0) return null; // Tanpa benchmark -> null!

        let intensity = null;
        if (numerator !== undefined && denominator !== undefined && denominator > 0) {
          intensity = Number(numerator) / Number(denominator);
        } else if (raw_value !== undefined && raw_value !== null) {
          intensity = Number(raw_value);
        }

        if (intensity === null) return null;
        if (intensity === 0) return 100;
        return Number((100 * Math.min(1.0, target / intensity)).toFixed(6));
      }

      // E3: Pencegahan pencemaran (100 * butir terpenuhi / butir berlaku [3 butir])
      case 'E3': {
        const num = Number(numerator ?? raw_value ?? 0);
        const den = Number(denominator ?? 3);
        validateProportion(num, den, 'E3 Pencegahan Pencemaran');
        return den > 0 ? Number(((num / den) * 100).toFixed(6)) : 0;
      }

      // S1: Perlindungan hak pekerja
      // 100 jika tidak ada kerja paksa & pekerja anak; 0 bila pelanggaran terbukti; null bila belum diperiksa
      case 'S1': {
        if (raw_value === undefined && numerator === undefined) return null;
        const val = raw_value !== undefined ? raw_value : numerator;
        if (val === null) return null;
        return Number(val) > 0 ? 100 : 0;
      }

      // S2: Pembayaran pekerja (100 * pekerja upah sesuai & tepat waktu / pekerja berbayar diperiksa)
      case 'S2': {
        if (numerator === undefined || denominator === undefined) return null;
        const num = Number(numerator);
        const den = Number(denominator);
        if (den === 0) return null; // If 0 paid workers -> should be flagged NOT_APPLICABLE
        validateProportion(num, den, 'S2 Pembayaran Pekerja');
        return Number(((num / den) * 100).toFixed(6));
      }

      // S3: Keselamatan kerja (100 * butir terpenuhi / 3)
      case 'S3': {
        const num = Number(numerator ?? raw_value ?? 0);
        const den = Number(denominator ?? 3);
        validateProportion(num, den, 'S3 Keselamatan Kerja');
        return den > 0 ? Number(((num / den) * 100).toFixed(6)) : 0;
      }

      // Ec1: Margin usaha kopi (m = (pendapatan - biaya)/pendapatan). Skor = 100 * clamp(m / Tmargin, 0, 1)
      // Pendapatan nol -> skor 0 bila usaha aktif dan biaya tercatat
      case 'Ec1': {
        const target = benchmarks.Ec1?.target ?? benchmarks.Ec1 ?? obs.target;
        if (!target || target <= 0) return null; // Tanpa benchmark -> null!

        let margin = null;
        if (obs.revenue !== undefined && obs.cost !== undefined) {
          const rev = Number(obs.revenue);
          const cost = Number(obs.cost);
          if (rev === 0 && cost > 0) return 0;
          margin = rev > 0 ? (rev - cost) / rev : 0;
        } else if (numerator !== undefined && denominator !== undefined && denominator > 0) {
          // numerator = laba operasi, denominator = pendapatan
          margin = Number(numerator) / Number(denominator);
        } else if (raw_value !== undefined && raw_value !== null) {
          margin = Number(raw_value);
        }

        if (margin === null) return null;
        const clampedRatio = Math.max(0.0, Math.min(1.0, margin / target));
        return Number((100 * clampedRatio).toFixed(6));
      }

      // Ec2: Pembayaran pemasok (100 * transaksi tepat waktu / transaksi jatuh tempo)
      case 'Ec2': {
        if (numerator === undefined || denominator === undefined) return null;
        const num = Number(numerator);
        const den = Number(denominator);
        if (den === 0) return null; // If 0 due transactions -> should be NOT_APPLICABLE
        validateProportion(num, den, 'Ec2 Pembayaran Pemasok');
        return Number(((num / den) * 100).toFixed(6));
      }

      // Ec3: Penerimaan mutu produk (100 * kg diterima spesifikasi pengiriman pertama / kg dikirim)
      case 'Ec3': {
        if (numerator === undefined || denominator === undefined) return null;
        const num = Number(numerator);
        const den = Number(denominator);
        if (den === 0) return null;
        validateProportion(num, den, 'Ec3 Penerimaan Mutu Produk');
        return Number(((num / den) * 100).toFixed(6));
      }

      // G1: Keterlacakan transaksi (100 * transfer data lengkap / seluruh transfer lot batas sistem)
      case 'G1': {
        if (numerator === undefined || denominator === undefined) return null;
        const num = Number(numerator);
        const den = Number(denominator);
        if (den === 0) return null;
        validateProportion(num, den, 'G1 Keterlacakan Transaksi');
        return Number(((num / den) * 100).toFixed(6));
      }

      // G2: Pencatatan usaha (100 * jenis catatan lengkap / 4)
      case 'G2': {
        const num = Number(numerator ?? raw_value ?? 0);
        const den = Number(denominator ?? 4);
        validateProportion(num, den, 'G2 Pencatatan Usaha');
        return den > 0 ? Number(((num / den) * 100).toFixed(6)) : 0;
      }

      // G3: Tindak lanjut perbaikan (100 * aksi jatuh tempo selesai berbukti / seluruh aksi jatuh tempo rencana)
      case 'G3': {
        if (numerator === undefined || denominator === undefined) return null;
        const num = Number(numerator);
        const den = Number(denominator);
        if (den === 0) return null;
        validateProportion(num, den, 'G3 Tindak Lanjut Perbaikan');
        return Number(((num / den) * 100).toFixed(6));
      }

      default:
        return null;
    }
  }
}
