'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Loader2, Save } from 'lucide-react'
import { useBotStore } from '@/store/bot-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface BotConfig {
  dailyLimit: number
  maxConnectionsPerSearch: number
  maxPagesPerSearch: number
  minDelaySeconds: number
  maxDelaySeconds: number
  searchKeywords: string
}

export function BotSettings() {
  const { addLog } = useBotStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<BotConfig>({
    dailyLimit: 25,
    maxConnectionsPerSearch: 3,
    maxPagesPerSearch: 5,
    minDelaySeconds: 120,
    maxDelaySeconds: 300,
    searchKeywords: 'CEO,CTO,CMO',
  })

  useEffect(() => {
    if (isOpen) {
      fetchConfig()
    }
  }, [isOpen])

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/bot/config')
      if (response.ok) {
        const data = await response.json()
        setConfig({
          dailyLimit: data.dailyLimit || 25,
          maxConnectionsPerSearch: data.maxConnectionsPerSearch || 3,
          maxPagesPerSearch: data.maxPagesPerSearch || 5,
          minDelaySeconds: data.minDelaySeconds || 120,
          maxDelaySeconds: data.maxDelaySeconds || 300,
          searchKeywords: data.searchKeywords || 'CEO,CTO,CMO',
        })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Ayarlar yüklenirken hata oluştu' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/bot/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        addLog({ 
          type: 'SUCCESS', 
          message: 'Bot ayarları kaydedildi!' 
        })
        setIsOpen(false)
      } else {
        addLog({ type: 'ERROR', message: 'Ayarlar kaydedilemedi' })
      }
    } catch (error) {
      addLog({ type: 'ERROR', message: 'Ayarlar kaydedilirken hata oluştu' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Ayarlar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bot Ayarları</DialogTitle>
          <DialogDescription>
            Bot'un çalışma parametrelerini buradan ayarlayabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Günlük Limit */}
            <div className="space-y-2">
              <Label htmlFor="dailyLimit">Günlük Bağlantı Limiti</Label>
              <Input
                id="dailyLimit"
                type="number"
                min="1"
                max="100"
                value={config.dailyLimit}
                onChange={(e) =>
                  setConfig({ ...config, dailyLimit: parseInt(e.target.value) || 25 })
                }
              />
              <p className="text-sm text-muted-foreground">
                Bir günde gönderilebilecek maksimum bağlantı isteği sayısı (LinkedIn önerisi: 20-30)
              </p>
            </div>

            {/* Her Aramada Max Kişi */}
            <div className="space-y-2">
              <Label htmlFor="maxConnectionsPerSearch">
                Her Aramada Max Bağlantı Sayısı
              </Label>
              <Input
                id="maxConnectionsPerSearch"
                type="number"
                min="1"
                max="50"
                value={config.maxConnectionsPerSearch}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxConnectionsPerSearch: parseInt(e.target.value) || 3,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Her arama anahtar kelimesi için gönderilecek maksimum bağlantı sayısı
              </p>
            </div>

            {/* Her Aramada Max Sayfa */}
            <div className="space-y-2">
              <Label htmlFor="maxPagesPerSearch">
                Her Aramada Max Sayfa Sayısı
              </Label>
              <Input
                id="maxPagesPerSearch"
                type="number"
                min="1"
                max="20"
                value={config.maxPagesPerSearch}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxPagesPerSearch: parseInt(e.target.value) || 5,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Her arama için taranacak maksimum sayfa sayısı (her sayfada ~10 kişi)
              </p>
            </div>

            {/* Min Delay */}
            <div className="space-y-2">
              <Label htmlFor="minDelaySeconds">Min Bekleme Süresi (saniye)</Label>
              <Input
                id="minDelaySeconds"
                type="number"
                min="10"
                max="600"
                value={config.minDelaySeconds}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    minDelaySeconds: parseInt(e.target.value) || 120,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Her bağlantı isteği arasındaki minimum bekleme süresi
              </p>
            </div>

            {/* Max Delay */}
            <div className="space-y-2">
              <Label htmlFor="maxDelaySeconds">Max Bekleme Süresi (saniye)</Label>
              <Input
                id="maxDelaySeconds"
                type="number"
                min="10"
                max="600"
                value={config.maxDelaySeconds}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxDelaySeconds: parseInt(e.target.value) || 300,
                  })
                }
              />
              <p className="text-sm text-muted-foreground">
                Her bağlantı isteği arasındaki maksimum bekleme süresi
              </p>
            </div>

            {/* Search Keywords */}
            <div className="space-y-2">
              <Label htmlFor="searchKeywords">Arama Anahtar Kelimeleri</Label>
              <Input
                id="searchKeywords"
                type="text"
                value={config.searchKeywords}
                onChange={(e) =>
                  setConfig({ ...config, searchKeywords: e.target.value })
                }
                placeholder="CEO,CTO,CMO,Director"
              />
              <p className="text-sm text-muted-foreground">
                Virgülle ayrılmış arama anahtar kelimeleri (şu an kullanılmıyor, gelecekte kullanılacak)
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

