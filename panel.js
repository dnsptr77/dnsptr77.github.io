/* ================================================
   dnsptr77 Panel — Core Logic
   ================================================ */

// ============================================
// DATA STORE
// ============================================
const DEFAULT_SERVERS = [
  {
    id: 'srv-1',
    name: 'web-app-prod',
    runtime: 'node',
    status: 'running',
    port: 3000,
    ram: 1024,
    disk: 2,
    cmd: 'node server.js',
    created: '2024-11-10',
    files: [
      { name: 'server.js', type: 'file-js', size: '3.2 KB', modified: '2024-12-01' },
      { name: 'package.json', type: 'file-json', size: '1.1 KB', modified: '2024-11-28' },
      { name: 'package-lock.json', type: 'file-json', size: '145 KB', modified: '2024-11-28' },
      { name: 'node_modules', type: 'folder', size: '—', modified: '2024-11-28' },
      { name: 'public', type: 'folder', size: '—', modified: '2024-11-30' },
      { name: '.env', type: 'file-default', size: '256 B', modified: '2024-11-15' },
      { name: 'README.md', type: 'file-md', size: '4.7 KB', modified: '2024-11-10' },
    ],
  },
  {
    id: 'srv-2',
    name: 'ml-api-service',
    runtime: 'python',
    status: 'stopped',
    port: 8080,
    ram: 2048,
    disk: 4,
    cmd: 'python main.py',
    created: '2024-12-05',
    files: [
      { name: 'main.py', type: 'file-py', size: '2.8 KB', modified: '2024-12-15' },
      { name: 'requirements.txt', type: 'file-default', size: '420 B', modified: '2024-12-10' },
      { name: 'model', type: 'folder', size: '—', modified: '2024-12-08' },
      { name: 'utils', type: 'folder', size: '—', modified: '2024-12-12' },
      { name: '.env', type: 'file-default', size: '128 B', modified: '2024-12-05' },
      { name: 'README.md', type: 'file-md', size: '2.1 KB', modified: '2024-12-05' },
    ],
  },
  {
    id: 'srv-3',
    name: 'mc-survival',
    runtime: 'java',
    status: 'running',
    port: 25565,
    ram: 4096,
    disk: 8,
    cmd: 'java -Xmx4G -jar server.jar nogui',
    created: '2025-01-20',
    files: [
      { name: 'server.jar', type: 'file-default', size: '18.2 MB', modified: '2025-01-20' },
      { name: 'server.properties', type: 'file-default', size: '1.3 KB', modified: '2025-01-22' },
      { name: 'world', type: 'folder', size: '—', modified: '2025-02-01' },
      { name: 'plugins', type: 'folder', size: '—', modified: '2025-01-25' },
      { name: 'banned-players.json', type: 'file-json', size: '12 B', modified: '2025-01-20' },
      { name: 'ops.json', type: 'file-json', size: '256 B', modified: '2025-01-22' },
    ],
  },
  {
    id: 'srv-4',
    name: 'discord-bot',
    runtime: 'node',
    status: 'stopped',
    port: null,
    ram: 256,
    disk: 0.5,
    cmd: 'node bot.js',
    created: '2025-02-15',
    files: [
      { name: 'bot.js', type: 'file-js', size: '8.4 KB', modified: '2025-03-01' },
      { name: 'commands', type: 'folder', size: '—', modified: '2025-03-01' },
      { name: 'config.json', type: 'file-json', size: '340 B', modified: '2025-02-15' },
      { name: 'package.json', type: 'file-json', size: '820 B', modified: '2025-02-15' },
      { name: 'README.md', type: 'file-md', size: '1.8 KB', modified: '2025-02-15' },
    ],
  },
];

