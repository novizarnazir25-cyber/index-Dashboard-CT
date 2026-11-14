/**
 * CIRCULARTRACE - Interactive Client Dashboard Application
 */

let currentRole = 'PROCESSOR';
let roleConfigs = null;
let currentAssessmentData = null;
let latestActiveSnapshot = null;
const snapshotHistory = [];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await fetchFormConfigs();
  loadPreset('section7');
});

async function fetchFormConfigs() {
  try {
    const res = await fetch('/api/forms/config');
    const data = await res.json();
    if (data.success) {
      roleConfigs = data.forms;
      renderRoleForm(currentRole);
    }
  } catch (err) {
    console.error('Failed to load form configs', err);
  }
}

function switchRole(role) {
  currentRole = role;
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(getRoleDisplayName(role)));
  });
  document.getElementById('role-badge').textContent = role;
  renderRoleForm(role);
}

function getRoleDisplayName(role) {
  switch (role) {
    case 'FARMER': return 'Petani';
    case 'PROCESSOR': return 'Pengolah';
    case 'WAREHOUSE_EXPORTER': return 'Gudang';
    case 'ROASTERY': return 'Roastery';
    case 'VERIFIER_AUDITOR': return 'Auditor';
    default: return role;
  }
}

function renderRoleForm(role) {
  if (!roleConfigs || !roleConfigs[role]) return;
  const config = roleConfigs[role];
  const container = document.getElementById('dynamic-form-fields');
  container.innerHTML = '';

  config.steps.forEach(step => {
    const stepBox = document.createElement('div');
    stepBox.className = 'form-step-box';
    stepBox.style.marginBottom = '16px';
    stepBox.style.border = '1px solid #dee2e6';
    stepBox.style.borderRadius = '6px';
    stepBox.style.padding = '12px 14px';

    const header = document.createElement('div');
    header.style.fontWeight = '700';
    header.style.fontSize = '13px';
    header.style.color = '#1b4332';
    header.style.marginBottom = '8px';
    header.textContent = `Langkah ${step.stepNumber}: ${step.stepTitle}`;
    stepBox.appendChild(header);

    const desc = document.createElement('div');
    desc.style.fontSize = '11px';
    desc.style.color = '#6c757d';
    desc.style.marginBottom = '12px';
    desc.textContent = step.description;
    stepBox.appendChild(desc);

    step.fields.forEach(f => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = f.label;
      group.appendChild(label);

      let input;
      if (f.type === 'select') {
        input = document.createElement('select');
        input.name = f.name;
        f.options.forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
      } else if (f.type === 'boolean') {
        input = document.createElement('select');
        input.name = f.name;
        const opt1 = document.createElement('option'); opt1.value = 'true'; opt1.textContent = 'Ya (Terpenuhi)';
        const opt2 = document.createElement('option'); opt2.value = 'false'; opt2.textContent = 'Tidak';
        input.appendChild(opt1);
        input.appendChild(opt2);
      } else if (f.type === 'textarea') {
        input = document.createElement('textarea');
        input.name = f.name;
        input.rows = 2;
      } else {
        input = document.createElement('input');
        input.name = f.name;
        input.type = f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text';
        if (f.min !== undefined) input.min = f.min;
        if (f.max !== undefined) input.max = f.max;
        if (f.step !== undefined) input.step = f.step;
      }

      input.id = `field_${f.name}`;
      group.appendChild(input);
      stepBox.appendChild(group);
    });

    container.appendChild(stepBox);
  });
}

