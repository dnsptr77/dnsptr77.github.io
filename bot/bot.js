const { Telegraf } = require('telegraf');
const https = require('https');
const http = require('http');
const net = require('net');
const tls = require('tls');

// ============================================================
//  dnsptr77 — VPN Config Finder Bot
//  Auto-fetch, auto-test, hanya tampilkan config yang AKTIF
// ============================================================

const BOT_TOKEN = process.env.BOT_TOKEN || '8919263361:AAGs6V3fIF32SVyvZulmQlx3z3n1BgyLMZ0';
const SOURCES = [
  'https://raw.githubusercontent.com/roosterkid/openproxylist/refs/heads/main/V2RAY_RAW.txt',
];
const TEST_TIMEOUT = 4000;      // 4 detik timeout per config
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 menit

const bot = new Telegraf(BOT_TOKEN);
const activeConfigs = { vmess: [], vless: [], trojan: [] };
const stats = { total: 0, active: 0, lastRefresh: null, refreshCount: 0 };

// ============================================================
//  FETCH CONFIGS
// ============================================================
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function fetchAllConfigs() {
  const lines = [];
  for (const src of SOURCES) {
    try {
      const raw = await fetchUrl(src);
      raw.split('\n').forEach(l => {
        const t = l.trim();
        if (t && !t.startsWith('#')) lines.push(t);
      });
      console.log(`[FETCH] ${src} → ${raw.split('\n').filter(l => l.trim()).length} lines`);
    } catch (e) {
      console.error(`[FETCH ERROR] ${src}: ${e.message}`);
    }
  }
  return lines;
}

// ============================================================
//  PARSE CONFIGS
// ============================================================
function parseVMess(line) {
  try {
    const b64 = line.replace('vmess://', '');
    const json = JSON.parse(Buffer.from(b64, 'base64').toString());
    const server = json.add || json.addr;
    const port = parseInt(json.port);
    if (!server || !port) return null;
    return {
      type: 'vmess', raw: line, server, port,
      tls: json.tls === 'tls',
      net: json.net || 'tcp',
      host: json.host || '',
      path: json.path || '/',
      sni: json.sni || json.host || server,
      ps: json.ps || '',
      country: extractCountry(json.ps || ''),
    };
  } catch { return null; }
}

function parseVLess(line) {
  try {
    const body = line.replace('vless://', '');
    const qIdx = body.indexOf('?');
    const hashIdx = body.indexOf('#');
    const mainPart = qIdx > 0 ? body.substring(0, qIdx) : (hashIdx > 0 ? body.substring(0, hashIdx) : body);
    const atIdx = mainPart.lastIndexOf('@');
    if (atIdx < 0) return null;
    const serverPort = mainPart.substring(atIdx + 1);
    const [server, portStr] = serverPort.split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;

    const queryStr = qIdx > 0 ? body.substring(qIdx + 1, hashIdx > qIdx ? hashIdx : body.length) : '';
    const params = {};
    queryStr.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });

    const label = hashIdx > 0 ? body.substring(hashIdx + 1) : '';
    return {
      type: 'vless', raw: line,
      server: server.replace(/[\[\]]/g, ''), port,
      tls: (params.security === 'tls' || params.security === 'reality'),
      net: params.type || 'tcp',
      host: params.host || '',
      path: params.path || '/',
      sni: params.sni || params.host || server,
      ps: label, uuid: mainPart.substring(0, atIdx),
      security: params.security || 'none',
      country: extractCountry(label),
    };
  } catch { return null; }
}

