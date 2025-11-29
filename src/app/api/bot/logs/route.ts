import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const logs = await prisma.botLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Bot Logs Error:', error)
    return NextResponse.json(
      { error: 'Loglar yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await prisma.botLog.deleteMany()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bot Logs Delete Error:', error)
    return NextResponse.json(
      { error: 'Loglar silinirken hata oluştu' },
      { status: 500 }
    )
  }
}

