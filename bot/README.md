# dnsptr77 Telegram Bot

Bot Telegram yang dijalankan 24/7 gratis menggunakan Railway.

## Deploy to Railway (Gratis)

1. Buka [railway.app](https://railway.app)
2. Login dengan GitHub
3. Klik **New Project** → **Deploy from GitHub repo**
4. Pilih repo `dnsptr77/dnsptr77.github.io`
5. Set **Root Directory** ke `bot`
6. Tambahkan Environment Variable:
   - `BOT_TOKEN` = `8919263361:AAGs6V3fIF32SVyvZulmQlx3z3n1BgyLMZ0`
7. Klik **Deploy**

Bot akan jalan 24/7 secara gratis (500 jam/bulan).

## Local Development

```bash
cd bot
npm install
npm start
```

## Commands

- `/start` — Mulai bot
- `/help` — Lihat semua perintah
- `/ping` — Cek status
- `/echo [teks]` — Ulangi teks
- `/joke` — Cerita lucu
- `/time` — Waktu sekarang
- `/stats` — Statistik

## Tech Stack

- Node.js 20
- Telegraf.js v4
- Railway (hosting)
