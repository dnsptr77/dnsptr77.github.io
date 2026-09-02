/* ================================================
   dnsptr77 Bot Manager — Core Logic
   ================================================ */

// ========== DEFAULT BOTS ==========
const DEFAULT_BOTS = [
  {
    id: 'bot-1', name: 'helper-bot', platform: 'telegram', framework: 'node-telegraf',
    token: '••••••••:AAH-xxxx', status: 'running', runtime: 'node', cmd: 'node bot.js',
    created: '2025-01-10', messages: 8432, uptime: '99.7%',
    files: [
      { name: 'bot.js', type: 'file-js', size: '12.4 KB', modified: '2025-03-01' },
      { name: 'handlers', type: 'folder', size: '—', modified: '2025-03-01' },
      { name: 'package.json', type: 'file-json', size: '1.2 KB', modified: '2025-01-10' },
      { name: '.env', type: 'file-default', size: '256 B', modified: '2025-01-10' },
      { name: 'README.md', type: 'file-md', size: '3.1 KB', modified: '2025-01-10' },
    ],
    commands: [
      { cmd: '/start', desc: 'Welcome message', cat: 'General', enabled: true },
      { cmd: '/help', desc: 'Show help', cat: 'General', enabled: true },
      { cmd: '/info', desc: 'Bot info', cat: 'General', enabled: true },
      { cmd: '/joke', desc: 'Random joke', cat: 'Fun', enabled: true },
      { cmd: '/translate', desc: 'Translate text', cat: 'Tools', enabled: true },
      { cmd: '/weather', desc: 'Weather forecast', cat: 'Tools', enabled: true },
    ],
    env: { BOT_TOKEN: '••••••••', OWNER_ID: '123456789', BOT_NAME: 'Helper Bot' },
  },
  {
    id: 'bot-2', name: 'group-mod', platform: 'telegram', framework: 'python-aiogram',
    token: '••••••••:BBG-yyyy', status: 'running', runtime: 'python', cmd: 'python bot.py',
    created: '2025-02-05', messages: 5621, uptime: '98.2%',
    files: [
      { name: 'bot.py', type: 'file-py', size: '8.7 KB', modified: '2025-03-02' },
      { name: 'filters', type: 'folder', size: '—', modified: '2025-02-28' },
      { name: 'requirements.txt', type: 'file-default', size: '320 B', modified: '2025-02-05' },
      { name: 'config.yaml', type: 'file-default', size: '512 B', modified: '2025-02-05' },
    ],
    commands: [
      { cmd: '/ban', desc: 'Ban user', cat: 'Admin', enabled: true },
      { cmd: '/mute', desc: 'Mute user', cat: 'Admin', enabled: true },
      { cmd: '/welcome', desc: 'Welcome config', cat: 'Admin', enabled: true },
      { cmd: '/rules', desc: 'Group rules', cat: 'General', enabled: true },
    ],
    env: { BOT_TOKEN: '••••••••', DB_URL: 'sqlite:///data.db' },
  },
  {
    id: 'bot-3', name: 'store-bot', platform: 'telegram', framework: 'node-telegraf',
    token: '••••••••:CCZ-zzz', status: 'stopped', runtime: 'node', cmd: 'node store.js',
    created: '2025-03-01', messages: 1205, uptime: '95.1%',
    files: [
      { name: 'store.js', type: 'file-js', size: '15.2 KB', modified: '2025-03-01' },
      { name: 'products.json', type: 'file-json', size: '4.8 KB', modified: '2025-03-01' },
      { name: 'package.json', type: 'file-json', size: '980 B', modified: '2025-03-01' },
    ],
    commands: [
      { cmd: '/shop', desc: 'Browse products', cat: 'Store', enabled: true },
      { cmd: '/buy', desc: 'Purchase item', cat: 'Store', enabled: true },
      { cmd: '/orders', desc: 'View orders', cat: 'Store', enabled: true },
    ],
    env: { BOT_TOKEN: '••••••••', PAYMENT_TOKEN: '••••••••' },
  },
  {
    id: 'bot-4', name: 'wa-notifier', platform: 'whatsapp', framework: 'node-whatsapp',
    token: '', status: 'running', runtime: 'node', cmd: 'node index.js',
    created: '2025-02-20', messages: 3210, uptime: '97.5%',
    files: [
      { name: 'index.js', type: 'file-js', size: '9.1 KB', modified: '2025-03-01' },
      { name: 'Baileys', type: 'folder', size: '—', modified: '2025-02-20' },
      { name: 'creds.json', type: 'file-json', size: '2.3 KB', modified: '2025-02-20' },
      { name: 'package.json', type: 'file-json', size: '1.4 KB', modified: '2025-02-20' },
    ],
    commands: [
      { cmd: '!ping', desc: 'Check bot alive', cat: 'General', enabled: true },
      { cmd: '!notify', desc: 'Send notification', cat: 'Tools', enabled: true },
      { cmd: '!schedule', desc: 'Schedule message', cat: 'Tools', enabled: true },
    ],
    env: { SESSION_ID: '••••••••', GROUP_ID: '120363xxx@g.us' },
  },
  {
    id: 'bot-5', name: 'wa-cs-bot', platform: 'whatsapp', framework: 'python-pywa',
    token: '', status: 'stopped', runtime: 'python', cmd: 'python app.py',
    created: '2025-03-05', messages: 489, uptime: '92.3%',
    files: [
      { name: 'app.py', type: 'file-py', size: '6.5 KB', modified: '2025-03-05' },
      { name: 'handlers.py', type: 'file-py', size: '4.2 KB', modified: '2025-03-05' },
      { name: 'requirements.txt', type: 'file-default', size: '180 B', modified: '2025-03-05' },
    ],
    commands: [
      { cmd: 'hi', desc: 'Greeting', cat: 'General', enabled: true },
      { cmd: 'order', desc: 'Place order', cat: 'CS', enabled: true },
      { cmd: 'status', desc: 'Check order', cat: 'CS', enabled: true },
    ],
    env: { PHONE_ID: '••••••••' },
  },
];