// Preset Handlers
function loadPreset(presetKey) {
  switch (presetKey) {
    case 'section7':
      currentAssessmentData = {
        assessment: {
          assessment_id: 'ASM-PILOT-SEC7',
          actor_id: 'ORG-PROCESSOR-SOLOK',
          period_start: '2026-06-01',
          period_end: '2026-06-30',
          system_boundary: 'PROCESSING_FACILITY',
          stage: 'PROCESSOR',
          process_type: 'FULL_WASHED',
          linked_lot_ids: ['LOT-CHERRY-001', 'LOT-GB-001']
        },
        material_input: [
          { flow_id: 'FLOW-MAT-01', material_type: 'SUPPORT_MATERIALS', total_kg: 150, circular_kg: 70, basis: 'MEASURED', evidence_id: 'EVD-01' }
        ],
        byproduct_origin: [
          { origin_flow_id: 'ORIGIN-01', byproduct_type: 'PULP', generated_dry_kg: 4500, wet_kg: 18000, moisture_pct: 75 }
        ],
        byproduct_destination: [
          { terminal_flow_id: 'DEST-01', origin_flow_id: 'ORIGIN-01', pathway: 'MATERIAL_BIOLOGICAL', destination_detail: 'Ekstrak cascara pangan', utilized_dry_kg: 3500, actual_use_date: '2026-06-15', evidence_id: 'EVD-USE-01' },
          { terminal_flow_id: 'DEST-02', origin_flow_id: 'ORIGIN-01', pathway: 'ENERGY_RECOVERY', destination_detail: 'Briket biomassa', utilized_dry_kg: 500, actual_use_date: '2026-06-20', evidence_id: 'EVD-USE-02' },
          { terminal_flow_id: 'DEST-03', origin_flow_id: 'ORIGIN-01', pathway: 'DISPOSAL_OR_UNUSED', destination_detail: 'Landfill / dibuang', utilized_dry_kg: 500, actual_use_date: null }
        ],
        utilities: {
          water_new_l: 8000,
          water_reused_l: 3000,
          energy_total_kwh_eq: 1200,
          energy_renewable_recovered_union_kwh_eq: 300
        },
        indicator_observation: [
          { indicator_code: 'E1', raw_value: 8.0, unit: 'L/kg' },
          { indicator_code: 'E2', raw_value: 1.2, unit: 'kWh/kg' },
          { indicator_code: 'E3', numerator: 3, denominator: 3, unit: 'items' },
          { indicator_code: 'S1', raw_value: 1, unit: 'compliance' },
          { indicator_code: 'S2', numerator: 9, denominator: 10, unit: 'workers' },
          { indicator_code: 'S3', numerator: 2, denominator: 3, unit: 'items' },
          { indicator_code: 'Ec1', revenue: 100000000, cost: 85000000, unit: 'IDR' },
          { indicator_code: 'Ec2', numerator: 8, denominator: 10, unit: 'transactions' },
          { indicator_code: 'Ec3', numerator: 950, denominator: 1000, unit: 'kg' },
          { indicator_code: 'G1', numerator: 9, denominator: 10, unit: 'transfers' },
          { indicator_code: 'G2', numerator: 4, denominator: 4, unit: 'records' },
          { indicator_code: 'G3', numerator: 2, denominator: 3, unit: 'actions' }
        ],
        safeguards: [
          { issue_code: 'FORCED_LABOR', status: 'PASS' },
          { issue_code: 'CHILD_LABOR', status: 'PASS' },
          { issue_code: 'DEFORESTATION', status: 'PASS' },
          { issue_code: 'BANNED_PESTICIDES', status: 'PASS' },
          { issue_code: 'SEVERE_POLLUTION', status: 'PASS' }
        ]
      };
      break;

    case 'energyMissing':
      loadPreset('section7');
      currentAssessmentData.utilities.energy_total_kwh_eq = null; // RE null -> CCI DRAFT
      break;

    case 'noSupport':
      loadPreset('section7');
      currentAssessmentData.material_input = []; // CMI NOT_APPLICABLE
      break;

    case 'destinationExceeds':
      loadPreset('section7');
      currentAssessmentData.byproduct_destination[0].utilized_dry_kg = 4200; // Total 5200 > 4500
      break;

    case 'cascaraNades':
      loadPreset('section7');
      currentAssessmentData.byproduct_origin = [
        { origin_flow_id: 'ORIGIN-CASCARA', byproduct_type: 'CASCARA', generated_dry_kg: 100, wet_kg: 125, moisture_pct: 20 }
      ];
      currentAssessmentData.byproduct_destination = [
        { terminal_flow_id: 'DEST-NADES', origin_flow_id: 'ORIGIN-CASCARA', pathway: 'MATERIAL_BIOLOGICAL', destination_detail: 'Ekstrak pasta gigi cascara (NADES)', utilized_dry_kg: 15, added_solvent_kg: 135, actual_use_date: '2026-06-15', evidence_id: 'EVD-NADES' },
        { terminal_flow_id: 'DEST-COMPOST', origin_flow_id: 'ORIGIN-CASCARA', pathway: 'MATERIAL_BIOLOGICAL', destination_detail: 'Kompos', utilized_dry_kg: 75, actual_use_date: '2026-06-18', evidence_id: 'EVD-COMP' }
      ];
      break;

    case 'safeguardFail':
      loadPreset('section7');
      currentAssessmentData.safeguards[1].status = 'FAIL'; // CHILD_LABOR FAIL -> BLOCKED
      break;

    case 'safeguardUnknown':
      loadPreset('section7');
      currentAssessmentData.safeguards[3].status = 'UNKNOWN'; // BANNED_PESTICIDES UNKNOWN -> DRAFT
      break;
  }

  triggerCalculation();
}

