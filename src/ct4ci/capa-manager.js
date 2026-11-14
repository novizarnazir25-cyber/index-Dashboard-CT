/**
 * CIRCULARTRACE - Corrective Action Plan (CAPA) Manager
 * Manages non-conformity findings, remedial actions, cost tracking,
 * and strict verifier closure workflows.
 */

import { CapaStatus, CapaIssueType } from './types.js';

let capaSequenceCounter = 1;

export class CapaManager {
  constructor(capas = []) {
    this.capas = new Map(capas.map(c => [c.id || c.capaCode, c]));
  }

  /**
   * Create or update a CAPA record
   */
  createCapa(data, actor = { userId: 'SYS', role: 'OPERATOR' }) {
    if (!data.findingTitle || !data.checkpointId || !data.scopeId) {
      throw new Error('findingTitle, checkpointId, dan scopeId wajib diisi untuk menerbitkan CAPA.');
    }

    const id = data.id || `CAPA-${Date.now()}-${capaSequenceCounter++}-${Math.random().toString(36).slice(2, 7)}`;
    const capaCode = data.capaCode || `CAPA-2026-${String(this.capas.size + 1).padStart(3, '0')}`;

    // Prevent duplicate open CAPA for the same checkpoint and scope
    for (const existing of this.capas.values()) {
      if (existing.checkpointId === data.checkpointId &&
          existing.scopeId === data.scopeId &&
          existing.status !== CapaStatus.CLOSED) {
        // Return existing open CAPA instead of duplicating
        return { isExisting: true, capa: existing };
      }
    }

    const capa = {
      id,
      capaCode,
      findingTitle: data.findingTitle,
      checkpointId: data.checkpointId,
      checkpointCode: data.checkpointCode || null,
      scopeType: data.scopeType || 'PRODUCER',
      scopeId: data.scopeId,
      issueType: data.issueType || CapaIssueType.MAJOR_NON_COMPLIANT,
      rootCauseAnalysis: data.rootCauseAnalysis || 'Penyimpangan praktik di lapangan terhadap standar 4C v4.1.',
      correctiveActionPlan: data.correctiveActionPlan || 'Penyediaan sarana yang sesuai, pelatihan petani, dan dokumentasi bukti perbaikan.',
      responsiblePerson: data.responsiblePerson || 'Petani & Pendamping ICS',
      deadlineDate: data.deadlineDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedCostIdr: data.estimatedCostIdr || 0,
      actualCostIdr: data.actualCostIdr || 0,
      completionProofRef: data.completionProofRef || null,
      status: CapaStatus.OPEN,
      verifierUserId: null,
      verifierClosureDecision: null,
      closedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.capas.set(id, capa);
    return { isExisting: false, capa };
  }

  /**
   * Submit Evidence of Completion by Operator or Farmer
   * NOTE: This changes status to PENDING_VERIFICATION, does NOT close the CAPA!
   */
  submitCompletionProof(capaId, proofRef, actualCostIdr = null) {
    const capa = this.capas.get(capaId);
    if (!capa) throw new Error(`CAPA dengan ID '${capaId}' tidak ditemukan.`);

    capa.completionProofRef = proofRef;
    if (actualCostIdr !== null) capa.actualCostIdr = actualCostIdr;
    capa.status = CapaStatus.PENDING_VERIFICATION;
    capa.updatedAt = new Date().toISOString();
    return capa;
  }

  /**
   * Verifier Decision: Close or Reject completion proof
   */
  verifyClosure(capaId, decision = { accepted: true, verifierId: 'VERIFIER-01', notes: '' }) {
    const capa = this.capas.get(capaId);
    if (!capa) throw new Error(`CAPA dengan ID '${capaId}' tidak ditemukan.`);

    if (decision.accepted) {
      if (!capa.completionProofRef) {
        throw new Error('CAPA tidak dapat ditutup sebelum bukti perbaikan diunggah dan terlampir.');
      }
      capa.status = CapaStatus.CLOSED;
      capa.verifierUserId = decision.verifierId;
      capa.verifierClosureDecision = decision.notes || 'Bukti perbaikan fisik/dokumen telah diverifikasi dan diterima sesuai standar 4C.';
      capa.closedAt = new Date().toISOString();
    } else {
      capa.status = CapaStatus.REJECTED;
      capa.verifierUserId = decision.verifierId;
      capa.verifierClosureDecision = decision.notes || 'Bukti perbaikan belum mencukupi. Tindakan perbaikan harus diulang.';
    }
    capa.updatedAt = new Date().toISOString();
    return capa;
  }

  getAll() {
    return Array.from(this.capas.values());
  }

  getOpen() {
    return this.getAll().filter(c => c.status !== CapaStatus.CLOSED);
  }

  getForScope(scopeId) {
    return this.getAll().filter(c => c.scopeId === scopeId);
  }
}