function parseTrojan(line) {
  try {
    const body = line.replace('trojan://', '');
    const qIdx = body.indexOf('?');
    const hashIdx = body.indexOf('#');
    const mainPart = qIdx > 0 ? body.substring(0, qIdx) : (hashIdx > 0 ? body.substring(0, hashIdx) : body);
    const atIdx = mainPart.lastIndexOf('@');
    if (atIdx < 0) return null;
    const serverPort = mainPart.substring(atIdx + 1);
    const [server, portStr] = serverPort.split(':');
    const port = parseInt(portStr);
    if (!server || !port) return null;

    const queryStr = qIdx > 0 ? body.substring(qIdx + 1, hashIdx > qIdx ? hashIdx : body.length) : '';
    const params = {};
    queryStr.split('&').forEach(p => {
      const [k, v] = p.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });

    const label = hashIdx > 0 ? body.substring(hashIdx + 1) : '';
    return {
      type: 'trojan', raw: line,
      server, port,
      tls: true,
      net: params.type || 'tcp',
      host: params.host || '',
      path: params.path || '/',
      sni: params.sni || params.host || server,
      ps: label, password: mainPart.substring(0, atIdx),
      country: extractCountry(label),
    };
  } catch { return null; }
}

function extractCountry(text) {
  const flags = {
    '🇭🇰': 'HK', '🇩🇪': 'DE', '🇫🇮': 'FI', '🇳🇴': 'NO', '🇺🇸': 'US',
    '🇳🇱': 'NL', '🇬🇧': 'GB', '🇵🇱': 'PL', '🇷🇺': 'RU', '🇸🇪': 'SE',
    '🇹🇷': 'TR', '🇫🇷': 'FR', '🇯🇵': 'JP', '🇰🇷': 'KR', '🇮🇩': 'ID',
    '🇸🇬': 'SG', '🇦🇺': 'AU', '🇧🇷': 'BR', '🇮🇳': 'IN', '🇹🇼': 'TW',
    '🇱🇻': 'LV', '🇦🇱': 'AL', '🇪🇸': 'ES', '🇮🇹': 'IT', '🇺🇦': 'UA',
    '🇨🇦': 'CA', '🇨🇭': 'CH', '🇧🇪': 'BE', '🇦🇹': 'AT', '🇷🇴': 'RO',
    '🇨🇿': 'CZ', '🇵🇹': 'PT', '🇮🇪': 'IE', '🇬🇷': 'GR', '🇮🇱': 'IL',
    '🇿🇦': 'ZA', '🇲🇽': 'MX', '🇦🇷': 'AR', '🇨🇱': 'CL', '🇵🇪': 'PE',
    '🇻🇳': 'VN', '🇹🇭': 'TH', '🇵🇭': 'PH', '🇲🇾': 'MY', '🇧🇩': 'BD',
    '🇵🇰': 'PK', '🇪🇬': 'EG', '🇳🇬': 'NG', '🇰🇪': 'KE',
  };
  for (const [emoji, code] of Object.entries(flags)) {
    if (text.includes(emoji)) return code;
  }
  const m = text.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : '??';
}

// ============================================================
//  TEST CONNECTION
// ============================================================
function testTCP(server, port) {
  return new Promise((resolve) => {
    const start = Date.now();
    const sock = net.createConnection({ host: server, port }, () => {
      const ms = Date.now() - start;
      sock.destroy();
      resolve({ ok: true, ms });
    });
    sock.setTimeout(TEST_TIMEOUT);
    sock.on('timeout', () => { sock.destroy(); resolve({ ok: false, ms: TEST_TIMEOUT }); });
    sock.on('error', () => { sock.destroy(); resolve({ ok: false, ms: -1 }); });
  });
}

function testTLS(server, port, sni) {
  return new Promise((resolve) => {
    const start = Date.now();
    const sock = tls.connect({
      host: server, port, servername: sni || server,
      rejectUnauthorized: false, timeout: TEST_TIMEOUT,
    }, () => {
      const ms = Date.now() - start;
      sock.destroy();
      resolve({ ok: true, ms });
    });
    sock.setTimeout(TEST_TIMEOUT);
    sock.on('timeout', () => { sock.destroy(); resolve({ ok: false, ms: TEST_TIMEOUT }); });
    sock.on('error', () => { sock.destroy(); resolve({ ok: false, ms: -1 }); });
  });
}

async function testConfig(cfg) {
  try {
    const result = cfg.tls
      ? await testTLS(cfg.server, cfg.port, cfg.sni)
      : await testTCP(cfg.server, cfg.port);
    return { ...cfg, alive: result.ok, ms: result.ms };
  } catch {
    return { ...cfg, alive: false, ms: -1 };
  }
}

