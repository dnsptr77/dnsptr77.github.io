// ============================================================
//  VPN Config Finder — Pure Client-Side
//  Fetch → Parse → Filter WS → Test → Display
// ============================================================

const SOURCE = 'https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt';
const REFRESH_MS = 5 * 60 * 1000;
const TEST_TIMEOUT = 4000;

let allConfigs = [];
let activeConfigs = [];
let currentFilter = 'all';
let refreshTimer = null;
let countdown = REFRESH_MS / 1000;

// ============================================================
//  FETCH
// ============================================================
async function fetchConfigs() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && (l.startsWith('vmess://') || l.startsWith('vless://') || l.startsWith('trojan://')));
}

// ============================================================
//  PARSE
// ============================================================
function parseVMess(line) {
  try {
    const json = JSON.parse(atob(line.replace('vmess://', '')));
    const server = json.add || json.addr;
    const port = parseInt(json.port);
    if (!server || !port) return null;
    return {
      type: 'vmess', raw: line, server, port,
      tls: json.tls === 'tls', net: json.net || 'tcp',
      host: json.host || '', path: json.path || '/',
      sni: json.sni || json.host || server,
      ps: json.ps || '', country: extractFlag(json.ps || ''),
    };
  } catch { return null; }
}

function parseVLess(line) {
  try {
    const body = line.replace('vless://', '');
    const qIdx = body.indexOf('?');
    const hIdx = body.indexOf('#');
    const main = qIdx > 0 ? body.slice(0, qIdx) : body.split('#')[0];
    const atIdx = main.lastIndexOf('@');
    if (atIdx < 0) return null;
    const [server, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;
    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });
    return {
      type: 'vless', raw: line,
      server: server.replace(/[\[\]]/g, ''), port,
      tls: p.security === 'tls' || p.security === 'reality',
      net: p.type || 'tcp', host: p.host || '',
      path: p.path || '/', sni: p.sni || p.host || server,
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
      security: p.security || 'none',
      country: extractFlag(hIdx > 0 ? body.slice(hIdx + 1) : ''),
    };
  } catch { return null; }
}

function parseTrojan(line) {
  try {
    const body = line.replace('trojan://', '');
    const qIdx = body.indexOf('?');
    const hIdx = body.indexOf('#');
    const main = qIdx > 0 ? body.slice(0, qIdx) : body.split('#')[0];
    const atIdx = main.lastIndexOf('@');
    if (atIdx < 0) return null;
    const [server, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;
    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });
    return {
      type: 'trojan', raw: line,
      server, port, tls: true,
      net: p.type || 'tcp', host: p.host || '',
      path: p.path || '/', sni: p.sni || p.host || server,
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
      country: extractFlag(hIdx > 0 ? body.slice(hIdx + 1) : ''),
    };
  } catch { return null; }
}

function extractFlag(t) {
  const f = {'🇭🇰':'HK','🇩🇪':'DE','🇫🇮':'FI','🇳🇴':'NO','🇺🇸':'US','🇳🇱':'NL','🇬🇧':'GB','🇵🇱':'PL','🇷🇺':'RU','🇸🇪':'SE','🇹🇷':'TR','🇫🇷':'FR','🇯🇵':'JP','🇰🇷':'KR','🇮🇩':'ID','🇸🇬':'SG','🇦🇺':'AU','🇧🇷':'BR','🇮🇳':'IN','🇹🇼':'TW','🇱🇻':'LV','🇦🇱':'AL','🇪🇸':'ES','🇮🇹':'IT','🇺🇦':'UA','🇨🇦':'CA','🇨🇭':'CH','🇧🇪':'BE','🇦🇹':'AT','🇷🇴':'RO','🇨🇿':'CZ','🇵🇹':'PT','🇮🇪':'IE','🇬🇷':'GR','🇮🇱':'IL'};
  for (const [e, c] of Object.entries(f)) if (t.includes(e)) return c;
  const m = t.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : '🌍';
}

// ============================================================
//  TEST via WebSocket
// ============================================================
async function testWS(server, port, path) {
  return new Promise(resolve => {
    const start = Date.now();
    const proto = port === 443 || port === 2053 || port === 2083 || port === 2087 || port === 8443 ? 'wss' : 'ws';
    const url = `${proto}://${server}:${port}${path || '/'}`;
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { ws.close(); resolve(false); }, TEST_TIMEOUT);
      ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(true); };
      ws.onerror = () => { clearTimeout(timer); resolve(false); };
    } catch { resolve(false); }
  });
}