const ACTIVITIES = [
  { color: 'green', text: '<strong>web-app-prod</strong> was started', time: '2 min ago' },
  { color: 'blue', text: 'Workflow <strong>deploy-web-app</strong> completed', time: '15 min ago' },
  { color: 'green', text: '<strong>mc-survival</strong> server joined', time: '1 hour ago' },
  { color: 'yellow', text: '<strong>ml-api-service</strong> stopped by user', time: '3 hours ago' },
  { color: 'red', text: 'Workflow <strong>build-ml</strong> failed — check logs', time: '5 hours ago' },
  { color: 'blue', text: 'File <strong>server.js</strong> updated on web-app-prod', time: '8 hours ago' },
  { color: 'green', text: 'New server <strong>discord-bot</strong> created', time: '2 days ago' },
];

const WORKFLOW_TEMPLATES = [
  { icon: '🚀', name: 'Deploy Node.js', desc: 'Install deps & run Node server via GitHub Actions', action: 'deploy-node' },
  { icon: '🐍', name: 'Run Python Script', desc: 'Execute a Python script in CI environment', action: 'run-python' },
  { icon: '☕', name: 'Build Java App', desc: 'Compile and run Java/Maven project', action: 'build-java' },
  { icon: '📦', name: 'Build & Deploy', desc: 'Full pipeline: build, test, and deploy to Pages', action: 'build-deploy' },
];

const RECENT_RUNS = [
  { name: 'deploy-web-app', status: 'success', branch: 'main', commit: 'a2f3f99', time: '15 min ago', duration: '42s' },
  { name: 'build-ml', status: 'failed', branch: 'main', commit: '88a60c9', time: '5 hours ago', duration: '1m 23s' },
  { name: 'deploy-web-app', status: 'success', branch: 'main', commit: 'b4c2e11', time: '1 day ago', duration: '38s' },
  { name: 'build-deploy', status: 'success', branch: 'main', commit: 'f3a1d77', time: '2 days ago', duration: '2m 10s' },
  { name: 'deploy-web-app', status: 'success', branch: 'main', commit: 'c9e8a42', time: '3 days ago', duration: '45s' },
];

// ============================================
// STATE
// ============================================
let servers = JSON.parse(localStorage.getItem('dnsptr_servers')) || DEFAULT_SERVERS;
let consoleHistory = [];
let consoleHistoryIdx = -1;
let currentPath = {};

function saveServers() {
  localStorage.setItem('dnsptr_servers', JSON.stringify(servers));
}

// ============================================
// LOGIN
// ============================================
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if (email && pass) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('loginScreen').style.opacity = '0';
    initApp();
    showToast('Welcome back, admin!', 'success');
  }
});

document.getElementById('logoutBtn').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('app').style.display = 'none';
  const ls = document.getElementById('loginScreen');
  ls.style.display = 'flex';
  setTimeout(() => ls.style.opacity = '1', 10);
  showToast('Signed out successfully', 'info');
});

// ============================================
// NAVIGATION
// ============================================
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
  if (page) {
    page.classList.remove('active');
    // force reflow for animation
    void page.offsetWidth;
    page.classList.add('active');
  }

  if (pageId === 'dashboard') renderDashboard();
  if (pageId === 'servers') renderServers();
  if (pageId === 'console') renderConsoleSelect();
  if (pageId === 'files') { renderFileSelect(); renderFiles(); }
  if (pageId === 'actions') renderActions();
}

// ============================================
// MOBILE SIDEBAR
// ============================================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const sidebar = document.getElementById('sidebar');

hamburgerBtn.addEventListener('click', () => {
  hamburgerBtn.classList.toggle('open');
  sidebar.classList.toggle('open');
});

