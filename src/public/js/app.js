/**
 * CIRCULARTRACE - Interactive Dashboard Controller
 * Powers 11 integrated menus, real-time calculations from backend database,
 * drill-down modals, and test presets (including screenshot reproduction).
 */

const API_BASE = '';
let currentRole = 'VERIFIER';
let currentActorId = 'USR-VER-01';
let currentFarmerId = 'FARMER-SLK-001';
let currentPeriod = '2026-PANEN-RAYA';
let cachedCheckpoints = [];
let cachedAssessments = [];
let cachedFarmers = [];
let cachedPlots = [];
let cachedPractices = [];
let cachedEvidences = [];
let cachedCapas = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadFilterOptions();
  await loadDashboardOverview();
  await loadCheckpoints();
  await loadPracticesConfig();
});

// ----------------------------------------------------------------------------
// Navigation Tabs Controller
// ----------------------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

  const targetPanel = document.getElementById(`tab-${tabId}`);
  if (targetPanel) targetPanel.classList.add('active');

  const navButtons = document.querySelectorAll('.nav-tab');
  navButtons.forEach(btn => {
    if (btn.getAttribute('onclick')?.includes(`'${tabId}'`)) {
      btn.classList.add('active');
    }
  });

  // Lazy load data for specific tabs
  if (tabId === 'dashboard-indices') loadDashboardOverview();
  else if (tabId === 'stakeholders-matrix') loadStakeholdersMatrix();
  else if (tabId === 'kelompok-tani') loadGroupsList();
  else if (tabId === 'petani') loadFarmersList();
  else if (tabId === 'farm-plot') loadPlotsTable();
  else if (tabId === 'praktik-budidaya') loadPracticesList();
  else if (tabId === 'kunjungan-ics') loadInspectionsList();
  else if (tabId === 'bukti-verifikasi') loadEvidenceTable();
  else if (tabId === 'penilaian-ct4ci') renderCheckpointsTable();
  else if (tabId === 'temuan-capa') loadCapaTable();
  else if (tabId === 'laporan') loadAuditTrail();
}

function switchActorRole(role) {
  currentRole = role;
  if (role === 'FARMER') currentActorId = 'USR-FAR-01';
  else if (role === 'FARMER_GROUP') currentActorId = 'USR-GROUP-01';
  else if (role === 'PROCESSOR') currentActorId = 'USR-PROC-01';
  else if (role === 'WAREHOUSE') currentActorId = 'USR-WH-01';
  else if (role === 'ROASTERY') currentActorId = 'USR-ROAST-01';
  else if (role === 'COFFEE_SHOP') currentActorId = 'USR-CAFE-01';
  else if (role === 'BUYER') currentActorId = 'USR-BUYER-01';
  else if (role === 'ICS_VERIFIER_FARMER') currentActorId = 'USR-ICS-FAR';
  else if (role === 'ICS_VERIFIER_PROCESSOR') currentActorId = 'USR-ICS-PROC';
  else if (role === 'VERIFIER_WAREHOUSE') currentActorId = 'USR-VER-WH';
  else if (role === 'VERIFIER_ROASTERY') currentActorId = 'USR-VER-ROAST';
  else if (role === 'ICS_OPERATOR') currentActorId = 'USR-OP-01';
  else if (role === 'MANAGER') currentActorId = 'USR-MGR-01';
  else if (role === 'METHODOLOGY_ADMIN') currentActorId = 'USR-ADMIN-01';
  else currentActorId = 'USR-VER-01';

  const sel = document.getElementById('user-role-select');
  if (sel && sel.value !== role) sel.value = role;

  console.log(`Switched role to: ${currentRole} (${currentActorId})`);
  loadDashboardOverview();

  // If currently on stakeholders tab, re-render to highlight active role
  const stPanel = document.getElementById('tab-stakeholders-matrix');
  if (stPanel && stPanel.classList.contains('active')) {
    loadStakeholdersMatrix();
  }
}

// ----------------------------------------------------------------------------
// Load Filters & Dropdowns
// ----------------------------------------------------------------------------
async function loadFilterOptions() {
  try {
    const res = await fetch(`${API_BASE}/api/farmers`);
    const json = await res.json();
    if (json.success) {
      cachedFarmers = json.farmers;
      const farmerSelect = document.getElementById('filter-farmer');
      farmerSelect.innerHTML = '';
      cachedFarmers.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = `${f.farmerCode} - ${f.fullName}`;
        if (f.id === currentFarmerId) opt.selected = true;
        farmerSelect.appendChild(opt);
      });
    }
  } catch (err) {
    console.error('Error loading farmers filter:', err);
  }
}

function onFarmerFilterChanged() {
  currentFarmerId = document.getElementById('filter-farmer').value;
  loadDashboardOverview();
}

function onGroupFilterChanged() {
  loadDashboardOverview();
}

function onPeriodFilterChanged() {
  currentPeriod = document.getElementById('filter-period').value;
  loadDashboardOverview();
}

// ----------------------------------------------------------------------------
// Circumferences for Concentric Circular Rings
// ----------------------------------------------------------------------------
const CIRCUMFERENCES = {
  ct4ci: 2 * Math.PI * 84, // 527.79
  sdi: 2 * Math.PI * 66,   // 414.69
  cci: 2 * Math.PI * 48    // 301.59
};

function switchDashboardView(mode) {
  const multi = document.getElementById('dashboard-multi-dial');
  const concentric = document.getElementById('dashboard-concentric-dial');
  const btnMulti = document.getElementById('btn-dash-multi');
  const btnConc = document.getElementById('btn-dash-concentric');

  if (mode === 'concentric') {
    if (multi) multi.style.display = 'none';
    if (concentric) concentric.style.display = 'block';
    if (btnMulti) {
      btnMulti.style.background = 'transparent';
      btnMulti.style.color = 'var(--text-muted)';
      btnMulti.style.fontWeight = '600';
      btnMulti.style.boxShadow = 'none';
    }
    if (btnConc) {
      btnConc.style.background = 'white';
      btnConc.style.color = 'var(--text-main)';
      btnConc.style.fontWeight = '700';
      btnConc.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    }
  } else {
    if (concentric) concentric.style.display = 'none';
    if (multi) multi.style.display = 'grid';
    if (btnConc) {
      btnConc.style.background = 'transparent';
      btnConc.style.color = 'var(--text-muted)';
      btnConc.style.fontWeight = '600';
      btnConc.style.boxShadow = 'none';
    }
    if (btnMulti) {
      btnMulti.style.background = 'white';
      btnMulti.style.color = 'var(--text-main)';
      btnMulti.style.fontWeight = '700';
      btnMulti.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
    }
  }
}