// ============================================================
//  REFRESH PIPELINE
// ============================================================
async function refresh() {
  const icon = document.getElementById('refreshIcon');
  const scanStatus = document.getElementById('scanStatus');
  const loadingBox = document.getElementById('loadingBox');

  icon.classList.add('spin');
  document.querySelector('.btn-main').classList.add('loading');
  scanStatus.textContent = 'Mengambil config dari sumber...';
  loadingBox.classList.add('show');
  document.getElementById('configGrid').innerHTML = '';

  try {
    // 1. Fetch
    scanStatus.textContent = 'Mengambil config...';
    const rawLines = await fetchConfigs();
    document.getElementById('statTotal').textContent = rawLines.length;

    // 2. Parse
    scanStatus.textContent = `Parsing ${rawLines.length} config...`;
    const parsed = [];
    rawLines.forEach(line => {
      let cfg = null;
      if (line.startsWith('vmess://')) cfg = parseVMess(line);
      else if (line.startsWith('vless://')) cfg = parseVLess(line);
      else if (line.startsWith('trojan://')) cfg = parseTrojan(line);
      if (cfg) parsed.push(cfg);
    });

    // 3. Filter WebSocket only
    const wsConfigs = parsed.filter(c => c.net === 'ws' || c.net === 'websocket');

    // 4. Test each via WebSocket
    scanStatus.textContent = `Testing ${wsConfigs.length} WebSocket configs...`;
    activeConfigs = [];
    let tested = 0;

    for (const cfg of wsConfigs) {
      tested++;
      document.getElementById('statTested').textContent = `${tested}/${wsConfigs.length}`;
      scanStatus.textContent = `Testing... ${tested}/${wsConfigs.length}`;

      const alive = await testWS(cfg.server, cfg.port, cfg.path);
      if (alive) {
        activeConfigs.push({ ...cfg, alive: true });
        document.getElementById('statActive').textContent = activeConfigs.length;
      }
    }

    allConfigs = parsed;
    document.getElementById('statTime').textContent = `${((Date.now() % REFRESH_MS) / 1000).toFixed(0)}s`;

    // 5. Render
    loadingBox.classList.remove('show');
    renderConfigs();
    scanStatus.textContent = `✅ ${activeConfigs.length} config aktif dari ${wsConfigs.length} WebSocket`;
    updateNavStatus(true);
    toast(`Ditemukan ${activeConfigs.length} config aktif!`, 'success');

  } catch (e) {
    loadingBox.classList.remove('show');
    scanStatus.textContent = `❌ Error: ${e.message}`;
    updateNavStatus(false);
    toast(`Error: ${e.message}`, 'error');
  }

  icon.classList.remove('spin');
  document.querySelector('.btn-main').classList.remove('loading');
  resetCountdown();
}

// ============================================================
//  RENDER
// ============================================================
function renderConfigs() {
  const grid = document.getElementById('configGrid');
  const empty = document.getElementById('emptyState');
  let configs = activeConfigs;

  if (currentFilter !== 'all' && currentFilter !== 'ws') {
    configs = configs.filter(c => c.type === currentFilter);
  } else if (currentFilter === 'ws') {
    configs = activeConfigs;
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
        <span class="card-country">${c.country}</span>
      </div>
      <div class="card-server">${c.server}:${c.port}</div>
      <div class="card-meta">
        <span>${c.tls ? '🔒 TLS' : '🔓 No TLS'}</span>
        <span>⚡ ${c.net}</span>
        <span>📍 ${c.country}</span>
      </div>
      <div class="card-actions">
        <button class="btn-copy" onclick="copyConfig(${i}, this)">📋 Copy Config</button>
        <button class="btn-detail" onclick="toggleDetail(${i}, this)">▼ Detail</button>
      </div>
      <div class="card-detail" id="detail-${i}">
        <pre>${escapeHtml(c.raw)}</pre>
      </div>
    </div>
  `).join('');
}

// ============================================================
//  ACTIONS
// ============================================================
function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === f));
  renderConfigs();
}

function copyConfig(i, btn) {
  const c = activeConfigs[i];
  if (!c) return;
  navigator.clipboard.writeText(c.raw).then(() => {
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋 Copy Config'; }, 2000);
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = c.raw;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.classList.add('copied');
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = '📋 Copy Config'; }, 2000);
  });
}

function toggleDetail(i, btn) {
  const el = document.getElementById(`detail-${i}`);
  if (!el) return;
  const showing = el.classList.toggle('show');
  btn.classList.toggle('expanded', showing);
  btn.textContent = showing ? '▲ Hide' : '▼ Detail';
}

function manualRefresh() {
  refresh();
}

// ============================================================
//  COUNTDOWN
// ============================================================
function resetCountdown() {
  countdown = REFRESH_MS / 1000;
  clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    countdown--;
    if (countdown <= 0) { refresh(); return; }
    const m = Math.floor(countdown / 60);
    const s = countdown % 60;
    document.getElementById('navTimer').textContent = `Next: ${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

// ============================================================
//  NAV STATUS
// ============================================================
function updateNavStatus(ok) {
  const el = document.getElementById('navStatus');
  if (ok) {
    el.innerHTML = '<span class="dot green pulse"></span> Online';
  } else {
    el.innerHTML = '<span class="dot red"></span> Error';
  }
}

// ============================================================
//  TOAST
// ============================================================
function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3500);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ============================================================
//  INIT
// ============================================================
refresh();