function closeSidebar() {
  hamburgerBtn.classList.remove('open');
  sidebar.classList.remove('open');
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  const running = servers.filter(s => s.status === 'running').length;
  document.getElementById('totalServers').textContent = servers.length;
  document.getElementById('runningCount').textContent = running;

  // Server list
  const listEl = document.getElementById('dashboardServers');
  listEl.innerHTML = servers.map(s => renderServerItem(s, true)).join('');

  // Activity
  const actEl = document.getElementById('activityList');
  actEl.innerHTML = ACTIVITIES.map(a => `
    <div class="activity-item">
      <span class="activity-dot ${a.color}"></span>
      <span class="activity-text">${a.text}</span>
      <span class="activity-time">${a.time}</span>
    </div>
  `).join('');
}

// ============================================
// SERVERS
// ============================================
function renderServers() {
  const query = (document.getElementById('searchServers')?.value || '').toLowerCase();
  const filtered = servers.filter(s => s.name.toLowerCase().includes(query));
  const listEl = document.getElementById('serverList');
  listEl.innerHTML = filtered.map(s => renderServerItem(s, false)).join('') ||
    '<div class="empty-state" style="padding:40px"><p>No servers found.</p></div>';
}

document.getElementById('searchServers')?.addEventListener('input', renderServers);

function renderServerItem(server, compact) {
  const runtimeLabels = { node: 'Node.js', python: 'Python', java: 'Java', go: 'Go', rust: 'Rust', deno: 'Deno', bun: 'Bun' };
  const statusClass = server.status === 'running' ? 'online' : server.status === 'starting' ? 'starting' : 'offline';
  const statusBadge = server.status === 'running' ? 'badge-green' : server.status === 'starting' ? 'badge-yellow' : 'badge-red';
  const statusLabel = server.status.charAt(0).toUpperCase() + server.status.slice(1);

  return `
    <div class="server-item" onclick="openServerConsole('${server.id}')">
      <div class="server-info">
        <div class="server-name">
          <span class="status-dot ${statusClass}" style="margin-right:8px"></span>
          ${server.name}
        </div>
        <div class="server-meta">
          <span class="badge badge-runtime">${runtimeLabels[server.runtime] || server.runtime}</span>
          ${server.port ? `<span>Port: ${server.port}</span>` : ''}
          <span>RAM: ${server.ram} MB</span>
          <span>Disk: ${server.disk} GB</span>
        </div>
      </div>
      <span class="badge ${statusBadge}">${statusLabel}</span>
      <div class="server-actions" onclick="event.stopPropagation()">
        ${server.status === 'running'
          ? `<button class="btn-stop" onclick="stopServer('${server.id}')">Stop</button>
             <button class="btn-restart" onclick="restartServer('${server.id}')">Restart</button>`
          : `<button class="btn-start" onclick="startServer('${server.id}')">Start</button>`}
      </div>
    </div>
  `;
}

function createServer() {
  const name = document.getElementById('newServerName').value.trim();
  const runtime = document.getElementById('newServerRuntime').value;
  const port = parseInt(document.getElementById('newServerPort').value) || null;
  const ram = parseInt(document.getElementById('newServerRam').value) || 512;
  const disk = parseInt(document.getElementById('newServerDisk').value) || 1;
  const cmd = document.getElementById('newServerCmd').value.trim();

  if (!name) {
    showToast('Server name is required', 'error');
    return;
  }

  const cmdMap = {
    node: 'node index.js',
    python: 'python main.py',
    java: 'java -Xmx512M -jar server.jar nogui',
    go: 'go run main.go',
    rust: './target/release/server',
    deno: 'deno run --allow-net main.ts',
    bun: 'bun run index.ts',
  };

  const server = {
    id: 'srv-' + Date.now(),
    name,
    runtime,
    status: 'stopped',
    port,
    ram,
    disk,
    cmd: cmd || cmdMap[runtime] || 'echo "No command"',
    created: new Date().toISOString().split('T')[0],
    files: [
      { name: 'README.md', type: 'file-md', size: '128 B', modified: new Date().toISOString().split('T')[0] },
    ],
  };

  servers.push(server);
  saveServers();
  closeModal('createServerModal');
  renderServers();
  showToast(`Server "${name}" created successfully!`, 'success');

  // Clear form
  document.getElementById('newServerName').value = '';
  document.getElementById('newServerCmd').value = '';
}