const ACTIVITIES = [
  { color: 'green', text: '<strong>helper-bot</strong> received 24 messages', time: '5 min ago' },
  { color: 'blue', text: 'Deploy <strong>wa-notifier</strong> completed', time: '12 min ago' },
  { color: 'green', text: '<strong>group-mod</strong> banned 2 spammers', time: '30 min ago' },
  { color: 'yellow', text: '<strong>store-bot</strong> stopped by user', time: '1 hour ago' },
  { color: 'red', text: '<strong>wa-cs-bot</strong> crashed — restarting...', time: '2 hours ago' },
  { color: 'blue', text: 'Env <strong>BOT_TOKEN</strong> updated on helper-bot', time: '3 hours ago' },
  { color: 'green', text: 'New bot <strong>store-bot</strong> created', time: '2 days ago' },
];

const DEPLOY_RUNS = [
  { name: 'deploy-helper-bot', status: 'success', bot: 'helper-bot', time: '12 min ago', duration: '34s' },
  { name: 'deploy-wa-notifier', status: 'success', bot: 'wa-notifier', time: '1 hour ago', duration: '42s' },
  { name: 'deploy-group-mod', status: 'success', bot: 'group-mod', time: '3 hours ago', duration: '28s' },
  { name: 'deploy-wa-cs-bot', status: 'failed', bot: 'wa-cs-bot', time: '5 hours ago', duration: '1m 12s' },
  { name: 'deploy-helper-bot', status: 'success', bot: 'helper-bot', time: '1 day ago', duration: '31s' },
];

const FRAMEWORK_MAP = {
  'node-telegraf': 'Telegraf.js',
  'node-whatsapp': 'Baileys',
  'python-aiogram': 'Aiogram',
  'python-pywa': 'PyWhatsApp',
  'custom': 'Custom',
};

// ========== STATE ==========
let bots = JSON.parse(localStorage.getItem('dnsptr_bots')) || DEFAULT_BOTS;
let selectedPlatform = 'telegram';
let currentBotFilter = 'all';
let consoleHistory = [];
let consoleHistoryIdx = -1;

