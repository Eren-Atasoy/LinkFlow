import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Rastgele bekleme süresi hesapla (milisaniye)
export function getRandomDelay(minSeconds: number, maxSeconds: number): number {
  return Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000
}

// Tarih formatlama
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Status badge renkleri
export function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'status-pending'
    case 'ACCEPTED':
      return 'status-accepted'
    case 'REJECTED':
      return 'status-rejected'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Status Türkçe karşılıkları
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Beklemede'
    case 'ACCEPTED':
      return 'Bağlandı'
    case 'REJECTED':
      return 'Reddedildi'
    default:
      return status
  }
}

// Kategori Türkçe karşılıkları
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    CEO: 'CEO / Genel Müdür',
    CTO: 'CTO',
    CMO: 'CMO',
    CFO: 'CFO',
    COO: 'COO',
    CHRO: 'CHRO',
    OTHER_CLEVEL: 'Diğer C-Level',
    HEAD_OF: 'Head of',
    DIRECTOR: 'Direktör',
    MENTOR: 'Mentor',
    ENTREPRENEUR: 'Girişimci',
    ACADEMIC: 'Akademisyen',
    OTHER: 'Diğer',
  }
  return labels[category] || category
}

// Sleep fonksiyonu
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

