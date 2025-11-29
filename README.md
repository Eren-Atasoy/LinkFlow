# LinkedIn Connect Bot - CRM Dashboard

<div align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" width="80" height="80" />
  <h3>LinkedIn Otomasyon ve CRM Paneli</h3>
  <p>Hedef kitlelere otomatik bağlantı isteği gönderen ve verileri yöneten profesyonel bir araç</p>
</div>

---

## 🚀 Özellikler

- **🤖 Akıllı Otomasyon**: LinkedIn üzerinde hedef kitle aramalarını otomatik gerçekleştirir
- **📊 CRM Dashboard**: Modern ve kullanışlı web arayüzü ile kişileri yönetin
- **📈 İstatistikler**: Gerçek zamanlı istatistik kartları
- **📁 Excel Export**: Tek tıkla tüm verileri Excel'e aktarın
- **📝 Log Paneli**: Bot aktivitelerini canlı olarak izleyin
- **🔒 Güvenli Rate Limiting**: LinkedIn'in bot korumasından kaçınmak için akıllı bekleme süreleri

## 🎯 Hedef Kitle

Bot aşağıdaki unvanlara sahip kişileri arar ve filtreler:

| Kategori | Unvanlar |
|----------|----------|
| C-Level | CEO, CTO, CMO, CFO, COO, CHRO |
| Head of | Head of Engineering, Product, Innovation |
| Director | Director, Senior Director |
| Girişimci | Founder, Co-Founder, Entrepreneur |
| Akademik | Professor, Researcher, Akademisyen |
| Mentor | Mentor, Advisor |

## 🛠️ Teknoloji Yığını

- **Frontend & Backend**: Next.js 14 (App Router), TypeScript
- **Database**: SQLite (Prisma ORM)
- **Otomasyon**: Playwright
- **UI**: Tailwind CSS, Shadcn/UI benzeri bileşenler
- **State Management**: Zustand
- **Excel Export**: ExcelJS

## 📦 Kurulum

### 1. Bağımlılıkları yükleyin

```bash
npm install
```

### 2. Playwright tarayıcılarını yükleyin

```bash
npx playwright install chromium
```

### 3. Veritabanını oluşturun

```bash
npx prisma generate
npx prisma db push
```

### 4. LinkedIn Session Cookie'yi ayarlayın

`.env` dosyasını düzenleyin:

```env
DATABASE_URL="file:./dev.db"
LINKEDIN_SESSION_COOKIE="your_li_at_cookie_here"
BOT_DAILY_LIMIT=25
BOT_MIN_DELAY_SECONDS=120
BOT_MAX_DELAY_SECONDS=300
```

**LinkedIn cookie nasıl alınır:**
1. LinkedIn'e giriş yapın
2. Chrome DevTools açın (F12)
3. Application > Cookies > linkedin.com
4. `li_at` değerini kopyalayın

### 5. Uygulamayı başlatın

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🎮 Kullanım

### Web Arayüzü

1. **Dashboard**: Tüm kişileri görüntüleyin, filtreleyin ve arayın
2. **Bot Kontrolleri**: Botu başlatın/durdurun, arama anahtar kelimesi belirleyin
3. **Excel Export**: "Excel İndir" butonuyla verileri dışa aktarın
4. **Log Paneli**: Bot aktivitelerini gerçek zamanlı izleyin

### Bot'u Manuel Çalıştırma

```bash
npm run bot:start
```

## ⚠️ Önemli Güvenlik Notları

1. **Rate Limiting**: Bot, LinkedIn'in bot korumasından kaçınmak için:
   - Her işlem arasında 2-5 dakika bekler
   - Günlük maksimum 25-30 istek gönderir
   - İnsan benzeri rastgele gecikmeler kullanır

2. **LinkedIn Politikaları**: Bu aracı kullanırken LinkedIn kullanım şartlarına uygun davranın

3. **Session Cookie**: Cookie'niz gizli kalmalı, asla paylaşmayın

## 📁 Proje Yapısı

```
linkedin_connect_bot/
├── prisma/
│   └── schema.prisma        # Veritabanı şeması
├── src/
│   ├── app/
│   │   ├── api/             # API route'ları
│   │   │   ├── bot/         # Bot kontrol API'ları
│   │   │   ├── contacts/    # Kişi CRUD API'ları
│   │   │   └── export/      # Excel export API
│   │   ├── globals.css      # Global stiller
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Ana sayfa
│   ├── bot/
│   │   └── linkedin-bot.ts  # Playwright bot mantığı
│   ├── components/
│   │   ├── ui/              # UI bileşenleri
│   │   ├── dashboard.tsx    # Ana dashboard
│   │   ├── contacts-table.tsx
│   │   ├── log-panel.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts        # Prisma client
│   │   └── utils.ts         # Yardımcı fonksiyonlar
│   └── store/
│       └── bot-store.ts     # Zustand store
├── .env                     # Environment değişkenleri
├── package.json
└── README.md
```

## 📊 Veritabanı Şeması

### LinkedInContact

| Alan | Tip | Açıklama |
|------|-----|----------|
| id | String | Primary key |
| firstName | String | İsim |
| lastName | String | Soyisim |
| title | String | Meslek/Ünvan |
| company | String? | Çalıştığı kurum |
| education | String? | Eğitim bilgisi |
| linkedinUrl | String | LinkedIn profil URL'i (unique) |
| status | Enum | PENDING, SENT, CONNECTED, REJECTED |
| targetCategory | Enum | CEO, CTO, CMO, ... |
| extraNotes | String? | Kullanıcı notları |
| createdAt | DateTime | Oluşturulma tarihi |

## 🔧 Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build
npm run start

# Veritabanı
npm run db:generate    # Prisma client oluştur
npm run db:push        # Şemayı veritabanına uygula
npm run db:studio      # Prisma Studio aç

# Bot
npm run bot:start      # Bot'u manuel başlat
```

## 📝 Lisans

MIT License

## ⚠️ Sorumluluk Reddi

Bu araç yalnızca eğitim amaçlıdır. LinkedIn'in kullanım koşullarını ihlal etmek kullanıcının sorumluluğundadır. Otomasyon araçlarının aşırı veya kötüye kullanımı hesap askıya alınmasına neden olabilir.