function saveBots() { localStorage.setItem('dnsptr_bots', JSON.stringify(bots)); }

// ========== LOGIN ==========
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
  showToast('Welcome back, admin!', 'success');
});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('app').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  showToast('Signed out', 'info');
});

// ========== NAVIGATION ==========
document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    showPage(item.dataset.page);
    closeSidebar();
  });
});

function showPage(pageId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) { void page.offsetWidth; page.classList.add('active'); }

  // Refresh page data
  const renderers = { dashboard: renderDashboard, bots: renderBots, logs: renderLogsSelect, commands: renderCommands, files: renderFileSelect, actions: renderDeploy, env: renderEnv };
  if (renderers[pageId]) renderers[pageId]();
}

// ========== MOBILE ==========
document.getElementById('hamburgerBtn').addEventListener('click', () => {
  document.getElementById('hamburgerBtn').classList.toggle('open');
  document.getElementById('sidebar').classList.toggle('open');
});
function closeSidebar() {
  document.getElementById('hamburgerBtn').classList.remove('open');
  document.getElementById('sidebar').classList.remove('open');
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const tg = bots.filter(b => b.platform === 'telegram').length;
  const wa = bots.filter(b => b.platform === 'whatsapp').length;
  const running = bots.filter(b => b.status === 'running').length;
  document.getElementById('tgCount').textContent = tg;
  document.getElementById('waCount').textContent = wa;
  document.getElementById('runningCount').textContent = running;

  document.getElementById('dashboardBots').innerHTML = bots.map(b => renderBotItem(b, true)).join('');
  document.getElementById('activityList').innerHTML = ACTIVITIES.map(a => `
    <div class="activity-item">
      <span class="activity-dot ${a.color}"></span>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </div>`).join('');
}

// ========== BOT LIST ==========
function renderBots() {
  const query = (document.getElementById('searchBots')?.value || '').toLowerCase();
  const filtered = bots.filter(b => {
    const matchName = b.name.toLowerCase().includes(query);
    const matchPlatform = currentBotFilter === 'all' || b.platform === currentBotFilter;
    return matchName && matchPlatform;
  });
  document.getElementById('botList').innerHTML = filtered.map(b => renderBotItem(b, false)).join('') ||
    '<div class="empty-state" style="padding:40px"><p>No bots found.</p></div>';
}

document.getElementById('searchBots')?.addEventListener('input', renderBots);

// Bot filter buttons
document.getElementById('botFilter')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.toggle-btn');
  if (!btn) return;
  document.querySelectorAll('#botFilter .toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentBotFilter = btn.dataset.filter;
  renderBots();
});

function renderBotItem(bot, compact) {
  const statusClass = bot.status === 'running' ? 'online' : bot.status === 'starting' ? 'starting' : 'offline';
  const statusBadge = bot.status === 'running' ? 'badge-green' : bot.status === 'starting' ? 'badge-yellow' : 'badge-red';
  const platformBadge = bot.platform === 'telegram' ? 'badge-tg' : 'badge-wa';
  const platformLabel = bot.platform === 'telegram' ? 'Telegram' : 'WhatsApp';
  const fwLabel = FRAMEWORK_MAP[bot.framework] || bot.framework;

  return `
    <div class="server-item" onclick="openBotLogs('${bot.id}')">
      <div class="server-info">
        <div class="server-name">
          <span class="status-dot ${statusClass}"></span>
          ${bot.name}
        </div>
        <div class="server-meta">
          <span class="badge ${platformBadge}">${platformLabel}</span>
          <span class="badge badge-runtime">${fwLabel}</span>
          ${bot.platform === 'telegram' ? `<span>@${bot.name}</span>` : ''}
          <span>${bot.messages?.toLocaleString() || 0} msgs</span>
        </div>
      </div>
      <span class="badge ${statusBadge}">${bot.status}</span>
      <div class="server-actions" onclick="event.stopPropagation()">
        ${bot.status === 'running'
          ? `<button class="btn-stop" onclick="stopBot('${bot.id}')">Stop</button>
             <button class="btn-restart" onclick="restartBot('${bot.id}')">Restart</button>`
          : `<button class="btn-start" onclick="startBot('${bot.id}')">Start</button>`}
      </div>
    </div>`;
}

