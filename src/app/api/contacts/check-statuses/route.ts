import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { chromium } from 'playwright'

export async function POST() {
  let browser = null
  let updatedCount = 0
  
  try {
    await prisma.botLog.create({
      data: { type: 'INFO', message: '🔍 LinkedIn profil statusleri kontrol ediliyor...' },
    })

    // Sadece PENDING statusundeki kişileri kontrol et
    const pendingContacts = await prisma.linkedInContact.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    })

    if (pendingContacts.length === 0) {
      await prisma.botLog.create({
        data: { type: 'INFO', message: 'Kontrol edilecek PENDING profil bulunamadı' },
      })
      return NextResponse.json({ success: true, updated: 0, message: 'Kontrol edilecek profil yok' })
    }

    await prisma.botLog.create({
      data: { type: 'INFO', message: `${pendingContacts.length} profil kontrol edilecek...` },
    })

    // Browser başlat
    browser = await chromium.launch({
      headless: false,
      args: ['--disable-blink-features=AutomationControlled'],
    })

    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })

    const page = await context.newPage()

    // LinkedIn'e git ve manuel giriş bekle
    await page.goto('https://www.linkedin.com/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    })
    
    await page.waitForTimeout(3000)
    
    const currentUrl = page.url()
    if (currentUrl.includes('/login') || currentUrl.includes('/checkpoint')) {
      await prisma.botLog.create({
        data: { type: 'WARNING', message: '⚠️ LinkedIn\'e GİRİŞ YAPIN! 2 dakika bekleniyor...' },
      })
      await page.waitForTimeout(120000)
    }

    // Her profili kontrol et
    for (const contact of pendingContacts) {
      try {
        await page.goto(contact.linkedinUrl, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        })
        await page.waitForTimeout(2000)

        // "Beklemede" durumunu kontrol et
        const pendingLocator = page.getByText('Beklemede', { exact: true })
        const isPending = await pendingLocator.count() > 0

        if (isPending) {
          // Hala beklemede
          await prisma.botLog.create({
            data: { type: 'INFO', message: `⏳ ${contact.firstName} ${contact.lastName} - Hala beklemede` },
          })
          continue
        }

        // "Mesaj Gönder" butonu varsa bağlantı kabul edilmiş
        const messageLocator = page.getByText('Mesaj gönder', { exact: true })
        const isAccepted = await messageLocator.count() > 0

        if (isAccepted) {
          await prisma.linkedInContact.update({
            where: { id: contact.id },
            data: { status: 'ACCEPTED' },
          })
          updatedCount++
          await prisma.botLog.create({
            data: { type: 'SUCCESS', message: `✅ ${contact.firstName} ${contact.lastName} - Bağlantı kabul edildi!` },
          })
          continue
        }

        // "Bağlantı kur" butonu varsa reddedilmiş veya geri çekilmiş
        const connectLocator = page.getByText('Bağlantı kur', { exact: true })
        const isRejected = await connectLocator.count() > 0

        if (isRejected) {
          await prisma.linkedInContact.update({
            where: { id: contact.id },
            data: { status: 'REJECTED' },
          })
          updatedCount++
          await prisma.botLog.create({
            data: { type: 'WARNING', message: `❌ ${contact.firstName} ${contact.lastName} - Bağlantı reddedildi` },
          })
        }

        // Her profil arasında rastgele bekle
        await page.waitForTimeout(Math.random() * 3000 + 2000)
        
      } catch (profileError) {
        await prisma.botLog.create({
          data: { type: 'WARNING', message: `Profil kontrol hatası: ${contact.linkedinUrl}` },
        })
      }
    }

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: `✅ Kontrol tamamlandı! ${updatedCount} profil güncellendi` },
    })

    return NextResponse.json({ 
      success: true, 
      updated: updatedCount,
      total: pendingContacts.length 
    })

  } catch (error: any) {
    console.error('Status Check Error:', error)
    await prisma.botLog.create({
      data: { type: 'ERROR', message: `Status kontrol hatası: ${error.message}` },
    })
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

