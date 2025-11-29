import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bot config'i getir
export async function GET() {
  try {
    let config = await prisma.botConfig.findUnique({
      where: { id: 'default' },
    })

    // Config yoksa oluştur
    if (!config) {
      config = await prisma.botConfig.create({
        data: {
          id: 'default',
          isRunning: false,
          dailyLimit: 25,
          minDelaySeconds: 120,
          maxDelaySeconds: 300,
          todayConnectionCount: 0,
          searchKeywords: 'CEO,CTO,CMO,CFO,COO,Director,Head of,Founder,Entrepreneur',
          linkedinSessionCookie: null,
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Bot Config GET Error:', error)
    return NextResponse.json(
      { error: 'Ayarlar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Bot config'i güncelle
export async function PATCH(request: Request) {
  try {
    const body = await request.json()

    // Validation
    if (body.dailyLimit !== undefined && (body.dailyLimit < 1 || body.dailyLimit > 100)) {
      return NextResponse.json(
        { error: 'Günlük limit 1-100 arasında olmalıdır' },
        { status: 400 }
      )
    }

    if (body.minDelaySeconds !== undefined && body.minDelaySeconds < 30) {
      return NextResponse.json(
        { error: 'Minimum bekleme süresi en az 30 saniye olmalıdır' },
        { status: 400 }
      )
    }

    if (body.maxDelaySeconds !== undefined && body.maxDelaySeconds < 60) {
      return NextResponse.json(
        { error: 'Maksimum bekleme süresi en az 60 saniye olmalıdır' },
        { status: 400 }
      )
    }

    // Önce config var mı kontrol et
    let config = await prisma.botConfig.findUnique({
      where: { id: 'default' },
    })

    if (!config) {
      // Config yoksa oluştur
      config = await prisma.botConfig.create({
        data: {
          id: 'default',
          isRunning: false,
          dailyLimit: body.dailyLimit ?? 25,
          minDelaySeconds: body.minDelaySeconds ?? 120,
          maxDelaySeconds: body.maxDelaySeconds ?? 300,
          todayConnectionCount: 0,
          searchKeywords: body.searchKeywords ?? 'CEO,CTO,CMO,CFO,COO,Director,Head of,Founder,Entrepreneur',
          linkedinSessionCookie: body.linkedinSessionCookie ?? null,
        },
      })
    } else {
      // Config'i güncelle
      config = await prisma.botConfig.update({
        where: { id: 'default' },
        data: {
          ...(body.linkedinSessionCookie !== undefined && { linkedinSessionCookie: body.linkedinSessionCookie }),
          ...(body.dailyLimit !== undefined && { dailyLimit: body.dailyLimit }),
          ...(body.minDelaySeconds !== undefined && { minDelaySeconds: body.minDelaySeconds }),
          ...(body.maxDelaySeconds !== undefined && { maxDelaySeconds: body.maxDelaySeconds }),
          ...(body.searchKeywords !== undefined && { searchKeywords: body.searchKeywords }),
        },
      })
    }

    // Log kaydet
    await prisma.botLog.create({
      data: {
        type: 'INFO',
        message: 'Bot ayarları güncellendi',
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Bot Config PATCH Error:', error)
    return NextResponse.json(
      { error: 'Ayarlar güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// Günlük sayacı sıfırla
export async function DELETE() {
  try {
    const config = await prisma.botConfig.update({
      where: { id: 'default' },
      data: {
        todayConnectionCount: 0,
        lastResetDate: new Date(),
      },
    })

    await prisma.botLog.create({
      data: {
        type: 'INFO',
        message: 'Günlük sayaç sıfırlandı',
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Bot Config DELETE Error:', error)
    return NextResponse.json(
      { error: 'Sayaç sıfırlanırken hata oluştu' },
      { status: 500 }
    )
  }
}