// ----------------------------------------------------------------------------
// TAB 1: Dashboard Overview (CT-4CI, CT-CI, CT-SDI, IDSM)
// ----------------------------------------------------------------------------
async function loadDashboardOverview() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard/overview?farmerId=${currentFarmerId}&period=${currentPeriod}`, {
      headers: { 'X-Actor-Role': currentRole, 'X-Actor-Id': currentActorId }
    });
    const data = await res.json();
    if (!data.success) return;

    const { indices, groupOverview } = data;
    const ct4ci = indices.ct4ci;

    // Render CT-4CI Score
    if (ct4ci) {
      const score = ct4ci.score !== null ? Number(ct4ci.score) : 0;
      const cov = ct4ci.coverage !== null ? Number(ct4ci.coverage) : 0;
      const isPassed = ct4ci.majorGateStatus === 'PASSED';

      const scoreEl = document.getElementById('score-ct4ci');
      if (scoreEl) scoreEl.textContent = `${score.toFixed(1)}%`;

      const covEl = document.getElementById('score-coverage');
      if (covEl) covEl.textContent = `${cov.toFixed(1)}%`;

      const badgeStatus = document.getElementById('badge-status-ct4ci');
      if (badgeStatus) {
        badgeStatus.textContent = ct4ci.calculationStatus;
        badgeStatus.className = `badge ${ct4ci.calculationStatus === 'CALCULATED' ? 'badge-pass' : 'badge-pending'}`;
      }

      const sumCounts = document.getElementById('metric-summary-counts');
      if (sumCounts) {
        sumCounts.textContent = `${ct4ci.compliantCount} Sesuai / ${ct4ci.applicableCount} Berlaku (Total ${ct4ci.totalInventory} Checkpoint)`;
      }

      // Update SVG Circular Progress Ring (Dial 1)
      const ct4ciCircle = document.getElementById('dash-ct4ci-circle');
      if (ct4ciCircle) {
        ct4ciCircle.setAttribute('stroke-dasharray', `${Math.min(Math.max(score, 0), 100).toFixed(1)}, 100`);
      }

      const gateLabel = document.getElementById('dash-ct4ci-gate');
      if (gateLabel) {
        gateLabel.textContent = isPassed ? 'GATE: PASSED' : 'GATE: UNRESOLVED';
        gateLabel.style.fill = isPassed ? '#059669' : '#dc2626';
      }

      // Update Concentric Ring (Outer Ring)
      const ringCt4ci = document.getElementById('dash-conc-ring-ct4ci');
      if (ringCt4ci) {
        const offset = CIRCUMFERENCES.ct4ci * (1 - Math.min(Math.max(score, 0), 100) / 100);
        ringCt4ci.style.strokeDashoffset = offset;
      }
      const concScoreCt4ci = document.getElementById('dash-conc-score-ct4ci');
      if (concScoreCt4ci) concScoreCt4ci.textContent = `${score.toFixed(1)}%`;
      const concGateCt4ci = document.getElementById('dash-conc-gate-ct4ci');
      if (concGateCt4ci) {
        concGateCt4ci.textContent = isPassed ? 'GATE PASSED' : 'GATE UNRESOLVED';
        concGateCt4ci.style.color = isPassed ? '#059669' : '#dc2626';
      }

      // Major Gate Banner
      const gateBanner = document.getElementById('major-gate-banner');
      const gateText = document.getElementById('major-gate-text');
      const gateSub = document.getElementById('major-gate-sub');

      if (isPassed) {
        gateBanner.className = 'gate-banner PASSED';
        gateText.textContent = 'MEMENUHI SYARAT (MAJOR GATE PASSED)';
        gateSub.textContent = 'Seluruh kriteria Major yang berlaku terbukti sesuai dengan bukti memadai.';
      } else {
        gateBanner.className = 'gate-banner UNRESOLVED';
        gateText.textContent = 'BELUM MEMENUHI SYARAT (MAJOR GATE UNRESOLVED)';
        gateSub.textContent =
          `${ct4ci.majorStats.nonCompliant} Major Terbukti Gagal | ${ct4ci.majorStats.insufficientEvidence} Major Kurang Bukti | ${ct4ci.majorStats.undecidedApplicability} Major Belum Diputuskan`;
      }

      // Dimensions
      const dims = ct4ci.dimensionBreakdown || {};
      if (dims.ECONOMIC && document.getElementById('dim-score-econ')) {
        document.getElementById('dim-score-econ').textContent = `${dims.ECONOMIC.readinessScore || 0}%`;
      }
      if (dims.SOCIAL && document.getElementById('dim-score-soc')) {
        document.getElementById('dim-score-soc').textContent = `${dims.SOCIAL.readinessScore || 0}%`;
      }
      if (dims.ENVIRONMENTAL && document.getElementById('dim-score-env')) {
        document.getElementById('dim-score-env').textContent = `${dims.ENVIRONMENTAL.readinessScore || 0}%`;
      }
    }

    // CT-CCI Updates
    if (indices.ctCci) {
      const cciScore = Number(indices.ctCci.score) || 0;
      const cciEl = document.getElementById('score-ct-cci');
      if (cciEl) cciEl.textContent = cciScore.toFixed(2);

      // SVG Circular Progress Ring (Dial 2)
      const cciCircle = document.getElementById('dash-cci-circle');
      if (cciCircle) {
        cciCircle.setAttribute('stroke-dasharray', `${Math.min(Math.max(cciScore, 0), 100).toFixed(2)}, 100`);
      }

      // Concentric Ring (Inner Ring)
      const ringCci = document.getElementById('dash-conc-ring-cci');
      if (ringCci) {
        const offset = CIRCUMFERENCES.cci * (1 - Math.min(Math.max(cciScore, 0), 100) / 100);
        ringCci.style.strokeDashoffset = offset;
      }
      const concScoreCci = document.getElementById('dash-conc-score-cci');
      if (concScoreCci) concScoreCci.textContent = cciScore.toFixed(2);

      // Breakdown Ratios
      const bd = indices.ctCci.breakdown || {};
      if (document.getElementById('dash-val-cmi')) document.getElementById('dash-val-cmi').textContent = `${(bd.cmi || 46.67).toFixed(2)}%`;
      if (document.getElementById('dash-val-bvc')) document.getElementById('dash-val-bvc').textContent = `${(bd.bvc || 90.00).toFixed(2)}%`;
      if (document.getElementById('dash-val-wc')) document.getElementById('dash-val-wc').textContent = `${(bd.wc || 27.27).toFixed(2)}%`;
      if (document.getElementById('dash-val-re')) document.getElementById('dash-val-re').textContent = `${(bd.re || 25.00).toFixed(2)}%`;
    }

    // CT-SDI Updates
    if (indices.ctSdi) {
      const sdiScore = Number(indices.ctSdi.score) || 0;
      const sdiEl = document.getElementById('score-ct-sdi');
      if (sdiEl) sdiEl.textContent = sdiScore.toFixed(2);

      // SVG Circular Progress Ring (Dial 3)
      const sdiCircle = document.getElementById('dash-sdi-circle');
      if (sdiCircle) {
        sdiCircle.setAttribute('stroke-dasharray', `${Math.min(Math.max(sdiScore, 0), 100).toFixed(2)}, 100`);
      }

      // Concentric Ring (Middle Ring)
      const ringSdi = document.getElementById('dash-conc-ring-sdi');
      if (ringSdi) {
        const offset = CIRCUMFERENCES.sdi * (1 - Math.min(Math.max(sdiScore, 0), 100) / 100);
        ringSdi.style.strokeDashoffset = offset;
      }
      const concScoreSdi = document.getElementById('dash-conc-score-sdi');
      if (concScoreSdi) concScoreSdi.textContent = sdiScore.toFixed(2);

      // SAFA Dimensions
      const dims = indices.ctSdi.dimensions || {};
      if (document.getElementById('dash-sdi-dim-e')) document.getElementById('dash-sdi-dim-e').textContent = (dims.E || 83.33).toFixed(2);
      if (document.getElementById('dash-sdi-dim-s')) document.getElementById('dash-sdi-dim-s').textContent = (dims.S || 85.56).toFixed(2);
      if (document.getElementById('dash-sdi-dim-ec')) document.getElementById('dash-sdi-dim-ec').textContent = (dims.Ec || 78.33).toFixed(2);
      if (document.getElementById('dash-sdi-dim-g')) document.getElementById('dash-sdi-dim-g').textContent = (dims.G || 90.56).toFixed(2);
    }

    // CT-IDSM Rules
    renderIdsmRules(currentFarmerId, period);

    // Group Overview Metrics
    if (groupOverview) {
      const gBox = document.getElementById('group-metrics-summary');
      gBox.innerHTML = `
        <div class="metric-box">
          <div class="metric-val">${groupOverview.totalFarmers}</div>
          <div class="metric-lbl">Total Petani Terdaftar</div>
          <div class="metric-sub">Koperasi Solok & Kintamani</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">${groupOverview.totalPlots}</div>
          <div class="metric-lbl">Total Petak Kebun</div>
          <div class="metric-sub">Terpetakan Koordinat</div>
        </div>
        <div class="metric-box">
          <div class="metric-val">${groupOverview.totalAreaHa} Ha</div>
          <div class="metric-lbl">Luas Lahan Terdata</div>
          <div class="metric-sub">Survei GPS Lapangan</div>
        </div>
        <div class="metric-box">
          <div class="metric-val ${groupOverview.openCapasCount > 0 ? 'alert' : 'success'}">${groupOverview.openCapasCount}</div>
          <div class="metric-lbl">Temuan CAPA Terbuka</div>
          <div class="metric-sub">Perlu Tindakan Perbaikan</div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Error loading dashboard overview:', err);
  }
}

