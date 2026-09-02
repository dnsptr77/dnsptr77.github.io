const { Telegraf } = require('telegraf');

// ========================================
//  dnsptr77 Telegram Bot
// ========================================

const BOT_TOKEN = process.env.BOT_TOKEN || '8919263361:AAGs6V3fIF32SVyvZulmQlx3z3n1BgyLMZ0';
const bot = new Telegraf(BOT_TOKEN);

// Store user data
const userData = new Map();

// ========== /start ==========
bot.start((ctx) => {
  const user = ctx.from;
  const name = user.first_name || 'User';

  // Save user data
  userData.set(user.id, {
    id: user.id,
    name: name,
    username: user.username || 'N/A',
    startedAt: new Date().toISOString(),
    commands: 0,
  });

  console.log(`[NEW USER] ${name} (@${user.username}) started the bot`);

  ctx.reply(
    `👋 *Halo ${escapeMarkdown(name)}!*\n\n` +
    `Selamat datang di bot saya! 🎉\n\n` +
    `Saya adalah bot Telegram yang dibuat oleh *dnsptr77*.\n\n` +
    `📋 *Yang bisa saya lakukan:*\n` +
    `• /help — Lihat semua perintah\n` +
    `• /info — Info tentang bot ini\n` +
    `• /ping — Cek bot aktif\n` +
    `• /echo [teks] — Ulangi teks\n` +
    `• /joke — Cerita lucu random\n` +
    `• /time — Waktu sekarang\n` +
    `• /stats — Statistik penggunaan\n` +
    `• /source — Kode sumber bot\n\n` +
    `_Ketik /help untuk melihat semua perintah._`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /help ==========
bot.help((ctx) => {
  ctx.reply(
    `📖 *Daftar Perintah*\n\n` +
    `🔹 *Umum*\n` +
    `  /start — Mulai bot\n` +
    `  /help — Tampilkan bantuan\n` +
    `  /info — Info tentang bot\n` +
    `  /ping — Cek status bot\n` +
    `  /source — Lihat kode sumber\n\n` +
    `🔹 *Fun*\n` +
    `  /echo [teks] — Ulangi teks\n` +
    `  /joke — Cerita lucu\n` +
    `  /coin — Lempar koin\n` +
    `  /dice — Lempar dadu\n\n` +
    `🔹 *Utility*\n` +
    `  /time — Waktu sekarang\n` +
    `  /stats — Statistik penggunaan\n` +
    `  /id — User ID kamu\n` +
    `  /ping — Response time\n\n` +
    `Dibuat dengan ❤️ oleh *dnsptr77*`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /ping ==========
bot.command('ping', (ctx) => {
  const start = Date.now();
  const sent = ctx.reply('🏓 Pong!');

  sent.then((msg) => {
    const ms = Date.now() - start;
    ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      undefined,
      `🏓 Pong! (${ms}ms)`
    );
  });
});

// ========== /info ==========
bot.command('info', (ctx) => {
  ctx.reply(
    `ℹ️ *Bot Info*\n\n` +
    `• *Name:* dnsptr77 Bot\n` +
    `• *Version:* 1.0.0\n` +
    `• *Platform:* Telegram Bot API\n` +
    `• *Framework:* Telegraf.js\n` +
    `• *Runtime:* Node.js\n` +
    `• *Hosted:* Railway (Free Tier)\n` +
    `• *Source:* github.com/dnsptr77\n\n` +
    `_Bot ini dijalankan 24/7 secara gratis._`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /echo ==========
bot.command('echo', (ctx) => {
  const text = ctx.message.text.replace('/echo', '').trim();
  if (!text) {
    return ctx.reply('❌ Gunakan: /echo [teks yang mau diulang]');
  }
  ctx.reply(`🔊 ${text}`);
});

// ========== /joke ==========
const jokes = [
  'Kenapa programmer suka kopi? Karena dia butuh *Java*! ☕',
  'Apa bedanya bug dan feature? Satu karakter 👾',
  'Kenapa 6 takut sama 7? Karena 7 8 9! 😂',
  'Apa singkatan dari RTL? *Reply To Link* 🤣',
  'Programmer itu seperti pesulap. Dia bisa bikin bug dari一行代码! 🧙',
  'Kenapa coding di malam hari? Karena bug lebih aktif malam-malam 🌙',
  'Q: Apa yang dilakukan coding saat sakit? A: Install *patch* 💊',
];

bot.command('joke', (ctx) => {
  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  ctx.reply(`😂 ${joke}`, { parse_mode: 'Markdown' });
});

// ========== /coin ==========
bot.command('coin', (ctx) => {
  const result = Math.random() > 0.5 ? '🪳 Heads (Angka)' : '🪳 Tails (Gambar)';
  ctx.reply(`🪙 Melempar koin...\n\n*${result}*`, { parse_mode: 'Markdown' });
});

// ========== /dice ==========
bot.command('dice', (ctx) => {
  const result = Math.floor(Math.random() * 6) + 1;
  const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][result - 1];
  ctx.reply(`🎲 *${dice}* — Angka: ${result}`, { parse_mode: 'Markdown' });
});

// ========== /time ==========
bot.command('time', (ctx) => {
  const now = new Date();
  ctx.reply(
    `🕐 *Waktu Sekarang*\n\n` +
    `• UTC: ${now.toUTCString()}\n` +
    `• WIB: ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n` +
    `• Timestamp: ${now.getTime()}`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /stats ==========
bot.command('stats', (ctx) => {
  const user = userData.get(ctx.from.id);
  ctx.reply(
    `📊 *Statistik Kamu*\n\n` +
    `• *User ID:* ${ctx.from.id}\n` +
    `• *Nama:* ${ctx.from.first_name}\n` +
    `• *Username:* @${ctx.from.username || 'N/A'}\n` +
    `• *Total Users:* ${userData.size}\n` +
    `• *Pertama kali:* ${user?.startedAt ? new Date(user.startedAt).toLocaleDateString('id-ID') : 'N/A'}`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /id ==========
bot.command('id', (ctx) => {
  ctx.reply(
    `🆔 *User Info*\n\n` +
    `• *User ID:* \`${ctx.from.id}\`\n` +
    `• *Chat ID:* \`${ctx.chat.id}\`\n` +
    `• *Chat Type:* ${ctx.chat.type}`,
    { parse_mode: 'Markdown' }
  );
});

// ========== /source ==========
bot.command('source', (ctx) => {
  ctx.reply(
    `💻 *Kode Sumber Bot*\n\n` +
    `Bot ini dibuat dengan:\n` +
    `• Framework: Telegraf.js v4\n` +
    `• Runtime: Node.js 20\n` +
    `• Hosted: Railway (Free Tier)\n` +
    `• Panel: dnsptr77.github.io\n\n` +
    `🔗 *Source Code:*\n` +
    `github.com/dnsptr77/dnsptr77.github.io/tree/main/bot`,
    { parse_mode: 'Markdown' }
  );
});

// ========== Text message handler ==========
bot.on('text', (ctx) => {
  const text = ctx.message.text;

  // Ignore commands (already handled above)
  if (text.startsWith('/')) return;

  // Simple chat response
  const lower = text.toLowerCase();
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('hi') || lower.includes('hello')) {
    ctx.reply(`Halo ${ctx.from.first_name}! 👋 Ada yang bisa saya bantu?`);
  } else if (lower.includes('terima kasih') || lower.includes('thanks') || lower.includes('makasih')) {
    ctx.reply('Sama-sama! 😊 Senang bisa membantu.');
  } else {
    ctx.reply(
      `🤔 Saya menerima pesanmu: "${text}"\n\n` +
      `Ketik /help untuk melihat semua perintah yang tersedia.`
    );
  }
});

// ========== Error handler ==========
bot.catch((err, ctx) => {
  console.error(`[ERROR] ${ctx.updateType}:`, err.message);
  ctx.reply('❌ Terjadi error! Silakan coba lagi.');
});

// ========== Start bot ==========
console.log('═══════════════════════════════════════');
console.log('  dnsptr77 Telegram Bot');
console.log('═══════════════════════════════════════');
console.log(`  Token: ${BOT_TOKEN.substring(0, 10)}...`);
console.log(`  Time:  ${new Date().toISOString()}`);
console.log('═══════════════════════════════════════');

bot.launch().then(() => {
  console.log('✅ Bot is running! Listening for updates...');
  console.log('   Try: https://t.me/' + bot.botInfo.username);
}).catch((err) => {
  console.error('❌ Failed to start bot:', err.message);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// ========== Helpers ==========
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
