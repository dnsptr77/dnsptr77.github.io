// ============================================================
//  VPN Config Tester — Xray-core on GitHub Actions
//  Smart parser + Cloudflare-aware testing
// ============================================================

const https = require('https');
const http = require('http');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SOURCES = [
  'https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt',
  'https://raw.githubusercontent.com/ebrasha/free-v2ray-public-list/refs/heads/main/V2Ray-Config-By-EbraSha.txt',
];
const XRAY_BIN = path.join(__dirname, 'xray', 'xray');
const PROXY_PORT = 10808;
const TEST_TIMEOUT = 8000;
const RESULTS_FILE = path.join(__dirname, 'data.json');

// Cloudflare IPs — config di belakang CF wajib pakai ini
const CF_IP = '104.17.3.81';
const CF_PORTS = [443, 2053, 2083, 2087, 8443];

// Cek apakah string adalah IP address (bukan domain)
function isIPAddress(str) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str);
}

// Cek apakah Host/SNI valid (harus domain, bukan IP)
function isValidDomain(host, sni) {
  const h = host || '';
  const s = sni || '';
  // Jika host adalah IP → tolak
  if (h && isIPAddress(h)) return false;
  // Jika sni adalah IP → tolak
  if (s && isIPAddress(s)) return false;
  // Minimal salah satu harus domain
  if (!h && !s) return false;
  return true;
}

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
//  SMART PARSER — Extract Host/SNI dari berbagai format
// ============================================================

// Detect apakah server di belakang Cloudflare
function isBehindCF(server, port) {
  // Server adalah IP Cloudflare
  if (/^\d+\.\d+\.\d+\.\d+$/.test(server)) {
    const parts = server.split('.').map(Number);
    if (parts[0] === 104 || parts[0] === 172) return true;
  }
  // Server mengandung cloudflare/cdn
  if (/cloudflare|cloudfront|cdn/i.test(server)) return true;
  return false;
}

// Smart extract Host — dari berbagai sumber
function extractHost(json, server) {
  // Prioritas: host > sni > server (jika domain)
  let host = json.host || '';
  if (host && host !== server) return host;

  let sni = json.sni || '';
  if (sni && sni !== server) return sni;

  // Jika server adalah domain (bukan IP), gunakan sebagai host
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(server)) return server;

  return host || sni || server;
}

// Smart extract SNI — dari berbagai sumber
function extractSNI(json, server) {
  // Prioritas: sni > host > server (jika domain)
  let sni = json.sni || '';
  if (sni) return sni;

  let host = json.host || '';
  if (host) return host;

  // Jika server adalah domain, gunakan sebagai SNI
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(server)) return server;

  return sni || host || server;
}

// ============================================================
//  PARSE CONFIGS (Enhanced)
// ============================================================
function parseVMess(line) {
  try {
    const json = JSON.parse(Buffer.from(line.replace('vmess://', ''), 'base64').toString());
    const rawServer = json.add || json.addr || '';
    const port = parseInt(json.port);
    if (!rawServer || !port) return null;

    const host = extractHost(json, rawServer);
    const sni = extractSNI(json, rawServer);
    const behindCF = isBehindCF(rawServer, port);
    const testAddress = behindCF ? CF_IP : rawServer;

    return {
      type: 'vmess', raw: line,
      server: rawServer, testAddress, port,
      tls: json.tls === 'tls', net: json.net || 'tcp',
      host, sni, path: json.path || '/',
      ps: json.ps || '', uuid: json.id,
      alterId: json.aid || 0, security: json.scy || 'auto',
      behindCF,
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
    const [rawServer, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!rawServer || !port) return null;

    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });

    const server = rawServer.replace(/[\[\]]/g, '');

    // Smart host/sni extraction
    const host = p.host || p.sni || server;
    const sni = p.sni || p.host || server;
    const behindCF = isBehindCF(server, port);
    const testAddress = behindCF ? CF_IP : server;

    return {
      type: 'vless', raw: line,
      server, testAddress, port, uuid,
      tls: p.security === 'tls' || p.security === 'reality',
      net: p.type || 'tcp', host, sni,
      path: p.path || '/',
      security: p.security || 'none',
      flow: p.flow || '', fp: p.fp || '',
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
      behindCF,
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
    const [rawServer, portStr] = main.slice(atIdx + 1).split(':');
    const port = parseInt(portStr);
    if (!rawServer || !port) return null;

    const qs = qIdx > 0 ? body.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined) : '';
    const p = {};
    qs.split('&').forEach(s => { const [k, v] = s.split('='); if (k) p[k] = decodeURIComponent(v || ''); });

    const host = p.host || p.sni || rawServer;
    const sni = p.sni || p.host || rawServer;
    const behindCF = isBehindCF(rawServer, port);
    const testAddress = behindCF ? CF_IP : rawServer;

    return {
      type: 'trojan', raw: line,
      server: rawServer, testAddress, port, password,
      tls: true, net: p.type || 'tcp',
      host, sni, path: p.path || '/',
      ps: hIdx > 0 ? body.slice(hIdx + 1) : '',
      behindCF,
    };
  } catch { return null; }
}