// ----------------------------------------------------------------------------
// CT-IDSM Rules Renderer
// ----------------------------------------------------------------------------
async function renderIdsmRules(farmerId, period) {
  try {
    const res = await fetch(`${API_BASE}/api/calculation/ct4ci`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerId, period, isSimulation: true })
    });
    const json = await res.json();
    if (!json.success || !json.snapshot.idsmRules) return;

    const container = document.getElementById('idsm-rules-container');
    container.innerHTML = '';

    json.snapshot.idsmRules.forEach(rule => {
      const isTriggered = rule.status === 'TRIGGERED';
      const isNotApplicable = rule.status === 'NOT_APPLICABLE';
      const box = document.createElement('div');
      box.style.border = `1px solid ${isTriggered ? '#fca5a5' : '#e2e8f0'}`;
      box.style.background = isTriggered ? '#fff1f2' : (isNotApplicable ? '#f8fafc' : '#f0fdf4');
      box.style.borderRadius = '8px';
      box.style.padding = '12px 14px';

      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 13px; color: #1e293b;">${rule.ruleId}: ${rule.ruleName}</strong>
          <span class="badge ${isTriggered ? 'badge-fail' : (isNotApplicable ? 'badge-minor' : 'badge-pass')}">${rule.status}</span>
        </div>
        <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">${rule.reason}</div>
        <div style="font-size: 11px; font-weight: 600; color: ${isTriggered ? '#991b1b' : '#166534'};">
          💡 Rekomendasi: ${rule.recommendations}
        </div>
      `;
      container.appendChild(box);
    });
  } catch (err) {
    console.error('Error rendering IDSM rules:', err);
  }
}

// ----------------------------------------------------------------------------
// Presets Controller (Screenshot reproduction, 100%, etc.)
// ----------------------------------------------------------------------------
async function loadSimulationPreset(presetType) {
  try {
    const res = await fetch(`${API_BASE}/api/simulation/load-preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset: presetType, farmerId: currentFarmerId, period: currentPeriod })
    });
    const json = await res.json();
    if (json.success) {
      await loadDashboardOverview();
      await loadCheckpoints();
      switchTab('dashboard-indices');
      alert(`Skenario '${presetType}' berhasil dimuat dari database!\nSkor CT-4CI: ${json.snapshot.ct4ciScore}%, EC: ${json.snapshot.evidenceCoveragePct}%`);
    }
  } catch (err) {
    alert('Gagal memuat preset: ' + err.message);
  }
}

