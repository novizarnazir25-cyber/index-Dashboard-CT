/**
 * CIRCULARTRACE - Step 7 & Safeguards Engine
 * Non-Compensable Safeguards (Pengaman yang tidak dapat dikompensasi)
 *
 * 5 Isu Kritis:
 * 1. Kerja paksa (FORCED_LABOR)
 * 2. Pekerja anak yang dilarang (CHILD_LABOR)
 * 3. Deforestasi yang melanggar ketentuan acuan (DEFORESTATION)
 * 4. Penggunaan pestisida terlarang (BANNED_PESTICIDES)
 * 5. Pencemaran berat yang belum ditangani (SEVERE_POLLUTION)
 *
 * Aturan Mutlak:
 * - Status per isu: PASS, FAIL, UNKNOWN.
 * - Satu FAIL -> BLOCKED (skor numerik tersimpan untuk diagnosis internal, publikasi diblokir).
 * - UNKNOWN -> DRAFT (tidak dapat dipublikasikan, meskipun skor numerik tinggi).
 * - Skor tinggi TIDAK DAPAT menutup pelanggaran kritis.
 * - Status pengaman TIDAK mengubah angka skor secara diam-diam.
 */

import { SafeguardStatus, SafeguardIssues, CalculationStatus } from '../cdl/types.js';

export class SafeguardsEngine {
  static evaluate(safeguardsList) {
    const issues = {
      [SafeguardIssues.FORCED_LABOR]: SafeguardStatus.UNKNOWN,
      [SafeguardIssues.CHILD_LABOR]: SafeguardStatus.UNKNOWN,
      [SafeguardIssues.DEFORESTATION]: SafeguardStatus.UNKNOWN,
      [SafeguardIssues.BANNED_PESTICIDES]: SafeguardStatus.UNKNOWN,
      [SafeguardIssues.SEVERE_POLLUTION]: SafeguardStatus.UNKNOWN,
    };

    if (Array.isArray(safeguardsList)) {
      for (const item of safeguardsList) {
        if (item.issue_code && issues.hasOwnProperty(item.issue_code)) {
          issues[item.issue_code] = item.status || SafeguardStatus.UNKNOWN;
        }
      }
    } else if (typeof safeguardsList === 'object' && safeguardsList !== null) {
      for (const key of Object.keys(issues)) {
        if (safeguardsList[key]) {
          issues[key] = safeguardsList[key];
        }
      }
    }

    let overallStatus = SafeguardStatus.PASS;
    const failingIssues = [];
    const unknownIssues = [];

    for (const [issue, status] of Object.entries(issues)) {
      if (status === SafeguardStatus.FAIL) {
        overallStatus = SafeguardStatus.FAIL;
        failingIssues.push(issue);
      } else if (status === SafeguardStatus.UNKNOWN && overallStatus !== SafeguardStatus.FAIL) {
        overallStatus = SafeguardStatus.UNKNOWN;
        unknownIssues.push(issue);
      }
    }

    let impactOnCalculationStatus = null;
    let explanation = '';

    if (overallStatus === SafeguardStatus.FAIL) {
      impactOnCalculationStatus = CalculationStatus.BLOCKED;
      explanation = `Status BLOCKED: Terdeteksi pelanggaran kritis pada pengaman (${failingIssues.join(', ')}). Skor numerik disimpan hanya untuk evaluasi internal; publikasi klaim keberlanjutan diblokir.`;
    } else if (overallStatus === SafeguardStatus.UNKNOWN) {
      impactOnCalculationStatus = CalculationStatus.DRAFT;
      explanation = `Status DRAFT: Terdapat pengaman berstatus UNKNOWN (${unknownIssues.join(', ')}). Seluruh pengaman harus PASS sebelum dapat dipublikasikan.`;
    } else {
      explanation = 'Seluruh pengaman non-kompensasi memenuhi kriteria (PASS).';
    }

    return {
      overallSafeguardStatus: overallStatus,
      impactOnCalculationStatus,
      issues,
      failingIssues,
      unknownIssues,
      explanation
    };
  }
}
