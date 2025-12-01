'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Search,
  Loader2,
  Settings,
  CheckCircle2
} from 'lucide-react'
import { useBotStore } from '@/store/bot-store'

interface BotControlsProps {
  onRefresh: () => void
}

export function BotControls({ onRefresh }: BotControlsProps) {
  const { isRunning, setIsRunning, addLog } = useBotStore()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStartBot = async () => {
    if (isRunning) return
    
    setIsStarting(true)
    try {
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchKeyword || undefined }),
      })
      
      if (response.ok) {
        setIsRunning(true)
        const keywordMsg = searchKeyword 
          ? `"${searchKeyword}" anahtar kelimesi ile bot başlatıldı`
          : 'Bot başlatıldı (ayarlardan yapılandırılan anahtar kelimeler kullanılıyor)'
        addLog({ type: 'SUCCESS', message: keywordMsg })
      } else {
        const data = await response.json()
        addLog({ type: 'ERROR', message: data.message || data.error || 'Bot başlatılamadı' })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Bot başlatılırken hata oluştu' })
    } finally {
      setIsStarting(false)
    }
  }

  const handleStopBot = async () => {
    try {
      const response = await fetch('/api/bot/stop', { method: 'POST' })
      if (response.ok) {
        setIsRunning(false)
        addLog({ type: 'INFO', message: 'Bot durduruldu' })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Bot durdurulurken hata oluştu' })
    }
  }

  const [isCheckingStatuses, setIsCheckingStatuses] = useState(false)

  const handleCheckStatuses = async () => {
    try {
      setIsCheckingStatuses(true)
      addLog({ type: 'INFO', message: 'LinkedIn profilleri kontrol ediliyor...' })
      
      const response = await fetch('/api/contacts/check-statuses', {
        method: 'POST',
      })
      
      if (response.ok) {
        const result = await response.json()
        addLog({ type: 'SUCCESS', message: `✅ ${result.updated} profil güncellendi` })
        onRefresh() // Listeyi yenile
      } else {
        addLog({ type: 'ERROR', message: 'Profil kontrolü başarısız' })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Profil kontrolü hatası' })
    } finally {
      setIsCheckingStatuses(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/export/excel')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `linkedin-contacts-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        addLog({ type: 'SUCCESS', message: 'Excel dosyası indirildi' })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Excel export hatası' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Bot Kontrolleri</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Arama anahtar kelimesi (örn: CEO, CTO...)"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
                disabled={isRunning}
              />
            </div>
          </div>

          {/* Bot Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <Button 
                variant="linkedin" 
                onClick={handleStartBot}
                disabled={isStarting}
              >
                {isStarting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Botu Başlat
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                onClick={handleStopBot}
              >
                <Square className="mr-2 h-4 w-4" />
                Botu Durdur
              </Button>
            )}

            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Yenile
            </Button>

            <Button 
              variant="outline" 
              onClick={handleCheckStatuses}
              disabled={isCheckingStatuses || isRunning}
            >
              {isCheckingStatuses ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Status Kontrol
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Excel İndir
            </Button>
          </div>

          {/* Status Indicator */}
          {isRunning && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm text-muted-foreground">Bot çalışıyor...</span>
            </div>
          )}

        </div>
      </CardContent>
    </Card>
  )
}

