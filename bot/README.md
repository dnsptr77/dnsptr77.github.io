# 🔍 VPN Config Finder Bot

Telegram Bot yang otomatis mencari config VMess/VLESS/Trojan **WebSocket** aktif.

## Cara Kerja

```
Fetch dari sumber publik
        ↓
Parse semua config (VMess/VLESS/Trojan)
        ↓
Filter HANYA yang mode WebSocket
        ↓
Test koneksi TCP/TLS per config
        ↓
Simpan yang AKTIF saja
        ↓
Auto-refresh setiap 5 menit
```

## Deploy ke Railway (Gratis)

1. Buka [railway.app](https://railway.app)
2. Login dengan GitHub
3. New Project → Deploy from GitHub repo
4. Pilih `dnsptr77/dnsptr77.github.io`
5. Set **Root Directory** → `bot`
6. Tambah Environment Variable:
   - `BOT_TOKEN` = token bot Telegram kamu
7. Deploy!

## Perintah Bot

| Command | Fungsi |
|---------|--------|
| `/start` | Mulai bot |
| `/vmess` | Lihat config VMess WS aktif |
| `/vless` | Lihat config VLESS WS aktif |
| `/trojan` | Lihat config Trojan WS aktif |
| `/all` | Semua config aktif |
| `/status` | Info refresh terakhir |
| `/refresh` | Test ulang sekarang |
| `/help` | Bantuan |
| `/ping` | Cek bot aktif |
