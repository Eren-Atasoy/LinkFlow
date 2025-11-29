import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Bot'u durdur (flag)
    await prisma.botConfig.update({
      where: { id: 'default' },
      data: { isRunning: false },
    })

    // Windows'ta node/tsx process'lerini bul ve durdur (bot ile ilgili olanları)
    try {
      // linkedin-bot içeren process'leri bul
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /FI "WINDOWTITLE eq linkedin-bot*" 2>nul || echo ok')
      } else {
        await execAsync('pkill -f "linkedin-bot" 2>/dev/null || true')
      }
    } catch (killError) {
      // Process bulunamasa bile devam et
      console.log('No bot process found to kill')
    }

    // Log ekle
    await prisma.botLog.create({
      data: {
        type: 'INFO',
        message: 'Bot durduruldu',
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Bot durduruldu' 
    })
  } catch (error) {
    console.error('Bot Stop Error:', error)
    return NextResponse.json(
      { error: 'Bot durdurulurken hata oluştu' },
      { status: 500 }
    )
  }
}
