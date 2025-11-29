/**
 * LinkedIn Connect Bot
 * 
 * Bu bot LinkedIn üzerinde hedef kitle aramalarını gerçekleştirir,
 * profil bilgilerini toplar ve bağlantı istekleri gönderir.
 * 
 * Güvenlik Önlemleri:
 * - Random delay (2-5 dakika arası)
 * - Günlük maksimum istek limiti (25-30)
 * - İnsan benzeri davranış simülasyonu
 * - Session cookie yönetimi
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright'
import { PrismaClient } from '@prisma/client'

// Type tanımları
type TargetCategory = 'CEO' | 'CTO' | 'CMO' | 'CFO' | 'COO' | 'CHRO' | 'OTHER_CLEVEL' | 'HEAD_OF' | 'DIRECTOR' | 'MENTOR' | 'ENTREPRENEUR' | 'ACADEMIC' | 'OTHER'
type ConnectionStatus = 'PENDING' | 'SENT' | 'CONNECTED' | 'REJECTED' | 'WITHDRAWN'
// Utils fonksiyonları
function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const prisma = new PrismaClient()

// Bot yapılandırması
interface BotConfig {
  dailyLimit: number
  minDelaySeconds: number
  maxDelaySeconds: number
  searchKeywords: string[]
  linkedinSessionCookie: string
}

// Hedef kitle anahtar kelimeleri ve kategorileri
const TARGET_KEYWORDS: Record<string, TargetCategory> = {
  'CEO': 'CEO',
  'Chief Executive Officer': 'CEO',
  'Genel Müdür': 'CEO',
  'CTO': 'CTO',
  'Chief Technology Officer': 'CTO',
  'CMO': 'CMO',
  'Chief Marketing Officer': 'CMO',
  'CFO': 'CFO',
  'Chief Financial Officer': 'CFO',
  'COO': 'COO',
  'Chief Operating Officer': 'COO',
  'CHRO': 'CHRO',
  'Chief Human Resources Officer': 'CHRO',
  'Head of Engineering': 'HEAD_OF',
  'Head of Product': 'HEAD_OF',
  'Head of Innovation': 'HEAD_OF',
  'VP of Engineering': 'HEAD_OF',
  'Director': 'DIRECTOR',
  'Senior Director': 'DIRECTOR',
  'Direktör': 'DIRECTOR',
  'Mentor': 'MENTOR',
  'Founder': 'ENTREPRENEUR',
  'Co-Founder': 'ENTREPRENEUR',
  'Kurucusu': 'ENTREPRENEUR',
  'Girişimci': 'ENTREPRENEUR',
  'Entrepreneur': 'ENTREPRENEUR',
  'Startup': 'ENTREPRENEUR',
  'Professor': 'ACADEMIC',
  'Profesör': 'ACADEMIC',
  'Araştırmacı': 'ACADEMIC',
  'Researcher': 'ACADEMIC',
  'Akademisyen': 'ACADEMIC',
}

class LinkedInBot {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private page: Page | null = null
  private config: BotConfig
  private todayCount: number = 0
  private isRunning: boolean = false

  constructor(config: BotConfig) {
    this.config = config
  }

  // Bot'u başlat
  async start(): Promise<void> {
    if (this.isRunning) {
      await this.log('WARNING', 'Bot zaten çalışıyor')
      return
    }

    this.isRunning = true
    await this.log('INFO', 'Bot başlatılıyor...')

    try {
      // Tarayıcıyı başlat (görünür mod - LinkedIn bot korumasından kaçınmak için)
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--disable-dev-shm-usage',
        ],
      })

      // Context oluştur (cookies ile)
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'tr-TR',
        timezoneId: 'Europe/Istanbul',
      })

      // LinkedIn session cookie'yi ekle
      await this.context.addCookies([
        {
          name: 'li_at',
          value: this.config.linkedinSessionCookie,
          domain: '.linkedin.com',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ])

      this.page = await this.context.newPage()

      // Bot detection'ı atlatmak için ekstra önlemler
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
      })

      await this.log('SUCCESS', 'Tarayıcı başlatıldı')

      // Ana işlem döngüsü
      await this.mainLoop()
    } catch (error) {
      await this.log('ERROR', `Bot hatası: ${error}`)
    } finally {
      await this.stop()
    }
  }

  // Ana işlem döngüsü
  private async mainLoop(): Promise<void> {
    for (const keyword of this.config.searchKeywords) {
      if (!this.isRunning) break

      // Veritabanından durumu kontrol et (durdurma sinyali için)
      const dbConfig = await prisma.botConfig.findUnique({
        where: { id: 'default' },
      })
      if (!dbConfig?.isRunning) {
        await this.log('INFO', 'Durdurma sinyali alındı (veritabanı)')
        this.isRunning = false
        break
      }

      // Günlük limit kontrolü
      if (this.todayCount >= this.config.dailyLimit) {
        await this.log('WARNING', `Günlük limit doldu (${this.config.dailyLimit}). Bot durduruluyor.`)
        break
      }

      await this.log('INFO', `"${keyword}" için arama yapılıyor...`)

      try {
        await this.searchAndConnect(keyword)
      } catch (error) {
        await this.log('ERROR', `Arama hatası (${keyword}): ${error}`)
      }

      // Aramalar arası random bekleme
      const delay = getRandomDelay(
        this.config.minDelaySeconds,
        this.config.maxDelaySeconds
      )
      await this.log('INFO', `Sonraki arama için ${Math.round(delay / 1000)} saniye bekleniyor...`)
      await sleep(delay)
    }
  }

  // Arama yap ve bağlantı gönder
  private async searchAndConnect(keyword: string): Promise<void> {
    if (!this.page) return

    // LinkedIn arama sayfasına git
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keyword)}&origin=GLOBAL_SEARCH_HEADER`
    
    await this.page.goto(searchUrl, { waitUntil: 'networkidle' })
    await this.randomDelay(2000, 5000) // Sayfa yüklenmesi için bekle

    // Sonuçları kontrol et
    const results = await this.page.$$('.reusable-search__result-container')
    await this.log('INFO', `${results.length} sonuç bulundu`)

    for (let i = 0; i < Math.min(results.length, 5); i++) {
      if (!this.isRunning) break
      if (this.todayCount >= this.config.dailyLimit) break

      try {
        const result = results[i]
        
        // Profil bilgilerini al
        const profileData = await this.extractProfileData(result)
        
        if (!profileData) continue

        // Daha önce kayıtlı mı kontrol et
        const existing = await prisma.linkedInContact.findUnique({
          where: { linkedinUrl: profileData.linkedinUrl },
        })

        if (existing) {
          await this.log('INFO', `${profileData.firstName} ${profileData.lastName} zaten kayıtlı, atlanıyor...`)
          continue
        }

        // Kategorisi belirle
        const category = this.determineCategory(profileData.title)

        // Veritabanına kaydet
        await prisma.linkedInContact.create({
          data: {
            ...profileData,
            targetCategory: category,
            status: 'PENDING',
          },
        })

        await this.log('SUCCESS', `${profileData.firstName} ${profileData.lastName} kaydedildi`)

        // Bağlantı isteği gönder
        await this.sendConnectionRequest(result, profileData)

        // İşlemler arası random bekleme
        await this.randomDelay(
          this.config.minDelaySeconds * 1000,
          this.config.maxDelaySeconds * 1000
        )
      } catch (error) {
        await this.log('ERROR', `Profil işleme hatası: ${error}`)
      }
    }
  }

  // Profil verilerini çıkar
  private async extractProfileData(result: any): Promise<{
    firstName: string
    lastName: string
    title: string
    company: string | null
    education: string | null
    linkedinUrl: string
    location: string | null
  } | null> {
    try {
      // İsim
      const nameElement = await result.$('.entity-result__title-text a span[aria-hidden="true"]')
      const fullName = nameElement ? await nameElement.textContent() : null
      
      if (!fullName) return null

      const [firstName, ...lastNameParts] = fullName.trim().split(' ')
      const lastName = lastNameParts.join(' ') || ''

      // Ünvan
      const titleElement = await result.$('.entity-result__primary-subtitle')
      const title = titleElement ? await titleElement.textContent() : ''

      // LinkedIn URL
      const linkElement = await result.$('.entity-result__title-text a')
      const href = linkElement ? await linkElement.getAttribute('href') : null
      
      if (!href) return null

      // URL'yi temizle
      const linkedinUrl = href.split('?')[0]

      // Konum
      const locationElement = await result.$('.entity-result__secondary-subtitle')
      const location = locationElement ? await locationElement.textContent() : null

      return {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        title: (title || '').trim(),
        company: null, // Detaylı bilgi için profil sayfasına gitmek gerekir
        education: null,
        linkedinUrl: `https://www.linkedin.com${linkedinUrl}`,
        location: location?.trim() || null,
      }
    } catch (error) {
      console.error('Profile extraction error:', error)
      return null
    }
  }

  // Kategori belirle
  private determineCategory(title: string): TargetCategory {
    const titleLower = title.toLowerCase()
    
    for (const [keyword, category] of Object.entries(TARGET_KEYWORDS)) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return category
      }
    }
    
    return 'OTHER'
  }

  // Bağlantı isteği gönder
  private async sendConnectionRequest(result: any, profileData: any): Promise<void> {
    try {
      // Connect/Bağlan butonunu bul
      const connectButton = await result.$('button:has-text("Connect"), button:has-text("Bağlan")')
      
      if (!connectButton) {
        await this.log('INFO', `${profileData.firstName} için bağlantı butonu bulunamadı (belki zaten bağlı)`)
        return
      }

      // Butona tıkla
      await connectButton.click()
      await this.randomDelay(1000, 2000)

      // Modal'da "Send without a note" butonuna tıkla
      const sendButton = await this.page?.$('button:has-text("Send without a note"), button:has-text("Not eklemeden gönder")')
      
      if (sendButton) {
        await sendButton.click()
        await this.randomDelay(1000, 2000)

        // Veritabanını güncelle
        await prisma.linkedInContact.update({
          where: { linkedinUrl: profileData.linkedinUrl },
          data: {
            status: 'SENT',
            connectionSentAt: new Date(),
          },
        })

        this.todayCount++

        // Bot config'i güncelle
        await prisma.botConfig.update({
          where: { id: 'default' },
          data: { todayConnectionCount: this.todayCount },
        })

        await this.log('SUCCESS', `${profileData.firstName} ${profileData.lastName}'a bağlantı isteği gönderildi (Bugün: ${this.todayCount}/${this.config.dailyLimit})`)
      } else {
        // Modal'ı kapat
        const closeButton = await this.page?.$('button[aria-label="Dismiss"]')
        if (closeButton) await closeButton.click()
        
        await this.log('WARNING', `${profileData.firstName} için istek gönderilemedi`)
      }
    } catch (error) {
      await this.log('ERROR', `Bağlantı isteği hatası: ${error}`)
    }
  }

  // Random bekleme (insan davranışı simülasyonu)
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min)
    await sleep(delay)
  }

  // Log kaydet
  private async log(type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION', message: string): Promise<void> {
    console.log(`[${type}] ${message}`)
    
    try {
      await prisma.botLog.create({
        data: { type, message },
      })
    } catch (error) {
      console.error('Log kayıt hatası:', error)
    }
  }

  // Bot'u durdur
  async stop(): Promise<void> {
    this.isRunning = false
    
    await this.log('INFO', 'Bot durduruluyor...')

    if (this.page) await this.page.close()
    if (this.context) await this.context.close()
    if (this.browser) await this.browser.close()

    await prisma.botConfig.update({
      where: { id: 'default' },
      data: { isRunning: false },
    })

    await this.log('INFO', 'Bot durduruldu')
  }
}


// CLI'dan çalıştırma
async function main() {
  // Bot config'i veritabanından al
  let config = await prisma.botConfig.findUnique({
    where: { id: 'default' },
  })

  if (!config) {
    config = await prisma.botConfig.create({
      data: {
        id: 'default',
        dailyLimit: parseInt(process.env.BOT_DAILY_LIMIT || '25'),
        minDelaySeconds: parseInt(process.env.BOT_MIN_DELAY_SECONDS || '120'),
        maxDelaySeconds: parseInt(process.env.BOT_MAX_DELAY_SECONDS || '300'),
        searchKeywords: 'CEO,CTO,CMO,CFO,Director',
      },
    })
  }

  const sessionCookie = config.linkedinSessionCookie || process.env.LINKEDIN_SESSION_COOKIE

  // Cookie yoksa hata ver
  if (!sessionCookie || sessionCookie.trim() === '') {
    console.log('[ERROR] LinkedIn cookie bulunamadı - Lütfen Ayarlar sayfasından ekleyin')
    await prisma.botLog.create({
      data: { type: 'ERROR', message: 'LinkedIn cookie bulunamadı. Lütfen Ayarlar sayfasından ekleyin.' },
    })
    await prisma.botConfig.update({
      where: { id: 'default' },
      data: { isRunning: false },
    })
    return
  }

  const bot = new LinkedInBot({
    dailyLimit: config.dailyLimit,
    minDelaySeconds: config.minDelaySeconds,
    maxDelaySeconds: config.maxDelaySeconds,
    searchKeywords: config.searchKeywords.split(',').map(k => k.trim()),
    linkedinSessionCookie: sessionCookie,
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nDurdurma sinyali alındı...')
    await bot.stop()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await bot.stop()
    process.exit(0)
  })

  await bot.start()
}

// Modül olarak export et
export { LinkedInBot }

// Doğrudan çalıştırıldığında
main().catch(console.error)