// ============================================================
//  GENERATE XRAY CONFIG — with smart Host/SNI/Address
// ============================================================
function generateXrayConfig(cfg) {
  const localInbound = {
    tag: 'socks-in',
    port: PROXY_PORT,
    listen: '127.0.0.1',
    protocol: 'socks',
    settings: { udp: true },
  };

  // Use testAddress (104.17.3.81 if behind CF, otherwise original)
  const connectAddress = cfg.testAddress || cfg.server;

  let streamSettings = {};
  if (cfg.net === 'ws') {
    streamSettings.network = 'ws';
    streamSettings.wsSettings = {
      path: cfg.path || '/',
      headers: { Host: cfg.host },
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
      serverName: cfg.sni,
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
      address: connectAddress,
      port: cfg.port,
      users: [{ id: cfg.uuid, alterId: cfg.alterId || 0, security: cfg.security || 'auto' }],
    }];
  } else if (cfg.type === 'vless') {
    outbound.settings.vnext = [{
      address: connectAddress,
      port: cfg.port,
      users: [{ id: cfg.uuid, flow: cfg.flow || '' }],
    }];
  } else if (cfg.type === 'trojan') {
    outbound.settings.servers = [{
      address: connectAddress,
      port: cfg.port,
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

    xrayProc = spawn(XRAY_BIN, ['run', '-c', configFile], {
      stdio: 'pipe', timeout: TEST_TIMEOUT + 3000,
    });

    await sleep(2500);

    try {
      const result = execSync(
        `curl -x socks5h://127.0.0.1:${PROXY_PORT} --connect-timeout 8 --max-time 10 -s -o /dev/null -w "%{http_code}" http://httpbin.org/ip`,
        { timeout: TEST_TIMEOUT, encoding: 'utf8' }
      ).trim();
      return { ...cfg, alive: result === '200', testedAt: new Date().toISOString() };
    } catch {
      return { ...cfg, alive: false, testedAt: new Date().toISOString() };
    }
  } catch {
    return { ...cfg, alive: false, testedAt: new Date().toISOString() };
  } finally {
    if (xrayProc) try { xrayProc.kill('SIGTERM'); } catch {}
    try { fs.unlinkSync(configFile); } catch {}
  }
}

// ============================================================
//  MAIN
// ============================================================
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  VPN Config Tester v2');
  console.log('  Smart Parser + Cloudflare-aware');
  console.log('═══════════════════════════════════════');

  // 1. Fetch from all sources
  console.log('\n[1/4] Fetching configs from all sources...');
  const lines = [];
  for (const src of SOURCES) {
    try {
      const raw = await fetchUrl(src);
      const srcLines = raw.split('\n').map(l => l.trim()).filter(l =>
        l && !l.startsWith('#') &&
        (l.startsWith('vmess://') || l.startsWith('vless://') || l.startsWith('trojan://'))
      );
      console.log(`  ✅ ${src.split('/').pop()}: ${srcLines.length} configs`);
      lines.push(...srcLines);
    } catch (e) {
      console.log(`  ❌ ${src.split('/').pop()}: ${e.message}`);
    }
  }
  console.log(`  Total: ${lines.length} configs from ${SOURCES.length} sources`);

  // 2. Parse (Smart)
  console.log('\n[2/4] Parsing (smart host/sni extraction)...');
  const parsed = [];
  lines.forEach(line => {
    let cfg = null;
    if (line.startsWith('vmess://')) cfg = parseVMess(line);
    else if (line.startsWith('vless://')) cfg = parseVLess(line);
    else if (line.startsWith('trojan://')) cfg = parseTrojan(line);
    if (cfg) parsed.push(cfg);
  });
  const cfCount = parsed.filter(c => c.behindCF).length;
  console.log(`  Parsed: ${parsed.length} (${cfCount} behind Cloudflare)`);

  // 3. Filter WebSocket
  const wsConfigs = parsed.filter(c => c.net === 'ws' || c.net === 'websocket');
  const wsCF = wsConfigs.filter(c => c.behindCF).length;
  console.log(`  WebSocket: ${wsConfigs.length} (${wsCF} via Cloudflare ${CF_IP})`);

  // Show all WS configs found
  wsConfigs.forEach(c => {
    const addr = c.behindCF ? CF_IP : c.server;
    console.log(`    → ${c.type} ${c.server}:${c.port} Host:${c.host} SNI:${c.sni} CF:${c.behindCF}`);
  });

  // 4. Filter: Host/SNI harus domain (bukan IP)
  const validConfigs = wsConfigs.filter(c => {
    if (!isValidDomain(c.host, c.sni)) {
      console.log(`  ⏭️ SKIP: ${c.type} ${c.server} — Host/SNI is IP: ${c.host || c.sni}`);
      return false;
    }
    return true;
  });
  console.log(`  Valid domain only: ${validConfigs.length} / ${wsConfigs.length}`);

  // 5. Test (5 at a time for speed)
  console.log('\n[3/4] Testing with Xray-core...');
  const results = [];
  const BATCH = 5;
  for (let i = 0; i < validConfigs.length; i += BATCH) {
    const batch = validConfigs.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(async (cfg) => {
      const addr = cfg.behindCF ? CF_IP : cfg.server;
      process.stdout.write(`  [${results.length + 1}/${validConfigs.length}] ${cfg.type} → ${addr}:${cfg.port}... `);
      const result = await testConfig(cfg);
      console.log(result.alive ? '✅' : '❌');
      return result;
    }));
    results.push(...batchResults);
  }

  // 5. Save
  console.log('\n[4/4] Saving results...');
  const active = results.filter(r => r.alive);
  const output = {
    updatedAt: new Date().toISOString(),
    total: results.length,
    active: active.length,
    configs: active.map(c => ({
      type: c.type, server: c.server, port: c.port,
      tls: c.tls, net: c.net, host: c.host, sni: c.sni,
      country: extractCountry(c.ps),
      raw: c.raw, ps: c.ps, behindCF: c.behindCF,
    })),
  };

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(output, null, 2));
  console.log(`  ✅ Saved ${active.length} active configs`);
  console.log('\n═══════════════════════════════════════');
  console.log(`  DONE: ${active.length} / ${results.length} tested`);
  console.log(`  (skipped ${wsConfigs.length - validConfigs.length} with IP as Host/SNI)`);
  console.log('═══════════════════════════════════════');
}

function extractCountry(text) {
  const f = {'🇭🇰':'HK','🇩🇪':'DE','🇫🇮':'FI','🇳🇴':'NO','🇺🇸':'US','🇳🇱':'NL','🇬🇧':'GB','🇵🇱':'PL','🇷🇺':'RU','🇸🇪':'SE','🇹🇷':'TR','🇫🇷':'FR','🇯🇵':'JP','🇰🇷':'KR','🇮🇩':'ID','🇸🇬':'SG','🇦🇺':'AU','🇧🇷':'BR','🇮🇳':'IN','🇹🇼':'TW','🇱🇻':'LV','🇦🇱':'AL','🇪🇸':'ES','🇮🇹':'IT'};
  for (const [e, c] of Object.entries(f)) if (text.includes(e)) return c;
  const m = text.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : '🌍';
}

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });

