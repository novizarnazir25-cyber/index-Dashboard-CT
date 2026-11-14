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
  else if (role === 'ICS_OPERATOR') currentActorId = 'USR-OP-01';
  else if (role === 'MANAGER') currentActorId = 'USR-MGR-01';
  else currentActorId = 'USR-VER-01';

  console.log(`Switched role to: ${currentRole} (${currentActorId})`);
  loadDashboardOverview();
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
      document.getElementById('score-ct4ci').textContent = ct4ci.score !== null ? `${ct4ci.score}%` : 'N/A';
      document.getElementById('score-coverage').textContent = ct4ci.coverage !== null ? `${ct4ci.coverage}%` : '0%';
      document.getElementById('badge-status-ct4ci').textContent = ct4ci.calculationStatus;
      document.getElementById('badge-status-ct4ci').className = `badge ${ct4ci.calculationStatus === 'CALCULATED' ? 'badge-pass' : 'badge-pending'}`;
      document.getElementById('metric-summary-counts').textContent =
        `${ct4ci.compliantCount} Sesuai / ${ct4ci.applicableCount} Berlaku (Total ${ct4ci.totalInventory} Checkpoint)`;

      // Major Gate Banner
      const gateBanner = document.getElementById('major-gate-banner');
      const gateText = document.getElementById('major-gate-text');
      const gateSub = document.getElementById('major-gate-sub');

      if (ct4ci.majorGateStatus === 'PASSED') {
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
      if (dims.ECONOMIC) document.getElementById('dim-score-econ').textContent = `${dims.ECONOMIC.readinessScore || 0}%`;
      if (dims.SOCIAL) document.getElementById('dim-score-soc').textContent = `${dims.SOCIAL.readinessScore || 0}%`;
      if (dims.ENVIRONMENTAL) document.getElementById('dim-score-env').textContent = `${dims.ENVIRONMENTAL.readinessScore || 0}%`;
    }

    // CT-CCI & CT-SDI
    if (indices.ctCci) {
      document.getElementById('score-ct-cci').textContent = indices.ctCci.score.toFixed(2);
    }
    if (indices.ctSdi) {
      document.getElementById('score-ct-sdi').textContent = indices.ctSdi.score.toFixed(2);
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
async function loadPracticesConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/practices/config`);
    const json = await res.json();
    if (json.success) cachedPracticesConfig = json.config;
  } catch (err) {
    console.error('Error loading practices config:', err);
  }
}

async function loadPracticesList() {
  const container = document.getElementById('practices-wizard-container');
  try {
    const res = await fetch(`${API_BASE}/api/practices?farmerId=${currentFarmerId}`);
    const json = await res.json();
    if (!json.success) return;

    cachedPractices = json.practices;

    let html = `
      <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; font-weight: 700;">Catatan Praktik Terdata untuk Petani Aktif:</span>
        <button class="btn btn-primary btn-sm" onclick="showNewPracticeDialog()">+ Tambah Catatan Praktik Baru</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Tgl Observasi</th>
            <th>Sumber Info</th>
            <th>Status Konfirmasi Petani</th>
            <th>Status Verifikasi ICS</th>
            <th>Bahan Kimia Terlarang</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    cachedPractices.forEach(pr => {
      html += `
        <tr>
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
            ${pr.farmerConfirmationStatus === 'PENDING' && currentRole === 'FARMER' ?
              `<button class="btn btn-primary btn-sm" onclick="confirmPractice('${pr.id}', 'CONFIRMED')">Konfirmasi</button>` :
              `<button class="btn btn-secondary btn-sm" onclick="viewPracticeDetail('${pr.id}')">Lihat</button>`}
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

async function confirmPractice(practiceId, status) {
  try {
    const res = await fetch(`${API_BASE}/api/practices/${practiceId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Actor-Role': 'FARMER', 'X-Actor-Id': currentActorId },
      body: JSON.stringify({ status, method: 'DIGITAL_APP', notes: 'Dikonfirmasi langsung oleh petani via sistem' })
    });
    const json = await res.json();
    if (json.success) {
      alert(`Praktik budidaya telah berhasil dikonfirmasi oleh petani.`);
      loadPracticesList();
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
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
