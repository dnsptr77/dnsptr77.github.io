// ============================================================
//  VPN Config Tester — Runs on GitHub Actions with Xray-core
//  Actually connects to VPN, tests internet through tunnel
// ============================================================

const https = require('https');
const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCE = 'https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt';
const XRAY_BIN = path.join(__dirname, 'xray', 'xray');
const PROXY_PORT = 10808;
const TEST_TIMEOUT = 12000;
const RESULTS_FILE = path.join(__dirname, 'data.json');

// ============================================================
//  FETCH
// ============================================================
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ============================================================
//  PARSE CONFIGS
// ============================================================
function parseVMess(line) {
  try {
    const json = JSON.parse(Buffer.from(line.replace('vmess://', ''), 'base64').toString());
    const server = json.add || json.addr;
    const port = parseInt(json.port);
    if (!server || !port) return null;
    return {
      type: 'vmess', raw: line, server, port,
      tls: json.tls === 'tls', net: json.net || 'tcp',
      host: json.host || '', path: json.path || '/',
      sni: json.sni || json.host || server,
      ps: json.ps || '', uuid: json.id,
      alterId: json.aid || 0, security: json.scy || 'auto',
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
    const uuid = main.slice(0, atIdx);
    const [server, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;
    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });
    return {
      type: 'vless', raw: line,
      server: server.replace(/[\[\]]/g, ''), port, uuid,
      tls: p.security === 'tls' || p.security === 'reality',
      net: p.type || 'tcp', host: p.host || '',
      path: p.path || '/', sni: p.sni || p.host || server,
      security: p.security || 'none',
      flow: p.flow || '', fp: p.fp || '',
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
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
    const password = main.slice(0, atIdx);
    const [server, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;
    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });
    return {
      type: 'trojan', raw: line,
      server, port, password,
      tls: true, net: p.type || 'tcp',
      host: p.host || '', path: p.path || '/',
      sni: p.sni || p.host || server,
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
    };
  } catch { return null; }
}

// ============================================================
//  GENERATE XRAY CONFIG
// ============================================================
function generateXrayConfig(cfg) {
  const localInbound = {
    tag: 'socks-in',
    port: PROXY_PORT,
    listen: '127.0.0.1',
    protocol: 'socks',
    settings: { udp: true },
  };

  let streamSettings = {};
  if (cfg.net === 'ws') {
    streamSettings.network = 'ws';
    streamSettings.wsSettings = {
      path: cfg.path || '/',
      headers: { Host: cfg.host || cfg.server },
    };
  } else if (cfg.net === 'grpc') {
    streamSettings.network = 'grpc';
    streamSettings.grpcSettings = { serviceName: cfg.path || '' };
  } else {
    streamSettings.network = cfg.net || 'tcp';
  }

  if (cfg.tls) {
    streamSettings.security = 'tls';
    streamSettings.tlsSettings = {
      serverName: cfg.sni || cfg.server,
      allowInsecure: true,
    };
    if (cfg.fp) streamSettings.tlsSettings.fingerprint = cfg.fp;
  }

  if (cfg.security === 'reality') {
    streamSettings.security = 'reality';
    streamSettings.realitySettings = {
      serverName: cfg.sni,
      fingerprint: cfg.fp || 'chrome',
      publicKey: cfg.pbk || '',
      shortId: cfg.sid || '',
      spiderX: cfg.spx || '',
    };
  }

  let outbound = { protocol: cfg.type, settings: {}, streamSettings };

  if (cfg.type === 'vmess') {
    outbound.settings.vnext = [{
      address: cfg.server, port: cfg.port,
      users: [{ id: cfg.uuid, alterId: cfg.alterId || 0, security: cfg.security || 'auto' }],
    }];
  } else if (cfg.type === 'vless') {
    outbound.settings.vnext = [{
      address: cfg.server, port: cfg.port,
      users: [{ id: cfg.uuid, flow: cfg.flow || '' }],
    }];
  } else if (cfg.type === 'trojan') {
    outbound.settings.servers = [{
      address: cfg.server, port: cfg.port,
      password: cfg.password,
    }];
  }

  return {
    log: { loglevel: 'warning' },
    inbounds: [localInbound],
    outbounds: [outbound],
  };
}

