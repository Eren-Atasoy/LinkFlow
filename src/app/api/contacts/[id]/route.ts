import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.linkedInContact.findUnique({
      where: { id: params.id },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Kişi bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact GET Error:', error)
    return NextResponse.json(
      { error: 'Kişi getirilirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const contact = await prisma.linkedInContact.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json(contact)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kişi bulunamadı' },
        { status: 404 }
      )
    }

    console.error('Contact Update Error:', error)
    return NextResponse.json(
      { error: 'Kişi güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.linkedInContact.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kişi bulunamadı' },
        { status: 404 }
      )
    }

    console.error('Contact Delete Error:', error)
    return NextResponse.json(
      { error: 'Kişi silinirken hata oluştu' },
      { status: 500 }
    )
  }
}