async function triggerCalculation() {
  if (!currentAssessmentData) return;

  try {
    const res = await fetch('/api/calculation/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentData: currentAssessmentData,
        options: { isEvidenceAudited: true, userRole: currentRole }
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert(`⚠️ Validasi Gagal: ${data.error}`);
      renderErrorState(data.error);
      return;
    }

    renderSnapshotResults(data.snapshot);
    addSnapshotHistory(data.snapshot);

  } catch (err) {
    alert(`Terjadi kesalahan komunikasi dengan server: ${err.message}`);
  }
}

function renderSnapshotResults(snap) {
  // 1. Status Banner
  const banner = document.getElementById('status-banner');
  banner.className = `status-banner status-${snap.status}`;
  document.getElementById('status-title').textContent = snap.status;
  document.getElementById('coverage-pct').textContent = `${snap.scores.sdi.coveragePct}%`;

  let subText = '';
  if (snap.status === 'BLOCKED') subText = '🚫 Publikasi diblokir: Terdeteksi pelanggaran pengaman non-kompensasi';
  else if (snap.status === 'DRAFT') subText = '⏳ Status DRAFT: Data belum lengkap atau pengaman belum terverifikasi';
  else if (snap.status === 'VERIFIED') subText = '✅ Terverifikasi: Bukti diaudit dan seluruh pengaman PASS';
  else if (snap.status === 'PUBLISHED') subText = '🌐 Dipublikasikan ke Paspor Digital Produk (DPP)';
  else subText = '📋 Lengkap dan siap diperiksa oleh auditor (READY_FOR_REVIEW)';
  document.getElementById('status-sub').textContent = subText;

  // 2. CCI Score Card (if present)
  const cciScore = snap.scores.cci.displayScore;
  const cciDraft = snap.scores.cci.draftScore;
  const elCciScore = document.getElementById('cci-score');
  if (elCciScore) elCciScore.textContent = cciScore !== null ? `${cciScore}%` : (cciDraft !== null ? `${cciDraft.toFixed(2)}% (Draft)` : '--');
  const elCciTier = document.getElementById('cci-tier');
  if (elCciTier) elCciTier.textContent = snap.scores.cci.category;

  // 3. SDI Score Card (if present)
  const sdiScore = snap.scores.sdi.displayScore;
  const sdiDraft = snap.scores.sdi.draftScore;
  const elSdiScore = document.getElementById('sdi-score');
  if (elSdiScore) elSdiScore.textContent = sdiScore !== null ? `${sdiScore}%` : (sdiDraft !== null ? `${sdiDraft.toFixed(2)}% (Draft)` : '--');
  const elSdiTier = document.getElementById('sdi-tier');
  if (elSdiTier) elSdiTier.textContent = snap.scores.sdi.category;

  // 4. Safeguards Chips
  const sgContainer = document.getElementById('safeguards-container');
  sgContainer.innerHTML = '';
  document.getElementById('safeguard-overall').textContent = snap.safeguards.overallSafeguardStatus;

  for (const [issue, st] of Object.entries(snap.safeguards.issues)) {
    const chip = document.createElement('div');
    chip.className = `safeguard-chip safeguard-${st}`;
    chip.innerHTML = `<span>${formatIssueName(issue)}</span><strong>${st}</strong>`;
    sgContainer.appendChild(chip);
  }
  document.getElementById('safeguard-explanation').textContent = snap.safeguards.explanation;

  // 5. Breakdown Table
  const tbody = document.getElementById('breakdown-body');
  tbody.innerHTML = '';

  // CCI Rows
  const cciComp = snap.scores.cci.componentScores;
  const effW = snap.scores.cci.effectiveWeights;
  const cciBreak = snap.scores.cci.breakdownDetails;

  addBreakdownRow(tbody, 'CCI - CMI (Input Material Sirkular)', cciComp.CMI !== null ? (cciComp.CMI * 100).toFixed(2) + '%' : 'N/A', `${(effW.CMI * 100).toFixed(1)}%`, cciComp.CMI !== null ? (cciComp.CMI * effW.CMI * 100).toFixed(2) + '%' : '--', cciBreak.cmi?.note || 'Bahan pendukung terverifikasi');
  addBreakdownRow(tbody, 'CCI - BVC (Valorisasi Hasil Samping)', cciComp.BVC !== null ? (cciComp.BVC * 100).toFixed(2) + '%' : 'N/A', `${(effW.BVC * 100).toFixed(1)}%`, cciComp.BVC !== null ? (cciComp.BVC * effW.BVC * 100).toFixed(2) + '%' : '--', `Aktual: ${cciBreak.bvc?.actualWeightedNumerator ?? 0} kg / Potensial: ${cciBreak.bvc?.potentialWeightedNumerator ?? 0} kg`);
  addBreakdownRow(tbody, 'CCI - WC (Pemakaian Ulang Air)', cciComp.WC !== null ? (cciComp.WC * 100).toFixed(2) + '%' : 'N/A', `${(effW.WC * 100).toFixed(1)}%`, cciComp.WC !== null ? (cciComp.WC * effW.WC * 100).toFixed(2) + '%' : '--', cciBreak.wc?.note || 'Meter air baru vs daur ulang');
  addBreakdownRow(tbody, 'CCI - RE (Energi Terbarukan / Pulih)', cciComp.RE !== null ? (cciComp.RE * 100).toFixed(2) + '%' : 'N/A (Null)', `${(effW.RE * 100).toFixed(1)}%`, cciComp.RE !== null ? (cciComp.RE * effW.RE * 100).toFixed(2) + '%' : '--', cciBreak.re?.note || 'kWh ekuivalen terbarukan union');

  // SDI Rows
  const dims = snap.scores.sdi.dimensions;
  addBreakdownRow(tbody, 'SDI - Dimensi Environmental (E)', dims.E ? (dims.E.score ?? dims.E.draftScore)?.toFixed(2) + '%' : '--', '25.0%', dims.E ? ((dims.E.score ?? dims.E.draftScore) * 0.25)?.toFixed(2) + '%' : '--', 'Rerata E1, E2, E3');
  addBreakdownRow(tbody, 'SDI - Dimensi Social (S)', dims.S ? (dims.S.score ?? dims.S.draftScore)?.toFixed(2) + '%' : '--', '25.0%', dims.S ? ((dims.S.score ?? dims.S.draftScore) * 0.25)?.toFixed(2) + '%' : '--', 'Rerata S1, S2, S3');
  addBreakdownRow(tbody, 'SDI - Dimensi Economic (Ec)', dims.Ec ? (dims.Ec.score ?? dims.Ec.draftScore)?.toFixed(2) + '%' : '--', '25.0%', dims.Ec ? ((dims.Ec.score ?? dims.Ec.draftScore) * 0.25)?.toFixed(2) + '%' : '--', 'Rerata Ec1, Ec2, Ec3');
  addBreakdownRow(tbody, 'SDI - Dimensi Governance (G)', dims.G ? (dims.G.score ?? dims.G.draftScore)?.toFixed(2) + '%' : '--', '25.0%', dims.G ? ((dims.G.score ?? dims.G.draftScore) * 0.25)?.toFixed(2) + '%' : '--', 'Rerata G1, G2, G3');

  // 6. Synchronize Charts
  latestActiveSnapshot = snap;
  broadcastSnapshotToCharts(snap);
}

