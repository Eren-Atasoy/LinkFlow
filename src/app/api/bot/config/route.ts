import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Config'i oku
export async function GET() {
  try {
    const config = await prisma.botConfig.findUnique({
      where: { id: 'default' },
    })

    if (!config) {
      return NextResponse.json(
        { error: 'Config bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Config GET Error:', error)
    return NextResponse.json(
      { error: 'Config yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT: Config'i güncelle
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    
    const config = await prisma.botConfig.update({
      where: { id: 'default' },
      data: {
        dailyLimit: body.dailyLimit,
        maxConnectionsPerSearch: body.maxConnectionsPerSearch,
        maxPagesPerSearch: body.maxPagesPerSearch,
        minDelaySeconds: body.minDelaySeconds,
        maxDelaySeconds: body.maxDelaySeconds,
        searchKeywords: body.searchKeywords,
      },
    })

    await prisma.botLog.create({
      data: { 
        type: 'SUCCESS', 
        message: `Bot ayarları güncellendi: ${body.maxConnectionsPerSearch} kişi/sayfa, ${body.maxPagesPerSearch} sayfa limiti` 
      },
    })

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Config PUT Error:', error)
    return NextResponse.json(
      { error: 'Config güncellenirken hata oluştu', details: error.message },
      { status: 500 }
    )
  }
}
