import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chromium } from 'playwright'

async function runLinkedInBot(sessionCookie: string, keywords: string[]) {
  console.log('[BOT] LinkedIn bot başlatılıyor...')
  
  let browser = null
  let context = null
  let page = null
  let todayCount = 0
  
  try {
    browser = await chromium.launch({
      headless: false,
      slowMo: 100,
      args: ['--start-maximized', '--disable-blink-features=AutomationControlled'],
    })

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: 'Tarayıcı başlatıldı' },
    })

    context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })

    page = await context.newPage()

    await prisma.botLog.create({
      data: { type: 'INFO', message: 'LinkedIn\'e bağlanılıyor...' },
    })

    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 })
    
    if (sessionCookie && sessionCookie.length > 10) {
      await context.addCookies([{
        name: 'li_at',
        value: sessionCookie,
        domain: '.linkedin.com',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'None'
      }])
    }
    
    await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
      await prisma.botLog.create({
        data: { type: 'WARNING', message: '⚠️ Açılan tarayıcıda LinkedIn\'e GİRİŞ YAPIN! 2 dakika bekleniyor...' },
      })
      await page.waitForTimeout(120000)
    }
    
    const feedUrl = page.url()
    if (!feedUrl.includes('/feed') && !feedUrl.includes('/mynetwork') && !feedUrl.includes('/search')) {
      throw new Error('LinkedIn girişi başarısız')
    }

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: '✅ LinkedIn girişi başarılı!' },
    })

    const config = await prisma.botConfig.findUnique({ where: { id: 'default' } })
    todayCount = config?.todayConnectionCount || 0
    const dailyLimit = config?.dailyLimit || 20

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: 'Arama başlatılıyor...' },
    })

    for (const keyword of keywords) {
      const currentConfig = await prisma.botConfig.findUnique({ where: { id: 'default' } })
      if (!currentConfig?.isRunning) break
      if (todayCount >= dailyLimit) break

      await prisma.botLog.create({
        data: { type: 'INFO', message: `"${keyword}" için arama yapılıyor...` },
      })

      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keyword)}&origin=CLUSTER_EXPANSION`
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForTimeout(2000)

      await prisma.botLog.create({
        data: { type: 'SUCCESS', message: 'Arama sayfası yüklendi' },
      })

      let totalClickedCount = 0
      
      // Config'den ayarları al (güvenli fallback) - currentConfig zaten yukarıda tanımlı
      const maxConnectionsPerSearch = (currentConfig && 'maxConnectionsPerSearch' in currentConfig) 
        ? (currentConfig.maxConnectionsPerSearch || 3)
        : 3
      const maxPagesPerSearch = (currentConfig && 'maxPagesPerSearch' in currentConfig)
        ? (currentConfig.maxPagesPerSearch || 5)
        : 5
      
      await prisma.botLog.create({
        data: { type: 'INFO', message: `⚙️ Bot ayarları: ${maxConnectionsPerSearch} kişi/sayfa, ${maxPagesPerSearch} sayfa limiti` },
      })
      
      let currentPage = 1

      // Sayfalarda döngü - kullanıcının belirlediği limitlere göre
      while (currentPage <= maxPagesPerSearch && totalClickedCount < maxConnectionsPerSearch) {
        await prisma.botLog.create({
          data: { type: 'INFO', message: `📄 Sayfa ${currentPage} kontrol ediliyor...` },
        })

        let pageClickedCount = 0
        
      // Gerçek bilgileri alarak "Bağlantı kur" butonunu bul ve tıkla
      for (let attempt = 0; attempt < 10 && pageClickedCount < maxConnectionsPerSearch; attempt++) {
        const currentConfig2 = await prisma.botConfig.findUnique({ where: { id: 'default' } })
        if (!currentConfig2?.isRunning) break

        try {
          // Text bazlı yaklaşım - daha güvenilir
          const connectLocator = page.getByText('Bağlantı kur', { exact: true })
          const connectCount = await connectLocator.count()
          
          if (connectCount === 0) {
            await prisma.botLog.create({
              data: { type: 'INFO', message: `"Bağlantı kur" butonu bulunamadı, sayfa kaydırılıyor...` },
            })
            await page.evaluate(() => window.scrollBy(0, 500))
            await page.waitForTimeout(1000)
            continue
          }
          
          await prisma.botLog.create({
            data: { type: 'SUCCESS', message: `✅ ${connectCount} "Bağlantı kur" butonu bulundu!` },
          })
          
          let processed = false
          
           // İlk görünür butonu bul ve işle
           try {
             const firstButton = connectLocator.first()
             const isButtonVisible = await firstButton.isVisible().catch(() => false)
             
             if (!isButtonVisible) {
               await prisma.botLog.create({
                 data: { type: 'INFO', message: `Buton görünür değil, sayfa kaydırılıyor...` },
               })
               await page.evaluate(() => window.scrollBy(0, 500))
               await page.waitForTimeout(1000)
               continue
             }

             // ÖNCELİKLE kişi bilgilerini çek (buton tıklanmadan önce)
             let firstName = 'LinkedIn'
             let lastName = 'User'
             let title = 'Professional'
             let company = ''
             let linkedinUrl = ''
             let location = ''

             try {
               // Butonun parent kartını bul ve bilgileri çek
               const cardInfo = await firstButton.evaluate((btn) => {
                 // Parent'a doğru çık, listitem bul
                 let el: HTMLElement | null = btn as HTMLElement
                 let card: HTMLElement | null = null
                 
                 for (let i = 0; i < 20; i++) {
                   if (!el.parentElement) break
                   el = el.parentElement
                   if (el.getAttribute('role') === 'listitem') {
                     card = el
                     break
                   }
                 }
                 
                 if (!card) return null
                 
                 // İsim linki
                 const nameLink = card.querySelector('a[data-view-name="search-result-lockup-title"]') as HTMLAnchorElement
                 const name = nameLink?.textContent?.trim() || ''
                 const url = nameLink?.href || ''
                 
                 // P tag'leri - title, location ve company
                 const pTags = card.querySelectorAll('p')
                 let titleText = ''
                 let locationText = ''
                 let companyText = ''
                 
                 pTags.forEach((p, idx) => {
                   const text = p.textContent?.trim() || ''
                   
                   // Unvan (genelde 2. p tag)
                   if (idx === 1 && text && !text.includes('•')) {
                     titleText = text
                   }
                   
                   // Lokasyon (genelde 3. p tag)
                   if (idx === 2 && text && !text.includes('ortak') && !text.includes('Mevcut')) {
                     locationText = text
                   }
                   
                   // Şirket bilgisi ("Mevcut: X şirketinde" formatı)
                   if (text.includes('Mevcut:')) {
                     // "Mevcut: SolyTicket şirketinde Co-Founder & CTO" -> "SolyTicket"
                     const match = text.match(/Mevcut:\s*(.+?)\s+şirketinde/)
                     if (match && match[1]) {
                       companyText = match[1].trim()
                     }
                   }
                 })
                 
                 return { name, url, title: titleText, location: locationText, company: companyText }
               })

               if (cardInfo) {
                 if (cardInfo.name) {
                   const nameParts = cardInfo.name.split(' ')
                   firstName = nameParts[0] || 'LinkedIn'
                   lastName = nameParts.slice(1).join(' ') || 'User'
                 }
                 if (cardInfo.url) {
                   linkedinUrl = cardInfo.url.split('?')[0]
                 }
                 if (cardInfo.title) {
                   title = cardInfo.title
                 }
                 if (cardInfo.location) {
                   location = cardInfo.location
                 }
                 if (cardInfo.company) {
                   company = cardInfo.company
                 }
               }

               await prisma.botLog.create({
                 data: { type: 'INFO', message: `👤 Bulundu: ${firstName} ${lastName} - ${title}` },
               })
             } catch (infoErr) {
               await prisma.botLog.create({
                 data: { type: 'WARNING', message: `Kişi bilgisi alınamadı: ${infoErr}` },
               })
             }

             // Daha önce eklenmiş mi kontrol et
             if (linkedinUrl) {
               const existing = await prisma.linkedInContact.findFirst({
                 where: { linkedinUrl: { contains: linkedinUrl.split('/in/')[1]?.split('/')[0] || linkedinUrl } },
               })
               if (existing) {
                 await prisma.botLog.create({
                   data: { type: 'INFO', message: `⏭️ ${firstName} ${lastName} zaten kayıtlı, atlıyor...` },
                 })
                 // Bu butonu atla, scroll yap
                 await page.evaluate(() => window.scrollBy(0, 200))
                 await page.waitForTimeout(500)
                 continue
               }
             }
              
             // Butona tıkla
             await firstButton.click({ force: true })
             await page.waitForTimeout(2000)
             
             await prisma.botLog.create({
               data: { type: 'INFO', message: `"Bağlantı Kur" butonuna tıklandı` },
             })
             
             // Modal'da "Not olmadan gönderin"
             let sendLocator = page.getByText('Not olmadan gönderin', { exact: true }).first()
             let sendVisible = await sendLocator.isVisible().catch(() => false)
             
             if (!sendVisible) {
               sendLocator = page.getByText('Send without a note', { exact: true }).first()
               sendVisible = await sendLocator.isVisible().catch(() => false)
             }
             
             if (!sendVisible) {
               sendLocator = page.getByText('Gönder', { exact: true }).first()
               sendVisible = await sendLocator.isVisible().catch(() => false)
             }
             
             if (sendVisible) {
               await sendLocator.click()
               await page.waitForTimeout(1000)

               // Kategori belirle
               let category = 'OTHER'
               const titleLower = title.toLowerCase()
               if (titleLower.includes('ceo') || titleLower.includes('genel müdür')) category = 'CEO'
               else if (titleLower.includes('cto')) category = 'CTO'
               else if (titleLower.includes('cmo')) category = 'CMO'
               else if (titleLower.includes('cfo')) category = 'CFO'
               else if (titleLower.includes('director') || titleLower.includes('direktör')) category = 'DIRECTOR'
               else if (titleLower.includes('manager') || titleLower.includes('müdür')) category = 'MANAGER'
               else if (titleLower.includes('founder') || titleLower.includes('kurucu')) category = 'ENTREPRENEUR'
               else if (titleLower.includes('head')) category = 'HEAD_OF'
               
               // GERÇEK bilgilerle veritabanına kaydet
               await prisma.linkedInContact.create({
                 data: {
                   firstName,
                   lastName,
                   title,
                   company: company || null,
                   location: location || null,
                   linkedinUrl: linkedinUrl || `https://www.linkedin.com/in/user-${Date.now()}`,
                   targetCategory: category,
                   status: 'PENDING',
                   connectionSentAt: new Date(),
                 },
               })
               
               pageClickedCount++
               totalClickedCount++
               todayCount++
               
               await prisma.botLog.create({
                 data: { type: 'SUCCESS', message: `🎉 ${firstName} ${lastName}'a bağlantı gönderildi! (${totalClickedCount}/${maxConnectionsPerSearch})` },
               })
               
               processed = true
             }
             
           } catch (btnErr) {
             await prisma.botLog.create({
               data: { type: 'WARNING', message: `Buton hatası: ${btnErr}` },
             })
           }
           if (!processed) {
             await page.evaluate(() => window.scrollBy(0, 500))
             await page.waitForTimeout(1000)
           } else {
             // Başarılı işlem sonrası bekle
             await page.waitForTimeout(Math.random() * 3000 + 2000)
           }
           
         } catch (err) {
           await prisma.botLog.create({
             data: { type: 'WARNING', message: `Hata: ${err}` },
           })
           await page.waitForTimeout(2000)
         }
       }

       await prisma.botLog.create({
         data: { type: 'INFO', message: `Sayfa ${currentPage}: ${pageClickedCount} kişiye bağlantı isteği gönderildi` },
       })
       
       if (totalClickedCount > 0) {
         await prisma.botConfig.update({
           where: { id: 'default' },
           data: { todayConnectionCount: todayCount },
         })
       }
       
       // 3 kişiye ulaştıysak dur
       if (totalClickedCount >= maxConnectionsPerSearch) {
         await prisma.botLog.create({
           data: { type: 'SUCCESS', message: `🎯 Hedef sayıya ulaşıldı! ${totalClickedCount} kişiye bağlantı gönderildi` },
         })
         break // While loop'tan çık
       }
       
       // Bu sayfada kişi bulunduysa ama 3'e ulaşmadıysak, aynı sayfada devam et
       // (for loop zaten 10 deneme yapıyor, bu sayfada başka kişi var mı kontrol ediyor)
       
       // Eğer bu sayfada hiç kişi bulamadıysak VEYA tüm kişileri işlediyse, sonraki sayfaya geç
       if (pageClickedCount === 0 || (pageClickedCount > 0 && totalClickedCount < maxConnectionsPerSearch)) {
         // Sonraki sayfaya geç
         if (currentPage < maxPagesPerSearch) {
           try {
             const logMsg = pageClickedCount === 0 
               ? `⚠️ Bu sayfada bağlantı kurulacak kişi bulunamadı. Sayfa ${currentPage + 1}'e geçiliyor...`
               : `📄 Bu sayfada ${pageClickedCount} kişi bulundu (toplam: ${totalClickedCount}/${maxConnectionsPerSearch}). Sayfa ${currentPage + 1}'e geçiliyor...`
             
             await prisma.botLog.create({
               data: { type: 'INFO', message: logMsg },
             })
             
             const nextButton = page.getByRole('button', { name: /sonraki|next/i }).first()
             const isNextVisible = await nextButton.isVisible().catch(() => false)
             
             if (isNextVisible) {
               await nextButton.click()
               await page.waitForTimeout(3000)
               
               currentPage++
               
               await prisma.botLog.create({
                 data: { type: 'SUCCESS', message: `✅ Sayfa ${currentPage}'e geçildi, devam ediliyor...` },
               })
             } else {
               await prisma.botLog.create({
                 data: { type: 'WARNING', message: '⚠️ Sonraki sayfa butonu bulunamadı, arama tamamlandı' },
               })
               break // While loop'tan çık
             }
           } catch (pageErr) {
             await prisma.botLog.create({
               data: { type: 'WARNING', message: `Sayfa geçiş hatası: ${pageErr}` },
             })
             break // While loop'tan çık
           }
         } else {
           await prisma.botLog.create({
             data: { type: 'INFO', message: `📋 Maksimum sayfa sayısına ulaşıldı (${maxPagesPerSearch} sayfa)` },
           })
           break
         }
       }
      } // while loop sonu
    }

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: 'Bot işlemi tamamlandı' },
    })

  } catch (error: any) {
    console.error('[BOT] Hata:', error)
    const errorMessage = error?.message || String(error)
    await prisma.botLog.create({
      data: { type: 'ERROR', message: `Bot hatası: ${errorMessage}` },
    })
  } finally {
    await prisma.botConfig.update({
      where: { id: 'default' },
      data: { isRunning: false },
    })

    if (page) await page.close().catch(() => {})
    if (context) await context.close().catch(() => {})
    if (browser) await browser.close().catch(() => {})
    
    console.log('[BOT] Bot durduruldu')
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { keyword, sessionCookie } = body

    const config = await prisma.botConfig.findUnique({
      where: { id: 'default' },
    })

    if (config?.isRunning) {
      return NextResponse.json(
        { success: false, message: 'Bot zaten çalışıyor' },
        { status: 400 }
      )
    }

    let keywords: string[] = []
    if (keyword && keyword.trim()) {
      keywords = [keyword.trim()]
    } else {
      keywords = ['CEO']
    }

    await prisma.botConfig.update({
      where: { id: 'default' },
      data: { isRunning: true },
    })

    runLinkedInBot(sessionCookie || '', keywords).catch((err) => {
      console.error('Bot çalıştırma hatası:', err)
    })

    return NextResponse.json({ success: true, message: 'Bot başlatıldı' })
  } catch (error) {
    console.error('API Hatası:', error)
    return NextResponse.json(
      { success: false, message: 'Bot başlatılamadı' },
      { status: 500 }
    )
  }
}