function addBreakdownRow(tbody, name, val, weight, contrib, notes) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><strong>${name}</strong></td>
    <td>${val}</td>
    <td>${weight}</td>
    <td><strong>${contrib}</strong></td>
    <td style="color: #6c757d; font-size: 11px;">${notes}</td>
  `;
  tbody.appendChild(tr);
}

function formatIssueName(code) {
  switch (code) {
    case 'FORCED_LABOR': return 'Kerja Paksa';
    case 'CHILD_LABOR': return 'Pekerja Anak';
    case 'DEFORESTATION': return 'Deforestasi';
    case 'BANNED_PESTICIDES': return 'Pestisida Terlarang';
    case 'SEVERE_POLLUTION': return 'Pencemaran Berat';
    default: return code;
  }
}

function renderErrorState(errMsg) {
  const banner = document.getElementById('status-banner');
  banner.className = 'status-banner status-BLOCKED';
  document.getElementById('status-title').textContent = 'VALIDATION_ERROR';
  document.getElementById('coverage-pct').textContent = '0%';
  document.getElementById('status-sub').textContent = errMsg;
}

function addSnapshotHistory(snap) {
  snapshotHistory.unshift(snap);
  document.getElementById('snapshot-count').textContent = `${snapshotHistory.length} Snapshot`;

  const tbody = document.getElementById('history-body');
  tbody.innerHTML = '';

  snapshotHistory.slice(0, 10).forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><code>${s.snapshot_id.slice(0, 8)}...</code></td>
      <td>${s.calculated_at.split('T')[1].slice(0, 8)}</td>
      <td><span class="status-badge" style="font-weight: 700;">${s.status}</span></td>
      <td><strong>${s.scores.cci.displayScore ?? s.scores.cci.draftScore?.toFixed(2) ?? '--'}</strong></td>
      <td><strong>${s.scores.sdi.displayScore ?? s.scores.sdi.draftScore?.toFixed(2) ?? '--'}</strong></td>
      <td>${s.scores.sdi.coveragePct}%</td>
    `;
    tbody.appendChild(tr);
  });
}