// ----------------------------------------------------------------------------
// TAB 2: Kelompok Tani List
// ----------------------------------------------------------------------------
async function loadGroupsList() {
  const container = document.getElementById('groups-list-container');
  try {
    const res = await fetch(`${API_BASE}/api/groups`);
    const json = await res.json();
    if (!json.success) return;

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode Organisasi</th>
            <th>Nama Kelompok Tani</th>
            <th>Wilayah Administratif</th>
            <th>Penanggung Jawab (PIC)</th>
            <th>Jasa Titik Kumpul</th>
            <th>Pagu Anggaran CAPA</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    json.groups.forEach(g => {
      html += `
        <tr>
          <td><strong>${g.businessId}</strong></td>
          <td>${g.name}</td>
          <td>${g.village}, ${g.subDistrict}, ${g.district}, ${g.province}</td>
          <td>${g.pic} (${g.phone || '-'})</td>
          <td><span class="badge badge-pass">Rp ${g.serviceChargePerKgIdr || 500} / kg</span></td>
          <td>Rp ${(g.budgetAllocatedIdr || 0).toLocaleString('id-ID')}</td>
          <td><span class="badge badge-pass">AKTIF</span></td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

// ----------------------------------------------------------------------------
// TAB 3: Farmers List & Registration
// ----------------------------------------------------------------------------
async function loadFarmersList() {
  const container = document.getElementById('farmers-list-container');
  try {
    const res = await fetch(`${API_BASE}/api/farmers`);
    const json = await res.json();
    if (!json.success) return;

    cachedFarmers = json.farmers;
    document.getElementById('farmer-count-badge').textContent = `${cachedFarmers.length} Petani`;

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Petani</th>
            <th>Desa / Nagari</th>
            <th>Peran</th>
            <th>Jumlah Plot</th>
            <th>Luas (Ha)</th>
            <th>CT-4CI</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    cachedFarmers.forEach(f => {
      const snap = f.latestSnapshot;
      html += `
        <tr>
          <td><strong>${f.farmerCode}</strong></td>
          <td>${f.fullName}</td>
          <td>${f.village}, ${f.district}</td>
          <td><span class="badge badge-minor">${f.farmRole}</span></td>
          <td>${f.plotCount} Petak</td>
          <td>${f.totalAreaHa} Ha</td>
          <td>
            ${snap && snap.ct4ciScore !== null ? `<strong>${snap.ct4ciScore}%</strong>` : '<span style="color:#94a3b8;">Belum dihitung</span>'}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="selectFarmerForDetail('${f.id}')">Pilih</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

function selectFarmerForDetail(farmerId) {
  currentFarmerId = farmerId;
  const sel = document.getElementById('filter-farmer');
  if (sel) sel.value = farmerId;
  loadDashboardOverview();
  switchTab('dashboard-indices');
}

async function submitFarmerRegistration() {
  const payload = {
    groupId: document.getElementById('reg-farmer-group').value,
    farmerCode: document.getElementById('reg-farmer-code').value.trim(),
    fullName: document.getElementById('reg-farmer-name').value.trim(),
    province: document.getElementById('reg-farmer-prov').value.trim(),
    district: document.getElementById('reg-farmer-dist').value.trim(),
    subDistrict: document.getElementById('reg-farmer-subdist').value.trim(),
    village: document.getElementById('reg-farmer-village').value.trim(),
    farmRole: document.getElementById('reg-farmer-role').value,
    smartphoneAccess: document.getElementById('reg-farmer-phone-access').value,
    preferredConfirmationMethod: document.getElementById('reg-farmer-confirm-method').value,
    dataConsentGiven: document.getElementById('reg-farmer-consent').checked,
    dataConsentMethod: 'DIGITAL_APP'
  };

  try {
    const res = await fetch(`${API_BASE}/api/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Role': currentRole, 'X-Actor-Id': currentActorId },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      alert(`Petani '${json.farmer.fullName}' (${json.farmer.farmerCode}) berhasil didaftarkan!`);
      document.getElementById('farmer-reg-form').reset();
      await loadFilterOptions();
      await loadFarmersList();
    } else {
      alert(`Gagal: ${json.error}`);
    }
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

// ----------------------------------------------------------------------------
// TAB 4: Farm & Plots Table
// ----------------------------------------------------------------------------
async function loadPlotsTable() {
  const container = document.getElementById('plots-table-container');
  try {
    const res = await fetch(`${API_BASE}/api/plots`);
    const json = await res.json();
    if (!json.success) return;

    cachedPlots = json.plots;
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode Petak</th>
            <th>Pemilik Petani</th>
            <th>Koordinat GPS</th>
            <th>Polygon</th>
            <th>Luas (Ha)</th>
            <th>Spesies & Varietas</th>
            <th>Penaung</th>
            <th>Status Duplikasi</th>
          </tr>
        </thead>
        <tbody>
    `;

    cachedPlots.forEach(p => {
      const farmer = cachedFarmers.find(f => f.id === p.farmerId);
      const hasCoords = p.latitude && p.longitude;
      const hasPoly = Boolean(p.polygonGeoJson);

      html += `
        <tr>
          <td><strong>${p.plotCode}</strong></td>
          <td>${farmer ? farmer.fullName : p.farmerId}</td>
          <td>${hasCoords ? `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}` : '<span style="color:red;">Kosong</span>'}</td>
          <td>${hasPoly ? '<span class="badge badge-pass">GeoJSON Ada</span>' : '<span class="badge badge-minor">Titik Tunggal</span>'}</td>
          <td>${p.areaHa} ${p.areaUnit}</td>
          <td>${p.coffeeSpecies} (${p.varieties || '-'})</td>
          <td><span style="font-size:11px;">${p.shadeTreesDescription || '-'}</span></td>
          <td>
            ${p.isDuplicateFlagged ?
              `<span class="badge badge-fail" title="${p.duplicateNotes || 'Duplikasi'}">⚠️ Duplikat</span>` :
              `<span class="badge badge-pass">Valid</span>`}
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

// ----------------------------------------------------------------------------
// TAB 5: Cultivation Practices Wizard (Topics A-E)
// ----------------------------------------------------------------------------
let cachedPracticesConfig = [];
let cachedBannedChemicals = [];
let cachedPresets = {};
let currentPracticesAnswers = {};
let activePracticeTopicIndex = 0; // 0=A, 1=B, 2=C, 3=D, 4=E, 5=ALL

async function loadPracticesConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/practices/config`);
    const json = await res.json();
    if (json.success) {
      cachedPracticesConfig = json.config || [];
      cachedBannedChemicals = json.bannedChemicals || [];
    }
    const presetRes = await fetch(`${API_BASE}/api/practices/presets`);
    const presetJson = await presetRes.json();
    if (presetJson.success) {
      cachedPresets = presetJson.presets || {};
    }
  } catch (err) {
    console.error('Error loading practices config/presets:', err);
  }
}

async function loadPracticesList() {
  const container = document.getElementById('practices-wizard-container');
  if (!container) return;

  if (cachedPracticesConfig.length === 0 || Object.keys(cachedPresets).length === 0) {
    await loadPracticesConfig();
  }

  // Fetch farmer practices records from DB
  try {
    const res = await fetch(`${API_BASE}/api/practices?farmerId=${currentFarmerId}`);
    const json = await res.json();
    if (json.success) {
      cachedPractices = json.practices || [];
    }
  } catch (err) {
    console.error('Error fetching practices records:', err);
  }

  // Initialize answers if empty with compliant preset by default
  if (Object.keys(currentPracticesAnswers).length === 0 && cachedPresets.READY_4C_COMPLIANT) {
    currentPracticesAnswers = JSON.parse(JSON.stringify(cachedPresets.READY_4C_COMPLIANT));
  }

  const activeFarmer = cachedFarmers.find(f => f.id === currentFarmerId) || { name: 'Dt. Rajo Nan Sati', village: 'Aie Dingin', id: 'FARMER-SLK-001' };

  let html = `
    <!-- 1. Questionnaire Header & Status Card -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
        <div>
          <h3 style="margin: 0 0 4px 0; font-size: 16px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
            <span>🌱</span> Formulir Isian Pendataan Petani & Evaluasi Kesiapan Sertifikasi 4C (CT-4CI)
          </h3>
          <div style="font-size: 12px; color: var(--text-muted);">
            Petani Aktif: <strong>${activeFarmer.name} (${activeFarmer.id})</strong> • Desa: ${activeFarmer.village} • Musim: <strong>${currentPeriod}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          <button class="btn btn-sm btn-primary" onclick="applyPracticesPreset('READY_4C_COMPLIANT')" style="background: #059669; border-color: #059669;" title="Muat jawaban standar 4C lengkap">
            🌟 1. Muat Isian Siap 4C (95.9% / Major PASSED)
          </button>
          <button class="btn btn-sm btn-danger" onclick="applyPracticesPreset('MAJOR_FAIL_VIOLATION')" style="background: #dc2626; border-color: #dc2626; color: white;" title="Muat skenario pelanggaran Paraquat & Deforestasi">
            🚨 2. Muat Isian Pelanggaran Major
          </button>
          <button class="btn btn-sm btn-secondary" onclick="resetPracticesForm()">
            🔄 Reset Formulir
          </button>
        </div>
      </div>
      <div style="font-size: 11px; color: #475569; background: #ffffff; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #3b82f6;">
        🛡️ <strong>Alur Ketertelusuran Metodologi:</strong> Setiap jawaban di bawah ini langsung dipetakan ke 108 Checkpoint 4C Producer, menguji aturan Major Gate (larangan Paraquat, deforestasi, pembakaran lahan, pekerja anak), dan menghasilkan perhitungan CT-4CI riil dari database.
      </div>
    </div>

    <!-- Live Banned Chemical Alert Box -->
    <div id="banned-chemical-alert-box" style="display: none;" class="banned-chemical-alert">
      <span style="font-size: 18px;">🚨</span>
      <div>
        <strong>PERINGATAN BAHAN KIMIA TERLARANG TERDETEKSI:</strong>
        <span id="banned-chemical-alert-text">Penggunaan herbisida/pestisida yang mengandung Paraquat atau bahan terlarang 4C akan menggugurkan status Major Gate secara mutlak.</span>
      </div>
    </div>

    <!-- 2. Topic Navigation Tabs (Topik A s/d E) -->
    <div class="wizard-topic-nav" style="margin-top: 14px;">
  `;

  cachedPracticesConfig.forEach((cat, idx) => {
    const isActive = activePracticeTopicIndex === idx;
    const catCode = cat.categoryName.substring(0, 1);
    html += `
      <button class="wizard-topic-btn ${isActive ? 'active' : ''}" onclick="switchPracticesTopic(${idx})">
        <span>${cat.categoryIcon}</span>
        <span>${cat.categoryName}</span>
      </button>
    `;
  });

  html += `
      <button class="wizard-topic-btn ${activePracticeTopicIndex === 5 ? 'active' : ''}" onclick="switchPracticesTopic(5)">
        <span>📋</span>
        <span>Tampilkan Semua Topik (A–E)</span>
      </button>
    </div>

    <!-- 3. Question Form Body -->
    <form id="practices-evaluation-form" onsubmit="event.preventDefault(); submitPracticesEvaluation();">
  `;

  cachedPracticesConfig.forEach((cat, catIdx) => {
    // If not displaying this category, skip (unless activePracticeTopicIndex === 5)
    if (activePracticeTopicIndex !== 5 && activePracticeTopicIndex !== catIdx) {
      return;
    }

    html += `
      <div style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; background: white;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 16px;">
          <div>
            <h4 style="margin: 0; font-size: 15px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
              <span>${cat.categoryIcon}</span> ${cat.categoryName}
            </h4>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${cat.description}</div>
          </div>
          <span class="badge badge-minor" style="font-size: 11px;">Topik ${cat.category}</span>
        </div>
    `;

    cat.sections.forEach(sec => {
      html += `
        <div style="margin-bottom: 18px;">
          <h5 style="margin: 0 0 10px 0; font-size: 13px; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
            📌 ${sec.title}
          </h5>
          <div style="display: flex; flex-direction: column; gap: 12px;">
      `;

      sec.questions.forEach((q, qIdx) => {
        const val = currentPracticesAnswers[q.id];
        const isMajor = q.isMajor;
        const mappedCodes = q.mappedCheckpoints || [];

        html += `
          <div class="question-card ${isMajor ? 'has-major' : 'is-minor'}" id="card-${q.id}">
            <div class="question-meta">
              <div class="question-title">
                <span style="color: #64748b; margin-right: 4px;">#${q.id.replace('Q_', '')}:</span>
                ${q.text}
              </div>
              <div class="question-badges">
                ${isMajor ? '<span class="badge badge-fail" style="font-size: 10px;">KRITERIA MAJOR</span>' : '<span class="badge badge-minor" style="font-size: 10px;">STANDAR MINOR</span>'}
                ${mappedCodes.map(c => `<span class="badge ${isMajor ? 'badge-fail' : 'badge-minor'}" style="font-size: 10px;" title="Terhubung ke Checkpoint ${c}">4C: ${c}</span>`).join(' ')}
              </div>
            </div>
        `;

        // Render input control according to question type
        if (q.type === 'BOOLEAN') {
          const isTrue = val === true || val === 'true';
          const isFalse = val === false || val === 'false';
          html += `
            <div class="question-options-group" style="flex-direction: row; gap: 16px;">
              <label class="radio-option-label ${isTrue ? 'selected' : ''}" style="flex: 1;">
                <input type="radio" name="${q.id}" value="true" ${isTrue ? 'checked' : ''} onchange="onPracticeAnswerChange('${q.id}', true)">
                <span>🟢 Ya / Memenuhi Ketentuan</span>
              </label>
              <label class="radio-option-label ${isFalse ? 'selected' : ''}" style="flex: 1;">
                <input type="radio" name="${q.id}" value="false" ${isFalse ? 'checked' : ''} onchange="onPracticeAnswerChange('${q.id}', false)">
                <span>🔴 Tidak / Belum Memenuhi</span>
              </label>
            </div>
          `;
        } else if (q.type === 'SINGLE_CHOICE') {
          html += `<div class="question-options-group">`;
          (q.options || []).forEach(opt => {
            const isSelected = val === opt;
            const isPelanggaran = opt.includes('Pelanggaran') || opt.includes('Kurang') || opt.includes('Tidak');
            html += `
              <label class="radio-option-label ${isSelected ? 'selected' : ''}">
                <input type="radio" name="${q.id}" value="${escapeHtml(opt)}" ${isSelected ? 'checked' : ''} onchange="onPracticeAnswerChange('${q.id}', this.value)">
                <span>${opt}</span>
                ${isPelanggaran ? '<span class="badge badge-fail" style="margin-left: auto; font-size: 9px;">RISIKO MAJOR</span>' : ''}
              </label>
            `;
          });
          html += `</div>`;
        } else if (q.type === 'MULTI_CHOICE') {
          html += `<div class="question-options-group">`;
          const selectedArray = Array.isArray(val) ? val : [];
          (q.options || []).forEach(opt => {
            const isChecked = selectedArray.includes(opt);
            html += `
              <label class="checkbox-option-label ${isChecked ? 'selected' : ''}">
                <input type="checkbox" name="${q.id}" value="${escapeHtml(opt)}" ${isChecked ? 'checked' : ''} onchange="onPracticeMultiChoiceChange('${q.id}', this.value, this.checked)">
                <span>${opt}</span>
              </label>
            `;
          });
          html += `</div>`;
        } else if (q.type === 'TEXT') {
          const textVal = typeof val === 'string' ? val : '';
          const isBannedField = q.id === 'Q_B04_BANNED_CHEMICAL_CHECK';
          html += `
            <div style="margin: 8px 0;">
              <input type="text" id="input-${q.id}" class="form-control" value="${escapeHtml(textVal)}" placeholder="${q.placeholder || ''}" oninput="onPracticeTextChange('${q.id}', this.value, ${isBannedField})">
            </div>
          `;
        }

        // Evidence and Metodology hints
        if (q.evidenceRequired || q.help) {
          html += `
            <div class="evidence-hint">
              ${q.evidenceRequired ? `<div>📌 <strong>Bukti Verifikasi ICS:</strong> ${q.evidenceRequired}</div>` : ''}
              ${q.help ? `<div style="margin-top: 3px; font-style: italic;">ℹ️ <strong>Rasional Metodologi:</strong> ${q.help}</div>` : ''}
            </div>
          `;
        }

        html += `</div>`; // /question-card
      });

      html += `</div></div>`; // /section
    });

    html += `</div>`; // /category-card
  });

  // Action Bar Footer
  html += `
    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="display: flex; gap: 8px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="stepPracticesTopic(-1)" ${activePracticeTopicIndex === 0 ? 'disabled' : ''}>
          ← Topik Sebelumnya
        </button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="stepPracticesTopic(1)" ${activePracticeTopicIndex >= 4 ? 'disabled' : ''}>
          Topik Selanjutnya →
        </button>
      </div>
      <div>
        <button type="submit" class="btn btn-primary" style="background: var(--primary); font-size: 13px; font-weight: 800; padding: 10px 24px; box-shadow: 0 2px 8px rgba(19,48,35,0.3);">
          🎯 SIMPAN ISIAN & EVALUASI KESIAPAN 4C (CT-4CI)
        </button>
      </div>
    </div>
    </form>
  `;

  // 4. Historical Submissions Table
  html += `
    <div style="margin-top: 20px; border-top: 2px dashed #cbd5e1; padding-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h4 style="margin: 0; font-size: 14px; color: var(--primary);">
          📋 Riwayat Formulir Praktik Budidaya Terdata (${cachedPractices.length} Catatan)
        </h4>
        <button class="btn btn-secondary btn-sm" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
          ↑ Ke Formulir Isian
        </button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID Praktik</th>
            <th>Kategori</th>
            <th>Tanggal</th>
            <th>Sumber Info</th>
            <th>Status Konfirmasi Petani</th>
            <th>Status Verifikasi ICS</th>
            <th>Bahan Terlarang</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
  `;

  if (cachedPractices.length === 0) {
    html += `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Belum ada riwayat isian untuk petani ini. Silakan isi formulir di atas dan simpan.</td></tr>`;
  } else {
    cachedPractices.forEach(pr => {
      html += `
        <tr>
          <td><code style="font-size:11px;">${pr.id}</code></td>
          <td><strong>${pr.category}</strong></td>
          <td>${pr.observationDate}</td>
          <td><span class="badge badge-minor">${pr.sourceInfo}</span></td>
          <td>
            <span class="badge ${pr.farmerConfirmationStatus === 'CONFIRMED' ? 'badge-pass' : 'badge-pending'}">
              ${pr.farmerConfirmationStatus}
            </span>
          </td>
          <td>
            <span class="badge ${pr.verificationStatus === 'VERIFIED' ? 'badge-pass' : 'badge-pending'}">
              ${pr.verificationStatus}
            </span>
          </td>
          <td>
            ${pr.hasBannedPesticide ?
              '<span class="badge badge-fail">🚨 TERDETEKSI</span>' :
              '<span class="badge badge-pass">Bebas</span>'}
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="viewPracticeDetail('${pr.id}')">Lihat Detail</button>
          </td>
        </tr>
      `;
    });
  }

  html += `</tbody></table></div>`;
  container.innerHTML = html;

  // Run immediate scan on current chemical field if populated
  const chemAnswer = currentPracticesAnswers['Q_B04_BANNED_CHEMICAL_CHECK'] || '';
  if (chemAnswer) {
    checkBannedChemicalInput(chemAnswer);
  }
}

// ----------------------------------------------------------------------------
// Practice Questionnaire Event Handlers & Evaluator Bridge
// ----------------------------------------------------------------------------
function switchPracticesTopic(index) {
  activePracticeTopicIndex = index;
  loadPracticesList();
}

function stepPracticesTopic(step) {
  let next = activePracticeTopicIndex + step;
  if (next < 0) next = 0;
  if (next > 4) next = 4;
  activePracticeTopicIndex = next;
  loadPracticesList();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function onPracticeAnswerChange(questionId, value) {
  currentPracticesAnswers[questionId] = value;
  // Update selected class on UI cards
  const card = document.getElementById(`card-${questionId}`);
  if (card) {
    card.querySelectorAll('.radio-option-label').forEach(lbl => {
      const input = lbl.querySelector('input');
      if (input && (input.value === String(value) || (value === true && input.value === 'true') || (value === false && input.value === 'false'))) {
        lbl.classList.add('selected');
      } else {
        lbl.classList.remove('selected');
      }
    });
  }
}

function onPracticeMultiChoiceChange(questionId, optionValue, isChecked) {
  let currentList = Array.isArray(currentPracticesAnswers[questionId]) ? [...currentPracticesAnswers[questionId]] : [];
  if (isChecked) {
    if (!currentList.includes(optionValue)) currentList.push(optionValue);
  } else {
    currentList = currentList.filter(item => item !== optionValue);
  }
  currentPracticesAnswers[questionId] = currentList;
  loadPracticesList();
}

function onPracticeTextChange(questionId, textValue, isBannedField = false) {
  currentPracticesAnswers[questionId] = textValue;
  if (isBannedField) {
    checkBannedChemicalInput(textValue);
  }
}

function checkBannedChemicalInput(text) {
  const alertBox = document.getElementById('banned-chemical-alert-box');
  const alertText = document.getElementById('banned-chemical-alert-text');
  if (!alertBox || !alertText) return;

  if (!text || text.trim() === '') {
    alertBox.style.display = 'none';
    return;
  }

  const lower = text.toLowerCase();
  const dangerousPatterns = ['paraquat', 'gramoxone', 'endosulfan', 'parathion', 'dieldrin', 'aldrin', 'chlordane', 'heptachlor', 'ddt', 'lindane', 'glyphosate'];
  const matched = dangerousPatterns.find(p => lower.includes(p));

  if (matched) {
    alertBox.style.display = 'flex';
    alertText.innerHTML = `Terdeteksi zat terlarang: <strong>"${matched.toUpperCase()}"</strong> dalam isian herbisida/pestisida! Kriteria Major P075/P082 akan otomatis GAGAL, mengunci Major Gate ke status <strong>UNRESOLVED</strong> dan menerbitkan temuan CAPA.`;
  } else {
    alertBox.style.display = 'none';
  }
}

function applyPracticesPreset(presetKey) {
  if (!cachedPresets[presetKey]) {
    alert(`Preset ${presetKey} tidak ditemukan di server.`);
    return;
  }
  currentPracticesAnswers = JSON.parse(JSON.stringify(cachedPresets[presetKey]));
  loadPracticesList();
  alert(`Preset "${presetKey === 'READY_4C_COMPLIANT' ? 'Petani Siap Audit (95.9% / Major Gate PASSED)' : 'Pelanggaran Major (Paraquat & Deforestasi)'}" berhasil dimuat ke seluruh 5 topik. Klik "SIMPAN ISIAN & EVALUASI KESIAPAN 4C" untuk menghitung indeks secara real-time!`);
}

function resetPracticesForm() {
  currentPracticesAnswers = {};
  loadPracticesList();
}

async function submitPracticesEvaluation() {
  const farmerId = currentFarmerId;
  const period = currentPeriod;

  try {
    const res = await fetch(`${API_BASE}/api/practices/evaluate-readiness`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Actor-Role': currentRole,
        'X-Actor-Id': currentActorId
      },
      body: JSON.stringify({
        farmerId,
        period,
        answers: currentPracticesAnswers
      })
    });

    const json = await res.json();
    if (!json.success) {
      alert(`Gagal mengevaluasi kesiapan: ${json.error || 'Terjadi kesalahan'}`);
      return;
    }

    // Refresh all global dashboard state
    await loadDashboardOverview();
    await loadCheckpoints();
    await loadCapaTable();
    await loadPracticesList();

    // Show Evaluation Result Modal
    openEvaluationResultModal(json);
  } catch (err) {
    alert(`Terjadi error saat evaluasi kesiapan: ${err.message}`);
  }
}

function openEvaluationResultModal(data) {
  const modal = document.getElementById('evaluation-result-modal');
  const content = document.getElementById('evaluation-result-content');
  if (!modal || !content) return;

  const snap = data.snapshot || {};
  const isPassed = snap.majorGateStatus === 'PASSED';
  const score = snap.ct4ciScore !== undefined ? snap.ct4ciScore : 0;
  const ec = snap.evidenceCoveragePct !== undefined ? snap.evidenceCoveragePct : 0;
  const dims = snap.dimensionBreakdown || {};
  const capas = data.generatedCapas || [];

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 32px; margin-bottom: 6px;">${isPassed ? '🎉' : '🚨'}</div>
      <h3 style="margin: 0; font-size: 18px; color: var(--primary);">Hasil Evaluasi Kesiapan Sertifikat 4C (CT-4CI)</h3>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
        Evaluasi Berdasarkan 108 Checkpoint 4C Producer • Musim: <strong>${data.period}</strong>
      </div>
    </div>

    <!-- Gate Status Banner -->
    <div style="padding: 14px 18px; border-radius: 8px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; background: ${isPassed ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isPassed ? '#a7f3d0' : '#fecaca'};">
      <div>
        <strong style="font-size: 14px; color: ${isPassed ? '#065f46' : '#991b1b'};">
          ${isPassed ? '✅ MAJOR GATE PASSED (MEMENUHI SYARAT)' : '🚨 MAJOR GATE UNRESOLVED (TERDAPAT TEMUAN KRITIS)'}
        </strong>
        <div style="font-size: 11px; color: ${isPassed ? '#047857' : '#b91c1c'}; margin-top: 2px;">
          ${isPassed ? 'Seluruh kriteria Major yang berlaku telah terbukti sesuai tanpa temuan kritis.' : 'Terdapat checkpoint Major yang terbukti gagal atau bahan terlarang yang terdeteksi.'}
        </div>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 24px; font-weight: 800; color: ${isPassed ? '#059669' : '#dc2626'};">
          ${Number(score).toFixed(1)}%
        </span>
        <div style="font-size: 10px; font-weight: 700; color: #475569;">SKOR CT-4CI</div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid-3" style="margin-bottom: 18px;">
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Cakupan Bukti (EC)</div>
        <div style="font-size: 18px; font-weight: 800; color: #0284c7;">${Number(ec).toFixed(1)}%</div>
        <div style="font-size: 10px; color: #64748b;">${snap.sufficientEvidenceCount || 0} Bukti Diterima</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Checkpoint Berlaku</div>
        <div style="font-size: 18px; font-weight: 800; color: #334155;">${snap.applicableCount || 0}</div>
        <div style="font-size: 10px; color: #64748b;">${snap.compliantWithSufficientEvidenceCount || 0} Sesuai</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">Temuan CAPA Baru</div>
        <div style="font-size: 18px; font-weight: 800; color: ${capas.length > 0 ? '#dc2626' : '#059669'};">${capas.length}</div>
        <div style="font-size: 10px; color: #64748b;">Tindakan Perbaikan</div>
      </div>
    </div>

    <!-- 3 Dimensions Breakdown -->
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 18px;">
      <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px;">Capaian Berdasarkan 3 Dimensi 4C:</div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
        <span>📊 Dimensi Ekonomi:</span>
        <strong>${dims.ECONOMIC?.readinessScore || 0}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
        <span>👥 Dimensi Sosial:</span>
        <strong>${dims.SOCIAL?.readinessScore || 0}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px;">
        <span>🌱 Dimensi Lingkungan:</span>
        <strong>${dims.ENVIRONMENTAL?.readinessScore || 0}%</strong>
      </div>
    </div>

    ${capas.length > 0 ? `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 18px;">
        <strong style="font-size: 12px; color: #92400e; display: block; margin-bottom: 6px;">
          ⚠️ Temuan Tindakan Perbaikan (CAPA) yang Diterbitkan:
        </strong>
        <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #78350f;">
          ${capas.map(c => `<li><strong>${c.checkpointCode}:</strong> ${c.findingDescription} (Tenggat: ${c.deadlineDate})</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div style="display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
      <button class="btn btn-secondary" onclick="closeEvaluationResultModal()">Tutup</button>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" onclick="closeEvaluationResultModal(); switchTab('penilaian-ct4ci');">
          📋 Lihat Rincian 108 Checkpoint
        </button>
        <button class="btn btn-primary" onclick="closeEvaluationResultModal(); switchTab('dashboard-indices');">
          📈 Lihat di Roda Konsentris Dashboard
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
}

function closeEvaluationResultModal() {
  const modal = document.getElementById('evaluation-result-modal');
  if (modal) modal.classList.remove('active');
}

function viewPracticeDetail(practiceId) {
  const pr = cachedPractices.find(p => p.id === practiceId);
  if (!pr) return;

  const modal = document.getElementById('drill-down-modal');
  const content = document.getElementById('drill-down-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
      <h3 style="margin: 0; font-size: 16px; color: var(--primary);">Detail Catatan Praktik Budidaya</h3>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">ID: <code>${pr.id}</code></div>
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; margin-bottom: 16px;">
      <div><strong>Kategori:</strong> ${pr.category}</div>
      <div><strong>Tanggal Observasi:</strong> ${pr.observationDate}</div>
      <div><strong>Sumber Informasi:</strong> ${pr.sourceInfo}</div>
      <div><strong>Petugas Pencatat:</strong> ${pr.recordedByUserId}</div>
      <div><strong>Konfirmasi Petani:</strong> <span class="badge ${pr.farmerConfirmationStatus === 'CONFIRMED' ? 'badge-pass' : 'badge-pending'}">${pr.farmerConfirmationStatus}</span></div>
      <div><strong>Verifikasi ICS:</strong> <span class="badge ${pr.verificationStatus === 'VERIFIED' ? 'badge-pass' : 'badge-pending'}">${pr.verificationStatus}</span></div>
      <div><strong>Bahan Terlarang:</strong> ${pr.hasBannedPesticide ? '<span class="badge badge-fail">🚨 TERDETEKSI</span>' : '<span class="badge badge-pass">Bebas</span>'}</div>
    </div>
    <div style="margin-bottom: 16px;">
      <strong>Catatan Verifikasi:</strong>
      <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 12px; margin-top: 4px; border: 1px solid #e2e8f0;">
        ${pr.verificationNotes || 'Tidak ada catatan.'}
      </div>
    </div>
    <div style="margin-bottom: 16px;">
      <strong>Payload Isian Jawaban Mentah (JSON):</strong>
      <pre style="background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 11px; max-height: 200px; overflow-y: auto; margin-top: 4px;">${pr.dataPayloadJson ? JSON.stringify(JSON.parse(pr.dataPayloadJson), null, 2) : '{}'}</pre>
    </div>
    <div style="display: flex; justify-content: flex-end;">
      <button class="btn btn-secondary" onclick="closeDrillDownModal()">Tutup</button>
    </div>
  `;

  modal.classList.add('active');
}

function showNewPracticeDialog() {
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ----------------------------------------------------------------------------
// TAB 6: Kunjungan ICS Table
// ----------------------------------------------------------------------------
function loadInspectionsList() {
  const container = document.getElementById('inspections-table-container');
  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Kode Inspeksi</th>
          <th>Tanggal</th>
          <th>Tipe Kunjungan</th>
          <th>Petugas ICS</th>
          <th>Petani</th>
          <th>Konfirmasi Petani</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>INSP-SLK-2026-01</strong></td>
          <td>12 April 2026</td>
          <td><span class="badge badge-minor">Rutin Tahunan</span></td>
          <td>Andi Saputra</td>
          <td>Pak Syamsul Arifin</td>
          <td><span class="badge badge-pass">Tanda Tangan Fisik</span></td>
          <td><span class="badge badge-pass">TERVERIFIKASI</span></td>
        </tr>
      </tbody>
    </table>
  `;
}

// ----------------------------------------------------------------------------
// TAB 7: Bukti & Verifikasi Table
// ----------------------------------------------------------------------------
async function loadEvidenceTable() {
  const container = document.getElementById('evidence-table-container');
  try {
    const res = await fetch(`${API_BASE}/api/evidence?farmerId=${currentFarmerId}`);
    const json = await res.json();
    if (!json.success) return;

    cachedEvidences = json.evidences;
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode Bukti</th>
            <th>Judul & Jenis Dokumen</th>
            <th>File URI / Hash SHA-256</th>
            <th>Checkpoint Terkait</th>
            <th>Keputusan Kecukupan Bukti</th>
            <th>Verifier</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    cachedEvidences.forEach(ev => {
      const cps = typeof ev.checkpointIdsJson === 'string' ? JSON.parse(ev.checkpointIdsJson || '[]') : (ev.checkpointIdsJson || []);
      const isSufficient = ev.sufficiencyStatus === 'SUFFICIENT';

      html += `
        <tr>
          <td><strong>${ev.evidenceCode}</strong></td>
          <td>
            <strong>${ev.title}</strong><br>
            <span style="font-size:10px; color:var(--text-muted);">${ev.docType}</span>
          </td>
          <td>
            <a href="${ev.fileUri}" target="_blank" style="font-size:11px; color:var(--primary);">${ev.fileUri}</a><br>
            <span style="font-size:9px; color:#64748b;">SHA: ${(ev.sha256Hash || '').substring(0, 16)}...</span>
          </td>
          <td>
            ${cps.map(c => `<span class="badge badge-minor">${c}</span>`).join(' ')}
          </td>
          <td>
            <span class="badge ${isSufficient ? 'badge-pass' : 'badge-pending'}">
              ${ev.sufficiencyStatus}
            </span>
          </td>
          <td>${ev.verifierUserId || '-'}</td>
          <td>
            ${currentRole === 'VERIFIER' ?
              `<button class="btn btn-primary btn-sm" onclick="setEvidenceDecision('${ev.id}')">Ubah Status</button>` :
              `<span style="font-size:11px; color:#64748b;">Hanya Verifier</span>`}
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

async function setEvidenceDecision(evidenceId) {
  const newStatus = prompt('Pilih status kecukupan bukti (SUFFICIENT, INSUFFICIENT, PENDING_VERIFICATION):', 'SUFFICIENT');
  if (!newStatus) return;

  try {
    const res = await fetch(`${API_BASE}/api/evidence/${evidenceId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Role': 'VERIFIER', 'X-Actor-Id': currentActorId },
      body: JSON.stringify({ sufficiencyStatus: newStatus.trim().toUpperCase(), notes: 'Keputusan verifier manual' })
    });
    const json = await res.json();
    if (json.success) {
      alert('Status bukti berhasil diperbarui.');
      loadEvidenceTable();
      loadDashboardOverview();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ----------------------------------------------------------------------------
// TAB 8: Penilaian 108 Checkpoints Table (P001 - P108)
// ----------------------------------------------------------------------------
async function loadCheckpoints() {
  try {
    const res = await fetch(`${API_BASE}/api/checkpoints?module=PRODUCER`);
    const json = await res.json();
    if (json.success) {
      cachedCheckpoints = json.checkpoints;
    }
  } catch (err) {
    console.error('Error loading checkpoints:', err);
  }
}

async function renderCheckpointsTable() {
  const container = document.getElementById('checkpoints-table-container');
  const dimFilter = document.getElementById('checkpoint-dim-filter')?.value || 'ALL';

  try {
    // Fetch assessments from DB
    const res = await fetch(`${API_BASE}/api/assessments?farmerId=${currentFarmerId}&period=${currentPeriod}`);
    const json = await res.json();
    cachedAssessments = json.assessments || [];
    const assMap = new Map(cachedAssessments.map(a => [a.checkpointCode, a]));

    let filtered = cachedCheckpoints;
    if (dimFilter !== 'ALL') {
      filtered = cachedCheckpoints.filter(c => c.dimension === dimFilter);
    }

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Dimensi & Referensi</th>
            <th>Judul Checkpoint</th>
            <th>Level</th>
            <th>Klasifikasi</th>
            <th>Applicability (Ai)</th>
            <th>Bukti (Vi)</th>
            <th>Kesesuaian (Ci)</th>
            <th>Hasil (Ai×Ci×Vi)</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    filtered.forEach(cp => {
      const ass = assMap.get(cp.checkpointCode);
      const isApplicable = !ass || ass.applicability === 'APPLICABLE';
      const isNotApplicable = ass && ass.applicability === 'NOT_APPLICABLE';
      const isSufficient = ass && ass.evidenceSufficiency === 'SUFFICIENT';
      const isCompliant = ass && ass.complianceResult === 'COMPLIANT';
      const isNonCompliant = ass && ass.complianceResult === 'NON_COMPLIANT';

      const Ai = isNotApplicable ? 0 : 1;
      const Vi = isSufficient ? 1 : 0;
      const Ci = isCompliant ? 1 : 0;
      const product = Ai * Ci * Vi;

      html += `
        <tr style="cursor: pointer;" onclick="openDrillDownModal('${cp.checkpointCode}')">
          <td><strong>${cp.checkpointCode}</strong></td>
          <td>
            <span style="font-size:11px; font-weight:600;">${cp.dimension}</span><br>
            <span style="font-size:10px; color:var(--text-muted);">${cp.officialRef}</span>
          </td>
          <td>
            <strong>${cp.title}</strong><br>
            <span style="font-size:10px; color:#64748b;">${cp.requiredEvidenceDescription.substring(0, 60)}...</span>
            ${cp.validationStatus === 'PENDING_SOURCE_VALIDATION' ?
              '<br><span class="badge badge-pending-val">Menunggu validasi sumber</span>' : ''}
          </td>
          <td><span style="font-size:10px;">${cp.assessmentLevel.replace('LEVEL_', 'L')}</span></td>
          <td>
            ${cp.isMajor ? '<span class="badge badge-major">MAJOR</span>' : '<span class="badge badge-minor">MINOR</span>'}
          </td>
          <td>
            <span class="badge ${isNotApplicable ? 'badge-minor' : 'badge-pass'}">
              ${isNotApplicable ? 'NOT APPLICABLE (0)' : 'APPLICABLE (1)'}
            </span>
          </td>
          <td>
            <span class="badge ${isSufficient ? 'badge-pass' : 'badge-pending'}">
              ${isSufficient ? 'CUKUP (1)' : 'BELUM (0)'}
            </span>
          </td>
          <td>
            ${isCompliant ? '<span class="badge badge-pass">SESUAI (1)</span>' :
              (isNonCompliant ? '<span class="badge badge-fail">TIDAK SESUAI (0)</span>' :
              '<span class="badge badge-pending">BELUM DITENTUKAN</span>')}
          </td>
          <td>
            <strong style="color: ${product === 1 ? '#16a34a' : '#dc2626'}; font-size: 13px;">${product}</strong>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); openDrillDownModal('${cp.checkpointCode}')">Detail</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

// ----------------------------------------------------------------------------
// Interactive Checkpoint Drill-Down Modal
// Alur: Ringkasan → Checkpoint → Pertanyaan / Data Mentah → Bukti → Keputusan Verifier → CAPA
// ----------------------------------------------------------------------------
function openDrillDownModal(checkpointCode) {
  const cp = cachedCheckpoints.find(c => c.checkpointCode === checkpointCode);
  if (!cp) return;

  const ass = cachedAssessments.find(a => a.checkpointCode === checkpointCode);
  const relatedEvidences = cachedEvidences.filter(e => (e.checkpointIdsJson || '').includes(checkpointCode));
  const openCapas = globalDataStore ? [] : [];

  const modal = document.getElementById('drill-down-modal');
  const content = document.getElementById('drill-down-content');

  content.innerHTML = `
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span class="badge ${cp.isMajor ? 'badge-major' : 'badge-minor'}">${cp.isMajor ? 'MAJOR CHECKPOINT' : 'MINOR CHECKPOINT'}</span>
        <span style="font-size: 11px; color: var(--text-muted);">${cp.sourceDoc} - ${cp.officialRef}</span>
      </div>
      <h3 style="color: var(--primary); margin-top: 6px;">${cp.checkpointCode}: ${cp.title}</h3>
      <div style="font-size: 12px; color: #475569;">Dimensi: <strong>${cp.dimension}</strong> | Level: <strong>${cp.assessmentLevel}</strong></div>
    </div>

    <!-- Step 1: Pertanyaan Lapangan & Persyaratan -->
    <div class="card" style="padding: 12px; margin-bottom: 12px; background: #f8fafc;">
      <strong style="font-size: 12px; color: var(--primary);">1. Pertanyaan Lapangan & SOP:</strong>
      <p style="font-size: 12px; margin-top: 4px;">${cp.fieldQuestionPrompt}</p>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
        <strong>Bukti Wajib:</strong> ${cp.requiredEvidenceDescription}
      </div>
    </div>

    <!-- Step 2: Bukti Digital Terlampir -->
    <div class="card" style="padding: 12px; margin-bottom: 12px;">
      <strong style="font-size: 12px; color: var(--primary);">2. Bukti Digital Terlampir (${relatedEvidences.length} Berkas):</strong>
      ${relatedEvidences.length === 0 ?
        '<p style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Belum ada dokumen/foto bukti khusus yang terhubung.</p>' :
        relatedEvidences.map(e => `
          <div style="font-size: 11px; padding: 6px 0; border-bottom: 1px dashed #e2e8f0;">
            📁 <strong>${e.title}</strong> (${e.docType}) - Status: <span class="badge ${e.sufficiencyStatus === 'SUFFICIENT' ? 'badge-pass' : 'badge-pending'}">${e.sufficiencyStatus}</span>
          </div>
        `).join('')}
    </div>

    <!-- Step 3: Keputusan Verifier -->
    <div class="card" style="padding: 12px; margin-bottom: 12px;">
      <strong style="font-size: 12px; color: var(--primary);">3. Keputusan Verifikasi Verifier ICS:</strong>
      <div style="margin-top: 8px; font-size: 12px; line-height: 1.6;">
        <div>Status Applicability: <strong>${ass?.applicability || 'APPLICABLE'}</strong> ${ass?.nonApplicabilityReason ? `(Alasan: ${ass.nonApplicabilityReason})` : ''}</div>
        <div>Kecukupan Bukti: <strong>${ass?.evidenceSufficiency || 'NOT_AVAILABLE'}</strong></div>
        <div>Hasil Penilaian: <strong style="color: ${ass?.complianceResult === 'COMPLIANT' ? '#16a34a' : '#dc2626'};">${ass?.complianceResult || 'UNDETERMINED'}</strong></div>
      </div>
    </div>

    <!-- Step 4: Status CAPA Jika Ada Temuan -->
    <div class="card" style="padding: 12px; margin-bottom: 16px; background: #fff1f2;">
      <strong style="font-size: 12px; color: #991b1b;">4. Rencana Tindakan Perbaikan (CAPA):</strong>
      <p style="font-size: 11px; color: #7f1d1d; margin-top: 4px;">
        Jika checkpoint ini terbukti tidak sesuai, sistem mewajibkan penerbitan CAPA untuk penyelesaian kesenjangan standar 4C.
      </p>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 8px;">
      <button class="btn btn-secondary" onclick="closeDrillDownModal()">Tutup</button>
    </div>
  `;

  modal.classList.add('active');
}

function closeDrillDownModal() {
  document.getElementById('drill-down-modal').classList.remove('active');
}

// ----------------------------------------------------------------------------
// TAB 9: Temuan & CAPA Table
// ----------------------------------------------------------------------------
async function loadCapaTable() {
  const container = document.getElementById('capa-table-container');
  try {
    const res = await fetch(`${API_BASE}/api/capa`);
    const json = await res.json();
    if (!json.success) return;

    cachedCapas = json.capas;
    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Kode CAPA</th>
            <th>Judul Temuan</th>
            <th>Checkpoint</th>
            <th>Klasifikasi</th>
            <th>Rencana Aksi & Tenggat</th>
            <th>Estimasi Biaya</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    cachedCapas.forEach(c => {
      const isClosed = c.status === 'CLOSED';
      html += `
        <tr>
          <td><strong>${c.capaCode}</strong></td>
          <td>
            <strong>${c.findingTitle}</strong><br>
            <span style="font-size:10px; color:#64748b;">PJ: ${c.responsiblePerson}</span>
          </td>
          <td><span class="badge badge-minor">${c.checkpointCode || c.checkpointId}</span></td>
          <td><span class="badge ${c.issueType.includes('MAJOR') ? 'badge-major' : 'badge-minor'}">${c.issueType}</span></td>
          <td>
            <div style="font-size:11px;">${c.correctiveActionPlan.substring(0, 60)}...</div>
            <div style="font-size:10px; color:var(--text-muted);">Tenggat: ${c.deadlineDate}</div>
          </td>
          <td>Rp ${(c.estimatedCostIdr || 0).toLocaleString('id-ID')}</td>
          <td>
            <span class="badge ${isClosed ? 'badge-pass' : (c.status === 'PENDING_VERIFICATION' ? 'badge-pending' : 'badge-fail')}">
              ${c.status}
            </span>
          </td>
          <td>
            ${!isClosed && currentRole === 'VERIFIER' ?
              `<button class="btn btn-primary btn-sm" onclick="closeCapaDialog('${c.id}')">Tutup Temuan</button>` :
              `<button class="btn btn-secondary btn-sm" onclick="alert('Bukti perbaikan telah terlampir.')">Lihat</button>`}
          </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

async function closeCapaDialog(capaId) {
  const notes = prompt('Masukkan catatan keputusan penutupan temuan oleh verifier:', 'Bukti fisik telah diperiksa dan dinyatakan memenuhi standar.');
  if (notes === null) return;

  try {
    const res = await fetch(`${API_BASE}/api/capa/${capaId}/verify-closure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Role': 'VERIFIER', 'X-Actor-Id': currentActorId },
      body: JSON.stringify({ accepted: true, notes })
    });
    const json = await res.json();
    if (json.success) {
      alert('CAPA berhasil ditutup setelah verifikasi bukti.');
      loadCapaTable();
      loadDashboardOverview();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ----------------------------------------------------------------------------
// TAB 10: Audit Trail & Offline Sync
// ----------------------------------------------------------------------------
async function loadAuditTrail() {
  const container = document.getElementById('audit-trail-container');
  try {
    const res = await fetch(`${API_BASE}/api/audit-trail`);
    const json = await res.json();
    if (!json.success) return;

    let html = '<ul style="list-style: none; padding: 0;">';
    json.logs.forEach(log => {
      html += `
        <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>${log.actionType} - ${log.entityType} (${log.entityId})</strong>
            <span style="color:#64748b;">${log.timestamp.split('T')[1].substring(0, 8)}</span>
          </div>
          <div style="color: #475569;">Aktor: ${log.actorUserId} (${log.actorRole || 'SYSTEM'}) - Alasan: ${log.changeReason || '-'}</div>
        </li>
      `;
    });
    html += '</ul>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error: ${err.message}</div>`;
  }
}

async function triggerOfflineSync() {
  const syncInd = document.getElementById('sync-status-indicator');
  syncInd.innerHTML = '🔄 Menyinkronkan...';
  syncInd.style.color = '#d97706';

  try {
    const res = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        entityType: 'BATCH_OFFLINE_DRAFT',
        payload: { syncedRecords: 5 }
      })
    });
    const json = await res.json();
    if (json.success) {
      syncInd.innerHTML = '🟢 Tersinkronisasi';
      syncInd.style.color = '#16a34a';
      alert('Sinkronisasi offline berhasil diselesaikan. Kunci idempotensi tercatat.');
    }
  } catch (err) {
    syncInd.innerHTML = '🔴 Gagal Sinkron';
    syncInd.style.color = '#dc2626';
    alert('Gagal sinkronisasi: ' + err.message);
  }
}

// ----------------------------------------------------------------------------
// TAB 12: Stakeholders Matrix Renderer
// ----------------------------------------------------------------------------
async function loadStakeholdersMatrix() {
  const tbody = document.getElementById('stakeholders-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">Memuat data matriks stakeholder...</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/api/stakeholders`);
    const data = await res.json();
    if (!data.success || !data.stakeholders) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Gagal memuat matriks stakeholder.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    data.stakeholders.forEach((s, idx) => {
      const isCurrentActive = s.roleCode === currentRole;
      const isOperator = s.category === 'SUPPLY_CHAIN_OPERATOR' || s.category === 'COMMERCIAL_BUYER';

      const tr = document.createElement('tr');
      if (isCurrentActive) {
        tr.style.backgroundColor = '#ecfdf5';
      }

      tr.innerHTML = `
        <td style="font-weight: 700; text-align: center;">${s.stageOrder || idx + 1}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--text-main); font-size: 13px;">${s.name}</strong>
            ${isCurrentActive ? '<span class="badge badge-pass" style="font-size: 9px;">AKTIF SEKARANG</span>' : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${s.description}</div>
        </td>
        <td>
          <span class="badge ${isOperator ? 'badge-pass' : 'badge-pending'}" style="font-size: 10px;">
            ${isOperator ? 'PELAKU RANTAI PASOK' : 'VERIFIKATOR / AUDITOR'}
          </span>
        </td>
        <td>
          <code style="font-size: 10px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${s.supplyChainStage}</code>
        </td>
        <td style="font-size: 11px;">
          <strong>${s.relatedIndices ? s.relatedIndices.join(' • ') : '-'}</strong>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${s.governingCheckpoints || '-'}</div>
        </td>
        <td style="font-size: 11px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; color: #0f766e; font-weight: 600;">
            ${s.pairedVerifierTitle || s.pairedVerifierRole}
          </span>
        </td>
        <td style="font-size: 11px;">
          ${s.assignedUser ? `<div><strong>👤 ${s.assignedUser.name}</strong></div><div style="font-size: 10px; color: var(--text-muted);">${s.assignedUser.title || s.assignedUser.email}</div>` : '-'}
          ${s.assignedFacility ? `<div style="font-size: 10px; color: #0369a1; margin-top: 2px;">🏬 ${s.assignedFacility.name}</div>` : ''}
        </td>
        <td style="text-align: center;">
          <button class="btn btn-sm ${isCurrentActive ? 'btn-primary' : 'btn-secondary'}" onclick="switchActorRole('${s.roleCode}')" style="white-space: nowrap; font-size: 10px;">
            ${isCurrentActive ? '✓ Sedang Aktif' : 'Beralih Peran'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading stakeholders matrix:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error: ${err.message}</td></tr>`;
  }
}
