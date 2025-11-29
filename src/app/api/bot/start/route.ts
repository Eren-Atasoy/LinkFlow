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

      let clickedCount = 0
      const maxConnectionsPerSearch = 3

      // Gerçek bilgileri alarak "Bağlantı kur" butonunu bul ve tıkla
      for (let attempt = 0; attempt < 10 && clickedCount < maxConnectionsPerSearch; attempt++) {
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
          
          // İlk görünür butonu bul ve işle (basit yaklaşım)
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
              
            // Basit yaklaşım - önce butona tıkla, sonra bilgileri al
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
              
              // Basit bilgilerle veritabanına kaydet
              await prisma.linkedInContact.create({
                data: {
                  firstName: 'LinkedIn',
                  lastName: `User #${clickedCount + 1}`,
                  title: 'Professional',
                  linkedinUrl: `https://www.linkedin.com/in/user-${Date.now()}`,
                  targetCategory: 'CEO',
                  status: 'SENT',
                  connectionSentAt: new Date(),
                },
              })
              
              clickedCount++
              todayCount++
              
              await prisma.botLog.create({
                data: { type: 'SUCCESS', message: `🎉 Bağlantı gönderildi!` },
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
        data: { type: 'INFO', message: `${clickedCount} kişiye bağlantı isteği gönderildi` },
      })
      
      if (clickedCount > 0) {
        await prisma.botConfig.update({
          where: { id: 'default' },
          data: { todayConnectionCount: todayCount },
        })
      }
      
      // Eğer 3 kişiye ulaştıysak VEYA hiç kişi bulamadıysak bir sonraki sayfaya geç
      if (clickedCount >= maxConnectionsPerSearch || clickedCount === 0) {
        try {
          const logMessage = clickedCount === 0 
            ? 'Bu sayfada bağlantı kurulacak kişi bulunamadı, sonraki sayfaya geçiliyor...' 
            : `${maxConnectionsPerSearch} kişiye ulaşıldı, sonraki sayfaya geçiliyor...`
          
          await prisma.botLog.create({
            data: { type: 'INFO', message: logMessage },
          })
          
          const nextButton = page.getByRole('button', { name: /sonraki|next/i }).first()
          const isNextVisible = await nextButton.isVisible().catch(() => false)
          
          if (isNextVisible) {
            await nextButton.click()
            await page.waitForTimeout(3000)
            
            await prisma.botLog.create({
              data: { type: 'SUCCESS', message: '✅ Sonraki sayfaya geçildi, devam ediliyor...' },
            })
            
            // Sonraki sayfada da 3 kişi daha ara
            clickedCount = 0
            for (let attempt2 = 0; attempt2 < 10 && clickedCount < maxConnectionsPerSearch; attempt2++) {
              const currentConfig3 = await prisma.botConfig.findUnique({ where: { id: 'default' } })
              if (!currentConfig3?.isRunning) break
              
              try {
                const profileCards2 = await page.$$('div[role="listitem"]')
                
                if (profileCards2.length === 0) {
                  await page.evaluate(() => window.scrollBy(0, 500))
                  await page.waitForTimeout(1000)
                  continue
                }
                
                let processed2 = false
                
                for (const card of profileCards2) {
                  try {
                    const connectButton = await card.$('a[href*="/preload/search-custom-invite/"]')
                    if (!connectButton) continue
                    
                    const isVisible = await connectButton.isVisible().catch(() => false)
                    if (!isVisible) continue
                    
                    let firstName = 'LinkedIn'
                    let lastName = 'User'
                    let title = 'Professional'
                    let company = ''
                    let linkedinUrl = ''
                    
                    const nameLink = await card.$('a[data-view-name="search-result-lockup-title"]')
                    if (nameLink) {
                      const fullName = await nameLink.textContent()
                      const href = await nameLink.getAttribute('href')
                      
                      if (fullName && fullName.trim()) {
                        const nameParts = fullName.trim().split(' ')
                        firstName = nameParts[0] || 'LinkedIn'
                        lastName = nameParts.slice(1).join(' ') || 'User'
                      }
                      
                      if (href) {
                        linkedinUrl = href.startsWith('http') ? href.split('?')[0] : `https://www.linkedin.com${href.split('?')[0]}`
                      }
                    }
                    
                    if (linkedinUrl) {
                      const existing = await prisma.linkedInContact.findUnique({
                        where: { linkedinUrl },
                      })
                      if (existing) continue
                    }
                    
                    const allPTags = await card.$$('p')
                    if (allPTags.length >= 2) {
                      const titleText = await allPTags[1].textContent()
                      if (titleText && titleText.trim() && !titleText.includes('•')) {
                        title = titleText.trim()
                      }
                      
                      // Şirket bilgisi
                      for (const pTag of allPTags) {
                        const text = await pTag.textContent()
                        if (text && text.includes('Mevcut:')) {
                          const companyMatch = text.match(/Mevcut:\s*(.+?)\s+şirketinde/)
                          if (companyMatch && companyMatch[1]) {
                            company = companyMatch[1].trim()
                          }
                          break
                        }
                      }
                    }
                    
                    await connectButton.click({ force: true })
                    await page.waitForTimeout(2000)
                    
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
                      
                      let category = 'OTHER'
                      const titleLower = title.toLowerCase()
                      if (titleLower.includes('ceo')) category = 'CEO'
                      else if (titleLower.includes('cto')) category = 'CTO'
                      else if (titleLower.includes('cmo')) category = 'CMO'
                      else if (titleLower.includes('director')) category = 'DIRECTOR'
                      else if (titleLower.includes('manager')) category = 'MANAGER'
                      
                      await prisma.linkedInContact.create({
                        data: {
                          firstName,
                          lastName,
                          title,
                          company: company || '',
                          linkedinUrl: linkedinUrl || `https://www.linkedin.com/in/user-${Date.now()}`,
                          targetCategory: category,
                          status: 'SENT',
                          connectionSentAt: new Date(),
                        },
                      })
                      
                      clickedCount++
                      todayCount++
                      
                      await prisma.botLog.create({
                        data: { type: 'SUCCESS', message: `🎉 2. sayfadan: ${firstName} ${lastName}` },
                      })
                      
                      processed2 = true
                      break
                    }
                  } catch (cardErr) {
                    continue
                  }
                }
                
                if (!processed2) {
                  await page.evaluate(() => window.scrollBy(0, 500))
                  await page.waitForTimeout(1000)
                } else {
                  await page.waitForTimeout(Math.random() * 3000 + 2000)
                }
              } catch (err2) {
                await page.waitForTimeout(2000)
              }
            }
            
            await prisma.botLog.create({
              data: { type: 'SUCCESS', message: `2. sayfadan ${clickedCount} kişiye daha bağlantı gönderildi` },
            })
          }
        } catch (pageErr) {
          await prisma.botLog.create({
            data: { type: 'WARNING', message: `Sayfa geçiş hatası: ${pageErr}` },
          })
        }
      }
    }

    await prisma.botLog.create({
      data: { type: 'SUCCESS', message: 'Bot işlemi tamamlandı' },
    })

  } catch (error) {
    console.error('[BOT] Hata:', error)
    await prisma.botLog.create({
      data: { type: 'ERROR', message: `Bot hatası: ${error}` },
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