// ============================================================
//  TEST VPN CONNECTION
// ============================================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function testConfig(cfg) {
  const configFile = '/tmp/xray-test.json';
  let xrayProc = null;

  try {
    const xrayConfig = generateXrayConfig(cfg);
    fs.writeFileSync(configFile, JSON.stringify(xrayConfig));

    // Start xray
    xrayProc = spawn(XRAY_BIN, ['run', '-c', configFile], {
      stdio: 'pipe', timeout: TEST_TIMEOUT + 3000,
    });

    await sleep(2000); // Wait for xray to start

    // Test internet through the proxy
    try {
      const result = execSync(
        `curl -x socks5h://127.0.0.1:${PROXY_PORT} --connect-timeout 8 --max-time 10 -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`,
        { timeout: TEST_TIMEOUT, encoding: 'utf8' }
      ).trim();

      const alive = result === '200';
      return { ...cfg, alive, testedAt: new Date().toISOString() };
    } catch {
      return { ...cfg, alive: false, testedAt: new Date().toISOString() };
    }
  } catch {
    return { ...cfg, alive: false, testedAt: new Date().toISOString() };
  } finally {
    if (xrayProc) {
      try { xrayProc.kill('SIGTERM'); } catch {}
    }
    try { fs.unlinkSync(configFile); } catch {}
  }
}

// ============================================================
//  MAIN
// ============================================================
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  VPN Config Tester — GitHub Actions');
  console.log('  Xray-core powered');
  console.log('═══════════════════════════════════════');

  // 1. Fetch
  console.log('\n[1/4] Fetching configs...');
  const raw = await fetchUrl(SOURCE);
  const lines = raw.split('\n').map(l => l.trim()).filter(l =>
    l && !l.startsWith('#') &&
    (l.startsWith('vmess://') || l.startsWith('vless://') || l.startsWith('trojan://'))
  );
  console.log(`  Found ${lines.length} configs`);

  // 2. Parse
  console.log('\n[2/4] Parsing...');
  const parsed = [];
  lines.forEach(line => {
    let cfg = null;
    if (line.startsWith('vmess://')) cfg = parseVMess(line);
    else if (line.startsWith('vless://')) cfg = parseVLess(line);
    else if (line.startsWith('trojan://')) cfg = parseTrojan(line);
    if (cfg) parsed.push(cfg);
  });
  console.log(`  Parsed: ${parsed.length} (${parsed.filter(c=>c.type==='vmess').length} VMess, ${parsed.filter(c=>c.type==='vless').length} VLESS, ${parsed.filter(c=>c.type==='trojan').length} Trojan)`);

  // 3. Filter WebSocket
  const wsConfigs = parsed.filter(c => c.net === 'ws' || c.net === 'websocket');
  console.log(`  WebSocket only: ${wsConfigs.length}`);

  // 4. Test each config
  console.log('\n[3/4] Testing configs with Xray-core...');
  const results = [];
  let tested = 0;

  for (const cfg of wsConfigs) {
    tested++;
    process.stdout.write(`  [${tested}/${wsConfigs.length}] ${cfg.type} ${cfg.server}:${cfg.port}... `);

    const result = await testConfig(cfg);
    results.push(result);

    if (result.alive) {
      console.log('✅ ALIVE');
    } else {
      console.log('❌ DEAD');
    }
  }

  // 5. Save results
  console.log('\n[4/4] Saving results...');
  const active = results.filter(r => r.alive);
  const output = {
    updatedAt: new Date().toISOString(),
    total: results.length,
    active: active.length,
    configs: active.map(c => ({
      type: c.type, server: c.server, port: c.port,
      tls: c.tls, net: c.net, country: extractCountry(c.ps),
      raw: c.raw, ps: c.ps,
    })),
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(output, null, 2));
  console.log(`  Saved ${active.length} active configs to data.json`);
  console.log('\n═══════════════════════════════════════');
  console.log(`  DONE: ${active.length} / ${results.length} configs alive`);
  console.log('═══════════════════════════════════════');
}

function extractCountry(text) {
  const f = {'🇭🇰':'HK','🇩🇪':'DE','🇫🇮':'FI','🇳🇴':'NO','🇺🇸':'US','🇳🇱':'NL','🇬🇧':'GB','🇵🇱':'PL','🇷🇺':'RU','🇸🇪':'SE','🇹🇷':'TR','🇫🇷':'FR','🇯🇵':'JP','🇰🇷':'KR','🇮🇩':'ID','🇸🇬':'SG','🇦🇺':'AU','🇧🇷':'BR','🇮🇳':'IN','🇹🇼':'TW','🇱🇻':'LV','🇦🇱':'AL','🇪🇸':'ES','🇮🇹':'IT'};
  for (const [e, c] of Object.entries(f)) if (text.includes(e)) return c;
  const m = text.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : '🌍';
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});