// ========== CREATE BOT ==========
function selectPlatform(p) {
  selectedPlatform = p;
  document.querySelectorAll('.platform-option').forEach(o => o.classList.toggle('selected', o.dataset.platform === p));
  if (p === 'whatsapp') {
    document.getElementById('tokenLabel').textContent = 'Session ID / QR Auth';
    document.getElementById('tokenHint').innerHTML = 'WhatsApp uses QR pairing. Token auto-generated on first deploy.';
    document.getElementById('newBotFramework').innerHTML = '<option value="node-whatsapp">Baileys (Node)</option><option value="python-pywa">PyWhatsApp (Python)</option><option value="custom">Custom</option>';
  } else {
    document.getElementById('tokenLabel').textContent = 'Bot Token';
    document.getElementById('tokenHint').innerHTML = 'Get from <a href="https://t.me/BotFather" target="_blank">@BotFather</a> on Telegram';
    document.getElementById('newBotFramework').innerHTML = '<option value="node-telegraf">Telegraf.js (Node)</option><option value="python-aiogram">Aiogram (Python)</option><option value="custom">Custom</option>';
  }
}

function createBot() {
  const name = document.getElementById('newBotName').value.trim();
  const token = document.getElementById('newBotToken').value.trim();
  const framework = document.getElementById('newBotFramework').value;
  const runtime = document.getElementById('newBotRuntime').value;
  const cmd = document.getElementById('newBotCmd').value.trim();

  if (!name) { showToast('Bot name is required', 'error'); return; }

  const cmdMap = { 'node-telegraf': 'node bot.js', 'node-whatsapp': 'node index.js', 'python-aiogram': 'python bot.py', 'python-pywa': 'python app.py', custom: 'echo "Add your command"' };

  const bot = {
    id: 'bot-' + Date.now(), name, platform: selectedPlatform, framework, token: token ? '••••••••' : '',
    status: 'stopped', runtime, cmd: cmd || cmdMap[framework] || 'echo "No command"',
    created: new Date().toISOString().split('T')[0], messages: 0, uptime: '0%',
    files: [{ name: runtime === 'node' ? 'bot.js' : 'bot.py', type: runtime === 'node' ? 'file-js' : 'file-py', size: '1.0 KB', modified: new Date().toISOString().split('T')[0] },
      { name: 'package.json', type: 'file-json', size: '256 B', modified: new Date().toISOString().split('T')[0] }],
    commands: [{ cmd: '/start', desc: 'Start bot', cat: 'General', enabled: true }],
    env: { ...(token ? { BOT_TOKEN: token.substring(0, 8) + '••••••' } : { SESSION_ID: '••••••••' }) },
  };

  bots.push(bot);
  saveBots();
  showPage('bots');
  showToast(`Bot "${name}" created & deploying...`, 'success');

  document.getElementById('newBotName').value = '';
  document.getElementById('newBotToken').value = '';
  document.getElementById('newBotCmd').value = '';
}

// ========== BOT CONTROL ==========
function startBot(id) {
  const b = bots.find(x => x.id === id);
  if (!b) return;
  b.status = 'starting'; saveBots(); renderBots();
  showToast(`Starting ${b.name}...`, 'info');
  setTimeout(() => { b.status = 'running'; saveBots(); renderBots(); showToast(`${b.name} is online`, 'success'); appendLog(`[${b.name}] Bot started successfully`, 'success'); }, 1800);
}

function stopBot(id) {
  const b = bots.find(x => x.id === id);
  if (!b) return;
  b.status = 'stopped'; saveBots(); renderBots();
  showToast(`${b.name} stopped`, 'info');
  appendLog(`[${b.name}] Bot stopped`, 'warn');
}

function restartBot(id) {
  const b = bots.find(x => x.id === id);
  if (!b) return;
  b.status = 'starting'; saveBots(); renderBots();
  showToast(`Restarting ${b.name}...`, 'info');
  setTimeout(() => { b.status = 'running'; saveBots(); renderBots(); showToast(`${b.name} restarted`, 'success'); appendLog(`[${b.name}] Bot restarted`, 'success'); }, 2000);
}

