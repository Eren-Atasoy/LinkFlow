import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Tüm kişileri getir
    const contacts = await prisma.linkedInContact.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // İstatistikleri hesapla
    const stats = {
      totalContacts: contacts.length,
      pendingCount: contacts.filter((c) => c.status === 'PENDING').length,
      sentCount: contacts.filter((c) => c.status === 'SENT').length,
      connectedCount: contacts.filter((c) => c.status === 'CONNECTED').length,
      rejectedCount: contacts.filter((c) => c.status === 'REJECTED').length,
      todayCount: 0,
      dailyLimit: 25,
    }

    // Bot config'den günlük sayaç bilgisini al
    const config = await prisma.botConfig.findUnique({
      where: { id: 'default' },
    })

    if (config) {
      stats.todayCount = config.todayConnectionCount
      stats.dailyLimit = config.dailyLimit
    }

    return NextResponse.json({ 
      contacts, 
      stats,
      botConfig: config ? { isRunning: config.isRunning } : { isRunning: false }
    })
  } catch (error) {
    console.error('Contacts API Error:', error)
    return NextResponse.json(
      { error: 'Kişiler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Yeni kişi oluştur
    const contact = await prisma.linkedInContact.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        company: body.company,
        education: body.education,
        linkedinUrl: body.linkedinUrl,
        profileImageUrl: body.profileImageUrl,
        location: body.location,
        status: body.status || 'PENDING',
        targetCategory: body.targetCategory || 'OTHER',
        extraNotes: body.extraNotes,
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error: any) {
    // Unique constraint violation - kişi zaten var
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Bu LinkedIn profili zaten kayıtlı' },
        { status: 409 }
      )
    }
    
    console.error('Contact Create Error:', error)
    return NextResponse.json(
      { error: 'Kişi oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

