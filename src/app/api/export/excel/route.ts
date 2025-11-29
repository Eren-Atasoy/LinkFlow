import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { getStatusLabel, getCategoryLabel } from '@/lib/utils'

export async function GET() {
  try {
    // Tüm kişileri getir
    const contacts = await prisma.linkedInContact.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'LinkedIn Connect Bot'
    workbook.created = new Date()

    // Worksheet ekle
    const worksheet = workbook.addWorksheet('LinkedIn Kişileri', {
      properties: { tabColor: { argb: '0A66C2' } },
    })

    // Sütun tanımları
    worksheet.columns = [
      { header: 'İsim', key: 'firstName', width: 15 },
      { header: 'Soyisim', key: 'lastName', width: 15 },
      { header: 'Ünvan', key: 'title', width: 30 },
      { header: 'Şirket', key: 'company', width: 25 },
      { header: 'Eğitim', key: 'education', width: 25 },
      { header: 'Konum', key: 'location', width: 20 },
      { header: 'Kategori', key: 'category', width: 18 },
      { header: 'Durum', key: 'status', width: 12 },
      { header: 'LinkedIn URL', key: 'linkedinUrl', width: 40 },
      { header: 'Notlar', key: 'extraNotes', width: 30 },
      { header: 'Eklenme Tarihi', key: 'createdAt', width: 18 },
      { header: 'İstek Tarihi', key: 'connectionSentAt', width: 18 },
    ]

    // Header stilini ayarla
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0A66C2' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.height = 25

    // Verileri ekle
    contacts.forEach((contact) => {
      worksheet.addRow({
        firstName: contact.firstName,
        lastName: contact.lastName,
        title: contact.title,
        company: contact.company || '-',
        education: contact.education || '-',
        location: contact.location || '-',
        category: getCategoryLabel(contact.targetCategory),
        status: getStatusLabel(contact.status),
        linkedinUrl: contact.linkedinUrl,
        extraNotes: contact.extraNotes || '',
        createdAt: new Date(contact.createdAt).toLocaleDateString('tr-TR'),
        connectionSentAt: contact.connectionSentAt 
          ? new Date(contact.connectionSentAt).toLocaleDateString('tr-TR')
          : '-',
      })
    })

    // Tüm hücrelere border ekle
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
        if (rowNumber > 1) {
          cell.alignment = { vertical: 'middle', wrapText: true }
        }
      })
    })

    // Durum sütununa renkli hücreler ekle
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const statusCell = row.getCell('status')
        const status = contacts[rowNumber - 2]?.status

        if (status === 'CONNECTED') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C6EFCE' },
          }
          statusCell.font = { color: { argb: '006100' } }
        } else if (status === 'REJECTED') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFC7CE' },
          }
          statusCell.font = { color: { argb: '9C0006' } }
        } else if (status === 'ACCEPTED') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C6EFCE' },
          }
          statusCell.font = { color: { argb: '006100' } }
        } else if (status === 'PENDING') {
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEB9C' },
          }
          statusCell.font = { color: { argb: '9C5700' } }
        }
      }
    })

    // Buffer olarak yaz
    const buffer = await workbook.xlsx.writeBuffer()

    // Response oluştur
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="linkedin-contacts-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel Export Error:', error)
    return NextResponse.json(
      { error: 'Excel dosyası oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