function openBotLogs(id) { showPage('logs'); document.getElementById('logsBotSelect').value = id; }
function restartCurrentBot() { const id = document.getElementById('deployBotSelect')?.value; if (id) restartBot(id); }
function stopCurrentBot() { const id = document.getElementById('deployBotSelect')?.value; if (id) stopBot(id); }
function deployBot() {
  const id = document.getElementById('deployBotSelect')?.value;
  const bot = bots.find(b => b.id === id);
  showToast(`🚀 Deploying ${bot?.name || 'bot'}...`, 'success');
  appendLog(`[deploy] Triggering GitHub Actions workflow...`, 'info');
  setTimeout(() => { appendLog(`[deploy] ✅ Deployment successful`, 'success'); showToast('Deploy complete!', 'success'); }, 2500);
}

// ========== LOGS / CONSOLE ==========
function renderLogsSelect() {
  const sel = document.getElementById('logsBotSelect');
  sel.innerHTML = bots.map(b => `<option value="${b.id}">${b.name} (${b.platform})</option>`).join('');
}

function renderLogsSelects() {
  ['logsBotSelect', 'cmdBotSelect', 'fileBotSelect', 'deployBotSelect', 'envBotSelect'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = bots.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  });
}

function appendLog(text, cls = '') {
  const output = document.getElementById('consoleOutput');
  if (!output) return;
  const line = document.createElement('div');
  line.className = `console-line ${cls}`;
  const ts = new Date().toTimeString().split(' ')[0];
  line.innerHTML = `<span class="timestamp">[${ts}]</span> ${text}`;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function clearConsole() {
  const output = document.getElementById('consoleOutput');
  if (output) { output.innerHTML = ''; appendLog('Console cleared.', 'system'); }
}

function exportConsole() {
  const output = document.getElementById('consoleOutput');
  if (!output) return;
  const text = Array.from(output.querySelectorAll('.console-line')).map(el => el.textContent).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bot-logs-${Date.now()}.txt`;
  a.click();
  showToast('Logs exported', 'success');
}

function sendCommand() {
  const input = document.getElementById('consoleInput');
  const cmd = input.value.trim();
  if (!cmd) return;
  consoleHistory.push(cmd);
  consoleHistoryIdx = consoleHistory.length;
  appendLog(`<span class="prompt">$</span> <span class="cmd">${escapeHtml(cmd)}</span>`);
  input.value = '';
  processCommand(cmd);
}

document.getElementById('consoleInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendCommand();
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (consoleHistoryIdx > 0) { consoleHistoryIdx--; e.target.value = consoleHistory[consoleHistoryIdx] || ''; } }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (consoleHistoryIdx < consoleHistory.length - 1) { consoleHistoryIdx++; e.target.value = consoleHistory[consoleHistoryIdx] || ''; } else { consoleHistoryIdx = consoleHistory.length; e.target.value = ''; } }
});

function processCommand(cmd) {
  const parts = cmd.split(' ');
  const main = parts[0].toLowerCase();
  const botId = document.getElementById('logsBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);

  const commands = {
    help: () => ['Commands: help, list, status, start, stop, restart, info, logs, deploy, echo, date, clear'],
    list: () => ['', '  Bot Name              Platform      Status', '  ───────────────────── ───────────── ────────', ...bots.map(b => `  ${b.name.padEnd(22)}${b.platform.padEnd(14)}${b.status}`), '', `Total: ${bots.length} bots`],
    status: () => bot ? [`${bot.status === 'running' ? '🟢' : '🔴'} ${bot.name} — ${bot.status}`, `  Platform: ${bot.platform} | Framework: ${FRAMEWORK_MAP[bot.framework]}`, `  Runtime: ${bot.runtime} | Messages: ${bot.messages}`] : ['No bot selected'],
    start: () => { if (bot && bot.status !== 'running') { startBot(bot.id); return [`Starting ${bot.name}...`]; } return ['Bot already running or not selected']; },
    stop: () => { if (bot && bot.status !== 'stopped') { stopBot(bot.id); return [`Stopping ${bot.name}...`]; } return ['Bot already stopped or not selected']; },
    restart: () => { if (bot) { restartBot(bot.id); return [`Restarting ${bot.name}...`]; } return ['No bot selected']; },
    info: () => bot ? [`Bot: ${bot.name}`, `Platform: ${bot.platform}`, `Framework: ${FRAMEWORK_MAP[bot.framework]}`, `Runtime: ${bot.runtime}`, `Command: ${bot.cmd}`, `Created: ${bot.created}`, `Messages: ${bot.messages}`, `Uptime: ${bot.uptime}`] : ['No bot selected'],
    deploy: () => { deployBot(); return ['🚀 Deploying via GitHub Actions...']; },
    logs: () => { if (!bot) return ['No bot selected']; const now = new Date(); return [`[${new Date(now - 1000).toTimeString().split(' ')[0]}] INFO  Message received from user`, `[${new Date(now - 3000).toTimeString().split(' ')[0]}] INFO  Processing command...`, `[${new Date(now - 5000).toTimeString().split(' ')[0]}] INFO  Response sent`]; },
    echo: () => [parts.slice(1).join(' ') || ''],
    date: () => [new Date().toString()],
    clear: () => { clearConsole(); return []; },
  };

  let output = main === 'clear' ? null : (commands[main] ? commands[main]() : [`Unknown command: ${main}. Type "help" for list.`]);
  if (output) output.forEach(line => appendLog(line, line.startsWith('  ') ? '' : ''));
}

// ========== COMMANDS ==========
function renderCommands() {
  renderLogsSelects();
  const botId = document.getElementById('cmdBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  const tbody = document.getElementById('commandsBody');
  if (!bot || !bot.commands.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-muted)">No commands configured</td></tr>';
    return;
  }
  tbody.innerHTML = bot.commands.map(c => `
    <tr>
      <td><code style="color:var(--accent)">${c.cmd}</code></td>
      <td>${c.desc}</td>
      <td><span class="badge badge-runtime">${c.cat}</span></td>
      <td><span class="badge ${c.enabled ? 'badge-green' : 'badge-red'}">${c.enabled ? 'Enabled' : 'Disabled'}</span></td>
      <td><button class="btn-sm" onclick="toggleCommand('${bot.id}','${c.cmd}')">${c.enabled ? 'Disable' : 'Enable'}</button></td>
    </tr>`).join('');
}

document.getElementById('cmdBotSelect')?.addEventListener('change', renderCommands);

function toggleCommand(botId, cmdName) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  const c = bot.commands.find(x => x.cmd === cmdName);
  if (c) { c.enabled = !c.enabled; saveBots(); renderCommands(); showToast(`${cmdName} ${c.enabled ? 'enabled' : 'disabled'}`, 'info'); }
}

function addCommand() {
  const botId = document.getElementById('cmdBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  const cmd = prompt('Command name (e.g. /ping):');
  if (!cmd) return;
  const desc = prompt('Description:') || 'No description';
  bot.commands.push({ cmd, desc, cat: 'General', enabled: true });
  saveBots(); renderCommands(); showToast(`Command ${cmd} added`, 'success');
}

// ========== FILES ==========
function renderFileSelect() {
  renderLogsSelects();
  renderFiles();
}

document.getElementById('fileBotSelect')?.addEventListener('change', renderFiles);

function renderFiles() {
  const botId = document.getElementById('fileBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  const files = bot.files || [];
  const listEl = document.getElementById('fileList');
  if (!files.length) {
    listEl.innerHTML = '<div class="empty-state" style="padding:40px"><p>No files yet</p></div>';
    return;
  }
  const iconMap = { folder: '📁', 'file-js': '🟨', 'file-py': '🐍', 'file-json': '📋', 'file-md': '📝', 'file-default': '📄' };
  listEl.innerHTML = files.map(f => `
    <div class="file-row">
      <div class="file-name"><span class="icon">${iconMap[f.type] || '📄'}</span> ${f.name}</div>
      <span class="file-size">${f.size}</span>
      <span class="file-date">${f.modified}</span>
      <div class="file-actions">
        <button class="btn-sm" onclick="showToast('Opening ${f.name}...','info')">Edit</button>
        <button class="btn-sm" style="color:var(--red)" onclick="deleteFile('${bot.id}','${f.name}')">Del</button>
      </div>
    </div>`).join('');
}

function deleteFile(botId, fileName) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  bot.files = bot.files.filter(f => f.name !== fileName);
  saveBots(); renderFiles(); showToast(`Deleted ${fileName}`, 'success');
}

function createNewFile() {
  const botId = document.getElementById('fileBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  const name = prompt('File name:', 'new-file.js');
  if (!name) return;
  bot.files.push({ name, type: name.endsWith('.js') ? 'file-js' : name.endsWith('.py') ? 'file-py' : name.endsWith('.json') ? 'file-json' : name.endsWith('.md') ? 'file-md' : 'file-default', size: '0 B', modified: new Date().toISOString().split('T')[0] });
  saveBots(); renderFiles(); showToast(`Created ${name}`, 'success');
}

// ========== ENV ==========
function renderEnv() {
  renderLogsSelects();
  const botId = document.getElementById('envBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  const tbody = document.getElementById('envBody');
  if (!bot || !Object.keys(bot.env || {}).length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-muted)">No variables configured</td></tr>';
    return;
  }
  tbody.innerHTML = Object.entries(bot.env).map(([k, v]) => `
    <tr>
      <td><code style="color:var(--accent)">${k}</code></td>
      <td>${v}</td>
      <td>${bot.name}</td>
      <td><button class="btn-sm" style="color:var(--red)" onclick="deleteEnv('${bot.id}','${k}')">Delete</button></td>
    </tr>`).join('');
}

document.getElementById('envBotSelect')?.addEventListener('change', renderEnv);

function saveEnv() {
  const botId = document.getElementById('envBotSelect')?.value;
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  const key = document.getElementById('envKey').value.trim();
  const value = document.getElementById('envValue').value.trim();
  if (!key) { showToast('Key is required', 'error'); return; }
  bot.env[key] = value || '••••••••';
  saveBots(); closeModal('addEnvModal'); renderEnv(); showToast(`Variable ${key} saved`, 'success');
  document.getElementById('envKey').value = '';
  document.getElementById('envValue').value = '';
}

function deleteEnv(botId, key) {
  const bot = bots.find(b => b.id === botId);
  if (!bot) return;
  delete bot.env[key];
  saveBots(); renderEnv(); showToast(`Deleted ${key}`, 'success');
}

// ========== DEPLOY ==========
function renderDeploy() {
  renderLogsSelects();
  document.getElementById('runList').innerHTML = DEPLOY_RUNS.map(r => {
    const icon = r.status === 'success' ? '✅' : '❌';
    const badge = r.status === 'success' ? 'badge-green' : 'badge-red';
    return `<div class="run-item"><span style="font-size:1.2rem">${icon}</span><div class="run-info"><h4>${r.name}</h4><p>${r.bot} • ${r.duration}</p></div><span class="badge ${badge}">${r.status}</span><span class="run-time">${r.time}</span></div>`;
  }).join('');
}

// ========== MODALS ==========
function openModal(id) { const m = document.getElementById(id); if (m) m.classList.add('open'); }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); });

// ========== TOASTS ==========
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; toast.style.transition = 'all 0.3s ease'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ========== UTILS ==========
function escapeHtml(str) { const d = document.createElement('div'); d.appendChild(document.createTextNode(str)); return d.innerHTML; }

// ========== INIT ==========
function initApp() {
  renderDashboard();
  renderLogsSelects();
  appendLog('dnsptr77 Bot Manager initialized', 'success');
  appendLog(`Loaded ${bots.length} bots (${bots.filter(b=>b.platform==='telegram').length} Telegram, ${bots.filter(b=>b.platform==='whatsapp').length} WhatsApp)`, 'info');
  appendLog('Type "help" for available commands', 'system');
}
