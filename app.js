// ============================================================
//  VPN Config Finder — Client reads data.json from GitHub
//  All testing done by GitHub Actions + Xray-core
// ============================================================

const DATA_URL = 'https://raw.githubusercontent.com/dnsptr77/dnsptr77.github.io/main/data.json';
const REFRESH_MS = 5 * 60 * 1000;

let allConfigs = [];
let currentFilter = 'all';
let countdown = REFRESH_MS / 1000;
let refreshTimer = null;

// ============================================================
//  FETCH RESULTS FROM GITHUB
// ============================================================
async function fetchResults() {
  const loadingBox = document.getElementById('loadingBox');
  const scanStatus = document.getElementById('scanStatus');
  const refreshIcon = document.getElementById('refreshIcon');

  loadingBox.classList.add('show');
  refreshIcon.classList.add('spin');
  scanStatus.textContent = 'Mengambil hasil scan dari GitHub...';

  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    allConfigs = data.configs || [];
    document.getElementById('statTotal').textContent = data.total || 0;
    document.getElementById('statActive').textContent = data.active || 0;
    document.getElementById('statTime').textContent = formatTime(data.updatedAt);
    document.getElementById('statTested').textContent = `${data.active || 0}/${data.total || 0}`;

    renderConfigs();
    scanStatus.textContent = `✅ ${data.active} config aktif (diupdate ${formatTime(data.updatedAt)})`;
    updateNavStatus(true);
    toast(`Ditemukan ${data.active} config aktif!`, 'success');

  } catch (e) {
    scanStatus.textContent = `❌ Error: ${e.message}`;
    updateNavStatus(false);
    // Try to show cached data or empty state
    allConfigs = [];
    renderConfigs();
  }

  loadingBox.classList.remove('show');
  refreshIcon.classList.remove('spin');
  resetCountdown();
}

function formatTime(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return `${diff}s lalu`;
  if (diff < 3600) return `${Math.floor(diff/60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h lalu`;
  return d.toLocaleDateString('id-ID');
}

// ============================================================
//  RENDER
// ============================================================
function renderConfigs() {
  const grid = document.getElementById('configGrid');
  const empty = document.getElementById('emptyState');
  let configs = allConfigs;

  if (currentFilter !== 'all') {
    configs = configs.filter(c => c.type === currentFilter);
  }

  if (!configs.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = configs.map((c, i) => `
    <div class="config-card alive" id="card-${i}">
      <div class="card-head">
        <span class="card-type ${c.type}">${c.type}</span>
        <span class="card-country">${c.country || '🌍'}</span>
      </div>
      <div class="card-server">${c.server}:${c.port}</div>
      <div class="card-meta">
        <span>${c.tls ? '🔒 TLS' : '🔓 No TLS'}</span>
        <span>⚡ ${c.net}</span>
        <span>${c.country || ''}</span>
      </div>
      <div class="card-actions">
        <button class="btn-copy" onclick="copyConfig(${i}, this)">📋 Copy</button>
        <button class="btn-detail" onclick="toggleDetail(${i}, this)">▼ Detail</button>
      </div>
      <div class="card-detail" id="detail-${i}">
        <pre>${escapeHtml(c.raw)}</pre>
      </div>
    </div>
  `).join('');
}

// ============================================================
//  FILTER
// ============================================================
function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === f)
  );
  renderConfigs();
}

// ============================================================
//  COPY
// ============================================================
function copyConfig(i, btn) {
  const c = allConfigs[i];
  if (!c) return;
  navigator.clipboard.writeText(c.raw).then(() => {
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋 Copy'; }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = c.raw;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋 Copy'; }, 2000);
  });
}

function toggleDetail(i, btn) {
  const el = document.getElementById(`detail-${i}`);
  if (!el) return;
  const showing = el.classList.toggle('show');
  btn.classList.toggle('expanded', showing);
  btn.textContent = showing ? '▲ Hide' : '▼ Detail';
}

function manualRefresh() { fetchResults(); }

// ============================================================
//  COUNTDOWN
// ============================================================
function resetCountdown() {
  countdown = REFRESH_MS / 1000;
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) { fetchResults(); return; }
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    document.getElementById('navTimer').textContent = `Next: ${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

function updateNavStatus(ok) {
  const el = document.getElementById('navStatus');
  el.innerHTML = ok
    ? '<span class="dot green pulse"></span> Online'
    : '<span class="dot red"></span> Error';
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type==='success'?'✅':type==='error'?'❌':'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity 0.3s'; setTimeout(()=>t.remove(),300); }, 3500);
}

function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ============================================================
//  INIT
// ============================================================
fetchResults();