function startServer(id) {
  const s = servers.find(x => x.id === id);
  if (!s) return;
  s.status = 'starting';
  saveServers();
  renderServers();
  showToast(`Starting ${s.name}...`, 'info');

  setTimeout(() => {
    s.status = 'running';
    saveServers();
    renderServers();
    showToast(`${s.name} is now running`, 'success');
    appendConsole(`[system] Server "${s.name}" started successfully`, 'success');
    appendConsole(`[system] Listening on port ${s.port || 'N/A'}`, 'info');
  }, 1500);
}

function stopServer(id) {
  const s = servers.find(x => x.id === id);
  if (!s) return;
  s.status = 'stopped';
  saveServers();
  renderServers();
  showToast(`${s.name} stopped`, 'info');
  appendConsole(`[system] Server "${s.name}" stopped`, 'warn');
}

function restartServer(id) {
  const s = servers.find(x => x.id === id);
  if (!s) return;
  s.status = 'starting';
  saveServers();
  renderServers();
  showToast(`Restarting ${s.name}...`, 'info');

  setTimeout(() => {
    s.status = 'running';
    saveServers();
    renderServers();
    showToast(`${s.name} restarted`, 'success');
    appendConsole(`[system] Server "${s.name}" restarted`, 'success');
  }, 2000);
}

// ============================================
// CONSOLE
// ============================================
function renderConsoleSelect() {
  const sel = document.getElementById('consoleServerSelect');
  sel.innerHTML = servers.map(s =>
    `<option value="${s.id}">${s.name} (${s.status})</option>`
  ).join('');
}

function openServerConsole(id) {
  showPage('console');
  const sel = document.getElementById('consoleServerSelect');
  sel.value = id;
}

function sendCommand() {
  const input = document.getElementById('consoleInput');
  const cmd = input.value.trim();
  if (!cmd) return;

  consoleHistory.push(cmd);
  consoleHistoryIdx = consoleHistory.length;

  const serverId = document.getElementById('consoleServerSelect').value;
  const server = servers.find(s => s.id === serverId);

  appendConsole(`<span class="prompt">$</span> <span class="cmd">${escapeHtml(cmd)}</span>`, '', false);
  input.value = '';

  // Simulate command execution
  processCommand(cmd, server);
}

document.getElementById('consoleInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendCommand();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (consoleHistoryIdx > 0) {
      consoleHistoryIdx--;
      e.target.value = consoleHistory[consoleHistoryIdx] || '';
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (consoleHistoryIdx < consoleHistory.length - 1) {
      consoleHistoryIdx++;
      e.target.value = consoleHistory[consoleHistoryIdx] || '';
    } else {
      consoleHistoryIdx = consoleHistory.length;
      e.target.value = '';
    }
  }
});