// ============================================================
//  REFRESH: Fetch → Parse → Filter WS → Test → Store
// ============================================================
async function refreshConfigs() {
  const startTime = Date.now();
  console.log('\n[REFRESH] Starting auto-refresh...');
  stats.refreshCount++;

  const rawLines = await fetchAllConfigs();
  stats.total = rawLines.length;

  // Parse all
  const allParsed = [];
  rawLines.forEach(line => {
    let cfg = null;
    if (line.startsWith('vmess://')) cfg = parseVMess(line);
    else if (line.startsWith('vless://')) cfg = parseVLess(line);
    else if (line.startsWith('trojan://')) cfg = parseTrojan(line);
    if (cfg) allParsed.push(cfg);
  });

  console.log(`[PARSE] Total parsed: ${allParsed.length} (VMess: ${allParsed.filter(c => c.type === 'vmess').length}, VLESS: ${allParsed.filter(c => c.type === 'vless').length}, Trojan: ${allParsed.filter(c => c.type === 'trojan').length})`);

  // FILTER: Only WebSocket
  const wsConfigs = allParsed.filter(c => c.net === 'ws' || c.net === 'websocket');
  console.log(`[FILTER] WebSocket configs: ${wsConfigs.length} / ${allParsed.length} total`);

  // Test each config
  console.log(`[TEST] Testing ${wsConfigs.length} configs (timeout: ${TEST_TIMEOUT}ms)...`);
  const results = [];
  const BATCH = 20;
  for (let i = 0; i < wsConfigs.length; i += BATCH) {
    const batch = wsConfigs.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(c => testConfig(c)));
    results.push(...batchResults);
    const progress = Math.min(i + BATCH, wsConfigs.length);
    process.stdout.write(`\r[TEST] ${progress}/${wsConfigs.length} tested...`);
  }
  console.log('');

  // Store only alive
  activeConfigs.vmess = results.filter(c => c.alive && c.type === 'vmess');
  activeConfigs.vless = results.filter(c => c.alive && c.type === 'vless');
  activeConfigs.trojan = results.filter(c => c.alive && c.type === 'trojan');
  stats.active = activeConfigs.vmess.length + activeConfigs.vless.length + activeConfigs.trojan.length;
  stats.lastRefresh = new Date();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[DONE] ✅ Active: ${stats.active} | VMess: ${activeConfigs.vmess.length} | VLESS: ${activeConfigs.vless.length} | Trojan: ${activeConfigs.trojan.length} | Time: ${elapsed}s`);
}

// ============================================================
//  BOT COMMANDS
// ============================================================

// /start
bot.start((ctx) => {
  ctx.reply(
    `🔍 *VPN Config Finder*\n\n` +
    `Bot ini otomatis mencari & mengetes config\n` +
    `VMess / VLESS / Trojan mode *WebSocket*\n\n` +
    `⚙️ Auto-test setiap 5 menit\n` +
    `📡 Sumber: openproxylist\n\n` +
    `📋 *Perintah:*\n` +
    `/vmess — Config VMess WS aktif\n` +
    `/vless — Config VLESS WS aktif\n` +
    `/trojan — Config Trojan WS aktif\n` +
    `/all — Semua config aktif\n` +
    `/status — Status refresh\n` +
    `/refresh — Manual refresh\n` +
    `/help — Bantuan`,
    { parse_mode: 'Markdown' }
  );
});

// /help
bot.help((ctx) => {
  ctx.reply(
    `📖 *Bantuan*\n\n` +
    `Bot ini mengambil config VPN dari\n` +
    `sumber publik lalu mengetes koneksi\n` +
    `secara otomatis.\n\n` +
    `📋 *Perintah:*\n` +
    `/vmess — Lihat config VMess aktif\n` +
    `/vless — Lihat config VLESS aktif\n` +
    `/trojan — Lihat config Trojan aktif\n` +
    `/all — Semua sekaligus\n` +
    `/status — Info refresh terakhir\n` +
    `/refresh — Test ulang sekarang\n` +
    `/ping — Cek bot aktif\n\n` +
    `⚡ *Mode:* WebSocket only\n` +
    `🔄 *Auto-test:* Setiap 5 menit\n` +
    `⏱️ *Timeout:* ${TEST_TIMEOUT / 1000}s per config`,
    { parse_mode: 'Markdown' }
  );
});

// /ping
bot.command('ping', (ctx) => {
  ctx.reply(`🏓 Pong! Bot aktif ✅`);
});

// /status
bot.command('status', (ctx) => {
  const lr = stats.lastRefresh
    ? stats.lastRefresh.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : 'Belum pernah';
  ctx.reply(
    `📊 *Status*\n\n` +
    `• Total dikurasi: ${stats.total}\n` +
    `• Aktif (WS): ${stats.active}\n` +
    `  ├ VMess: ${activeConfigs.vmess.length}\n` +
    `  ├ VLESS: ${activeConfigs.vless.length}\n` +
    `  └ Trojan: ${activeConfigs.trojan.length}\n` +
    `• Refresh ke: #${stats.refreshCount}\n` +
    `• Terakhir: ${lr}\n` +
    `• Interval: ${REFRESH_INTERVAL / 1000 / 60} menit`,
    { parse_mode: 'Markdown' }
  );
});