function switchMainChart(type) {
  const frame = document.getElementById('chart-frame');
  const btnCircular = document.getElementById('btn-chart-circular');
  const btnBar = document.getElementById('btn-chart-bar');
  const link = document.getElementById('chart-fullscreen-link');
  if (!frame) return;

  frame.onload = () => {
    if (latestActiveSnapshot) broadcastSnapshotToCharts(latestActiveSnapshot);
  };

  if (type === 'circular') {
    frame.src = 'circular_indices_chart.html';
    frame.style.height = '640px';
    if (link) link.href = 'circular_indices_chart.html';
    if (btnCircular) {
      btnCircular.style.background = 'var(--primary)';
      btnCircular.style.color = 'white';
    }
    if (btnBar) {
      btnBar.style.background = 'transparent';
      btnBar.style.color = 'var(--text-main)';
    }
  } else {
    frame.src = 'bar_indices_chart.html';
    frame.style.height = '420px';
    if (link) link.href = 'bar_indices_chart.html';
    if (btnBar) {
      btnBar.style.background = 'var(--primary)';
      btnBar.style.color = 'white';
    }
    if (btnCircular) {
      btnCircular.style.background = 'transparent';
      btnCircular.style.color = 'var(--text-main)';
    }
  }
}

function broadcastSnapshotToCharts(snap) {
  if (!snap) return;
  const frame = document.getElementById('chart-frame');
  if (frame && frame.contentWindow) {
    try {
      frame.contentWindow.postMessage({ type: 'SYNC_SNAPSHOT', snapshot: snap }, '*');
    } catch (e) {}
  }
}

// Receive handshake when chart iframe is loaded
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'IFRAME_READY') {
    if (latestActiveSnapshot) {
      broadcastSnapshotToCharts(latestActiveSnapshot);
    }
  }
});

function switchGuideTab(tabId) {
  document.querySelectorAll('.guide-content-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  document.querySelectorAll('.guide-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  const targetPanel = document.getElementById(tabId);
  if (targetPanel) targetPanel.classList.add('active');

  const matchingBtn = Array.from(document.querySelectorAll('.guide-tab-btn')).find(b => b.getAttribute('onclick')?.includes(tabId));
  if (matchingBtn) matchingBtn.classList.add('active');
}