function processCommand(cmd, server) {
  const s = server;
  const parts = cmd.split(' ');
  const main = parts[0].toLowerCase();

  const builtInCommands = {
    help: () => [
      'Available commands:',
      '',
      '  help              Show this help message',
      '  status            Show server status',
      '  start             Start the server',
      '  stop              Stop the server',
      '  restart           Restart the server',
      '  list              List all servers',
      '  info              Show server info',
      '  deploy            Trigger GitHub Actions deploy',
      '  logs              Show recent logs',
      '  clear             Clear the console',
      '  uname             Show system info',
      '  uptime            Show uptime',
      '  echo [text]       Echo text to output',
      '  date              Show current date/time',
    ],

    status: () => {
      if (!s) return ['No server selected'];
      const icon = s.status === 'running' ? '🟢' : s.status === 'starting' ? '🟡' : '🔴';
      return [
        `${icon} Server: ${s.name}`,
        `   Status: ${s.status}`,
        `   Runtime: ${s.runtime}`,
        `   Port: ${s.port || 'N/A'}`,
        `   RAM: ${s.ram} MB`,
        `   Disk: ${s.disk} GB`,
      ];
    },

    start: () => {
      if (!s) return ['No server selected'];
      if (s.status === 'running') return ['Server is already running'];
      startServer(s.id);
      return [`Starting server "${s.name}"...`];
    },

    stop: () => {
      if (!s) return ['No server selected'];
      if (s.status === 'stopped') return ['Server is already stopped'];
      stopServer(s.id);
      return [`Stopping server "${s.name}"...`];
    },

    restart: () => {
      if (!s) return ['No server selected'];
      restartServer(s.id);
      return [`Restarting server "${s.name}"...`];
    },

    list: () => {
      const header = ['  ID              Name                    Runtime      Status'];
      const sep =    '  ─────────────── ─────────────────────── ──────────── ────────';
      const rows = servers.map(sr =>
        `  ${sr.id.padEnd(16)}${sr.name.padEnd(22)}${sr.runtime.padEnd(13)}${sr.status}`
      );
      return [header[0], sep, ...rows, '', `Total: ${servers.length} servers`];
    },

    info: () => {
      if (!s) return ['No server selected'];
      return [
        `Server:  ${s.name}`,
        `ID:      ${s.id}`,
        `Runtime: ${s.runtime}`,
        `Port:    ${s.port || 'N/A'}`,
        `RAM:     ${s.ram} MB`,
        `Disk:    ${s.disk} GB`,
        `Command: ${s.cmd}`,
        `Created: ${s.created}`,
      ];
    },

    deploy: () => {
      triggerWorkflow();
      return ['🚀 Triggering GitHub Actions workflow...', '[info] Check "GitHub Actions" tab for status'];
    },

    logs: () => {
      if (!s) return ['No server selected'];
      const now = new Date();
      return [
        `[${fmtTime(now)}] INFO  Server process initialized`,
        `[${fmtTime(now - 2000)}] INFO  Loading configuration...`,
        `[${fmtTime(now - 4000)}] INFO  Listening on port ${s.port || 'default'}`,
        `[${fmtTime(now - 6000)}] INFO  Ready to accept connections`,
      ];
    },

    clear: () => { clearConsole(); return []; },

    uname: () => ['GitHub Actions Runner — Ubuntu 22.04 LTS (x86_64)'],

    uptime: () => {
      const hrs = Math.floor(Math.random() * 200) + 1;
      const mins = Math.floor(Math.random() * 60);
      return [`Uptime: ${hrs}h ${mins}m`];
    },

    echo: () => [parts.slice(1).join(' ') || ''],

    date: () => [new Date().toString()],

    whoami: () => ['admin@dnsptr77-panel'],
    pwd: () => [`/home/container/${s?.name || 'root'}`],
    ls: () => {
      if (!s) return ['No server selected'];
      return s.files.map(f => f.type === 'folder' ? `${f.name}/` : f.name);
    },
    cat: () => {
      if (!s) return ['No server selected'];
      const file = parts[1];
      if (!file) return ['Usage: cat <filename>'];
      const f = s.files.find(x => x.name === file);
      if (!f) return [`cat: ${file}: No such file or directory`];
      if (f.type === 'folder') return [`cat: ${file}: Is a directory`];
      if (file.endsWith('.js')) return [`// ${file}`, 'const express = require("express");', 'const app = express();', '', 'app.get("/", (req, res) => {', '  res.json({ status: "ok" });', '});', '', 'app.listen(3000);'];
      if (file.endsWith('.py')) return [`# ${file}`, 'from flask import Flask', '', 'app = Flask(__name__)', '', '@app.route("/")', 'def index():', '    return {"status": "ok"}'];
      if (file.endsWith('.json')) return ['{', '  "name": "' + s.name + '",', '  "version": "1.0.0",', '  "main": "index.js"', '}'];
      return [`Contents of ${file}...`];
    },
    node: () => ['Node.js v20.11.0'],
    python: () => ['Python 3.12.1'],
    java: () => ['openjdk 21.0.2'],
    go: () => ['go version go1.22.0'],
  };

  let output = [];

  if (main === 'clear') {
    clearConsole();
    return;
  }

  if (main === 'help') {
    output = builtInCommands.help();
  } else if (builtInCommands[main]) {
    output = builtInCommands[main]();
  } else {
    // Simulate remote execution via GitHub Actions
    output = [
      `[dispatch] Sending command to GitHub Actions runner...`,
      `$ ${cmd}`,
      `command: ${cmd} — not recognized locally.`,
      `[hint] Use "deploy" to trigger a workflow, or "help" for available commands.`,
    ];
  }

  output.forEach(line => {
    if (typeof line === 'string') {
      const cls = line.startsWith('[info]') || line.startsWith('[hint]') ? 'info' : '';
      appendConsole(line, cls);
    }
  });
}

function appendConsole(text, cls = '', isHtml = true) {
  const output = document.getElementById('consoleOutput');
  const line = document.createElement('div');
  line.className = `console-line ${cls}`;
  if (isHtml) line.innerHTML = text;
  else line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function clearConsole() {
  const output = document.getElementById('consoleOutput');
  output.innerHTML = '';
  appendConsole('Console cleared.', 'system');
}

function exportConsole() {
  const output = document.getElementById('consoleOutput');
  const text = Array.from(output.querySelectorAll('.console-line')).map(el => el.textContent).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `console-export-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('Console exported', 'success');
}

// ============================================
// FILE MANAGER
// ============================================
function renderFileSelect() {
  const sel = document.getElementById('fileServerSelect');
  sel.innerHTML = servers.map(s =>
    `<option value="${s.id}">${s.name}</option>`
  ).join('');
}

function renderFiles() {
  const serverId = document.getElementById('fileServerSelect').value;
  const server = servers.find(s => s.id === serverId);
  if (!server) return;

  if (!currentPath[serverId]) currentPath[serverId] = '/';
  const files = server.files || [];

  const listEl = document.getElementById('fileList');
  if (files.length === 0) {
    listEl.innerHTML = '<div class="empty-state" style="padding:40px"><p>This directory is empty.</p></div>';
    return;
  }

  listEl.innerHTML = files.map(f => {
    const iconMap = {
      'folder': '📁',
      'file-js': '🟨',
      'file-py': '🐍',
      'file-json': '📋',
      'file-md': '📝',
      'file-default': '📄',
    };
    const icon = iconMap[f.type] || '📄';
    const iconClass = f.type === 'folder' ? 'folder' : f.type;
    const actions = f.type !== 'folder'
      ? `<button class="btn-sm" onclick="editFile('${server.id}','${f.name}')">Edit</button>
         <button class="btn-sm" onclick="deleteFile('${server.id}','${f.name}')" style="color:var(--red)">Delete</button>`
      : '';

    return `
      <div class="file-row" onclick="${f.type === 'folder' ? `openFolder('${server.id}','${f.name}')` : ''}">
        <div class="file-name">
          <span class="icon ${iconClass}">${icon}</span>
          ${f.name}
        </div>
        <span class="file-size">${f.size}</span>
        <span class="file-date">${f.modified}</span>
        <div class="file-actions" onclick="event.stopPropagation()">${actions}</div>
      </div>
    `;
  }).join('');
}

document.getElementById('fileServerSelect')?.addEventListener('change', renderFiles);

function openFolder(serverId, folderName) {
  showToast(`Opened folder: ${folderName}`, 'info');
}

function editFile(serverId, fileName) {
  showToast(`Opening ${fileName} in editor...`, 'info');
}

function deleteFile(serverId, fileName) {
  const server = servers.find(s => s.id === serverId);
  if (!server) return;
  server.files = server.files.filter(f => f.name !== fileName);
  saveServers();
  renderFiles();
  showToast(`Deleted ${fileName}`, 'success');
}

function createNewFile() {
  const serverId = document.getElementById('fileServerSelect').value;
  const server = servers.find(s => s.id === serverId);
  if (!server) return;
  const name = prompt('File name:', 'new-file.js');
  if (!name) return;
  server.files.push({
    name,
    type: name.endsWith('.js') ? 'file-js' : name.endsWith('.py') ? 'file-py' : name.endsWith('.json') ? 'file-json' : name.endsWith('.md') ? 'file-md' : 'file-default',
    size: '0 B',
    modified: new Date().toISOString().split('T')[0],
  });
  saveServers();
  renderFiles();
  showToast(`Created ${name}`, 'success');
}

// ============================================
// GITHUB ACTIONS
// ============================================
function renderActions() {
  const templatesEl = document.getElementById('workflowTemplates');
  templatesEl.innerHTML = WORKFLOW_TEMPLATES.map(w => `
    <div class="workflow-card" onclick="triggerSpecificWorkflow('${w.action}')">
      <div class="workflow-icon">${w.icon}</div>
      <h4>${w.name}</h4>
      <p>${w.desc}</p>
    </div>
  `).join('');

  const runsEl = document.getElementById('runList');
  runsEl.innerHTML = RECENT_RUNS.map(r => {
    const statusIcon = r.status === 'success' ? '✅' : r.status === 'failed' ? '❌' : '🔄';
    const statusBadge = r.status === 'success' ? 'badge-green' : r.status === 'failed' ? 'badge-red' : 'badge-yellow';
    return `
      <div class="run-item">
        <span style="font-size:1.2rem">${statusIcon}</span>
        <div class="run-info">
          <h4>${r.name}</h4>
          <p>${r.branch} • ${r.commit} • ${r.duration}</p>
        </div>
        <span class="badge ${statusBadge}">${r.status}</span>
        <span class="run-time">${r.time}</span>
      </div>
    `;
  }).join('');
}

function triggerWorkflow() {
  showToast('🚀 GitHub Actions workflow triggered!', 'success');
  appendConsole('[GitHub Actions] Workflow triggered: deploy-web-app', 'success');
  appendConsole('[GitHub Actions] Runner: ubuntu-latest', 'info');
  appendConsole('[GitHub Actions] Status: queued', 'info');

  // Simulate run progress
  setTimeout(() => appendConsole('[GitHub Actions] Status: in_progress', 'info'), 1000);
  setTimeout(() => appendConsole('[GitHub Actions] ✅ Job completed successfully', 'success'), 3000);
}

function triggerSpecificWorkflow(action) {
  const tpl = WORKFLOW_TEMPLATES.find(w => w.action === action);
  if (tpl) {
    showToast(`Triggering: ${tpl.name}`, 'info');
    showPage('actions');
    setTimeout(triggerWorkflow, 500);
  }
}

// ============================================
// MODALS
// ============================================
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('open');
    // Fill database linked server select
    if (id === 'createDbModal') {
      const sel = document.getElementById('dbLinkedServer');
      if (sel) {
        sel.innerHTML = servers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      }
    }
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});

// ============================================
// TOASTS
// ============================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// UTILS
// ============================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function fmtTime(date) {
  return date.toTimeString().split(' ')[0];
}

// ============================================
// INIT
// ============================================
function initApp() {
  renderDashboard();
  renderConsoleSelect();
  appendConsole(`[system] Panel initialized`, 'success');
  appendConsole(`[system] Connected to dnsptr77.github.io`, 'info');
  appendConsole(`[system] ${servers.length} servers loaded`, 'info');
  appendConsole('', '');
  appendConsole('Type "help" to see available commands.', 'system');
}