// /refresh
bot.command('refresh', async (ctx) => {
  const msg = await ctx.reply('🔄 Refreshing... Menunggu...');
  await refreshConfigs();
  ctx.telegram.editMessageText(
    ctx.chat.id, msg.message_id, undefined,
    `✅ Refresh selesai!\n` +
    `Aktif: ${stats.active} config\n` +
    `VMess: ${activeConfigs.vmess.length} | VLESS: ${activeConfigs.vless.length} | Trojan: ${activeConfigs.trojan.length}`
  );
});

// /vmess
bot.command('vmess', (ctx) => {
  const configs = activeConfigs.vmess;
  if (!configs.length) return ctx.reply('❌ Tidak ada config VMess WS yang aktif saat ini.\nCoba /refresh');

  let text = `🟢 *VMess WebSocket Aktif* (${configs.length})\n\n`;
  configs.slice(0, 10).forEach((c, i) => {
    text += `*${i + 1}. ${c.country}* \`${c.server}:${c.port}\`\n`;
    text += `TLS: ${c.tls ? '✅' : '❌'} | Ping: ${c.ms}ms\n`;
    text += `\`${c.raw.substring(0, 80)}...\`\n\n`;
  });

  if (configs.length > 10) text += `_...dan ${configs.length - 10} config lainnya_\n`;
  text += `\n📋 Copy config di atas lalu import ke v2ray client.`;

  if (text.length > 4000) {
    // Split long messages
    for (let i = 0; i < configs.length; i += 5) {
      const chunk = configs.slice(i, i + 5);
      let part = `🟢 *VMess WS* [${i + 1}-${i + chunk.length}]\n\n`;
      chunk.forEach((c, j) => {
        part += `*${i + j + 1}. ${c.country}* \`${c.server}:${c.port}\` ${c.ms}ms\n`;
        part += `\`${c.raw}\`\n\n`;
      });
      ctx.reply(part, { parse_mode: 'Markdown' }).catch(() => {});
    }
  } else {
    ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
      // Fallback without markdown
      ctx.reply(text.replace(/[*`]/g, ''));
    });
  }
});

// /vless
bot.command('vless', (ctx) => {
  const configs = activeConfigs.vless;
  if (!configs.length) return ctx.reply('❌ Tidak ada config VLESS WS yang aktif saat ini.\nCoba /refresh');

  let text = `🟢 *VLESS WebSocket Aktif* (${configs.length})\n\n`;
  configs.slice(0, 10).forEach((c, i) => {
    text += `*${i + 1}. ${c.country}* \`${c.server}:${c.port}\`\n`;
    text += `TLS: ${c.tls ? '✅' : '❌'} | Ping: ${c.ms}ms\n`;
    text += `\`${c.raw.substring(0, 90)}...\`\n\n`;
  });
  if (configs.length > 10) text += `_...dan ${configs.length - 10} config lainnya_\n`;
  text += `\n📋 Copy config di atas lalu import ke v2ray client.`;

  ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
    ctx.reply(text.replace(/[*`]/g, ''));
  });
});

// /trojan
bot.command('trojan', (ctx) => {
  const configs = activeConfigs.trojan;
  if (!configs.length) return ctx.reply('❌ Tidak ada config Trojan WS yang aktif saat ini.\nCoba /refresh');

  let text = `🟢 *Trojan WebSocket Aktif* (${configs.length})\n\n`;
  configs.slice(0, 10).forEach((c, i) => {
    text += `*${i + 1}. ${c.country}* \`${c.server}:${c.port}\`\n`;
    text += `TLS: ✅ | Ping: ${c.ms}ms\n`;
    text += `\`${c.raw.substring(0, 90)}...\`\n\n`;
  });
  if (configs.length > 10) text += `_...dan ${configs.length - 10} config lainnya_\n`;
  text += `\n📋 Copy config di atas lalu import ke v2ray client.`;

  ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
    ctx.reply(text.replace(/[*`]/g, ''));
  });
});

// /all
bot.command('all', (ctx) => {
  const all = [
    ...activeConfigs.vmess, ...activeConfigs.vless, ...activeConfigs.trojan,
  ];
  if (!all.length) return ctx.reply('❌ Belum ada config aktif. Tunggu auto-refresh atau /refresh');

  let text = `🟢 *Semua Config WS Aktif* (${all.length})\n`;
  text += `VMess: ${activeConfigs.vmess.length} | VLESS: ${activeConfigs.vless.length} | Trojan: ${activeConfigs.trojan.length}\n\n`;

  all.slice(0, 8).forEach((c, i) => {
    text += `*${i + 1}. [${c.type.toUpperCase()}] ${c.country}* \`${c.server}:${c.port}\` ${c.ms}ms\n`;
  });
  if (all.length > 8) text += `\n_...dan ${all.length - 8} config lainnya_\n`;
  text += `\nGunakan /vmess /vless /trojan untuk detail.`;

  ctx.reply(text, { parse_mode: 'Markdown' }).catch(() => {
    ctx.reply(text.replace(/[*`]/g, ''));
  });
});

// Text handler
bot.on('text', (ctx) => {
  const t = ctx.message.text.toLowerCase();
  if (t.includes('halo') || t.includes('hai') || t.includes('hi')) {
    ctx.reply('Halo! 👋 Kirim /vmess /vless /trojan untuk lihat config aktif.');
  } else {
    ctx.reply('Ketik /help untuk melihat perintah yang tersedia.');
  }
});

bot.catch((err) => console.error('[BOT ERROR]', err.message));

// ============================================================
//  START
// ============================================================
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  VPN Config Finder Bot');
  console.log('  by dnsptr77');
  console.log('═══════════════════════════════════════');
  console.log(`  Sources: ${SOURCES.length}`);
  console.log(`  Mode: WebSocket only`);
  console.log(`  Timeout: ${TEST_TIMEOUT / 1000}s`);
  console.log(`  Refresh: every ${REFRESH_INTERVAL / 60000} min`);
  console.log('═══════════════════════════════════════');

  // First refresh
  console.log('\n[INIT] Running initial fetch & test...');
  await refreshConfigs();

  // Start bot
  await bot.launch();
  console.log('\n[BOT] ✅ Telegram bot is running!');
  console.log(`[BOT] Try: https://t.me/${bot.botInfo.username}`);

  // Auto-refresh every 5 min
  setInterval(async () => {
    try {
      await refreshConfigs();
    } catch (e) {
      console.error('[REFRESH ERROR]', e.message);
    }
  }, REFRESH_INTERVAL);

  console.log(`[SCHEDULER] Next refresh in ${REFRESH_INTERVAL / 60000} minutes`);
}

main().catch(err => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
