'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Save, 
  Loader2, 
  Key, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface BotConfig {
  id: string
  isRunning: boolean
  dailyLimit: number
  minDelaySeconds: number
  maxDelaySeconds: number
  todayConnectionCount: number
  searchKeywords: string
  linkedinSessionCookie: string | null
}

export default function SettingsPage() {
  const [config, setConfig] = useState<BotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [sessionCookie, setSessionCookie] = useState('')
  const [dailyLimit, setDailyLimit] = useState(25)
  const [minDelay, setMinDelay] = useState(120)
  const [maxDelay, setMaxDelay] = useState(300)
  const [keywords, setKeywords] = useState('')

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/bot/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setSessionCookie(data.linkedinSessionCookie || '')
        setDailyLimit(data.dailyLimit)
        setMinDelay(data.minDelaySeconds)
        setMaxDelay(data.maxDelaySeconds)
        setKeywords(data.searchKeywords)
      }
    } catch (error) {
      console.error('Config yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/bot/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinSessionCookie: sessionCookie || null,
          dailyLimit,
          minDelaySeconds: minDelay,
          maxDelaySeconds: maxDelay,
          searchKeywords: keywords,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' })
        fetchConfig()
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Ayarlar kaydedilemedi' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bağlantı hatası' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Dashboard'a Dön
        </Link>

        <h1 className="text-3xl font-bold mb-8">Bot Ayarları</h1>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {/* LinkedIn Session Cookie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-linkedin" />
                LinkedIn Oturum Çerezi
              </CardTitle>
              <CardDescription>
                LinkedIn'e giriş yapmak için gerekli olan li_at çerezini buraya girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="AQEDAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={sessionCookie}
                onChange={(e) => setSessionCookie(e.target.value)}
                className="font-mono"
              />
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground mb-2">Cookie nasıl alınır:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>LinkedIn'e giriş yapın (linkedin.com)</li>
                      <li>F12 tuşuna basarak DevTools'u açın</li>
                      <li>Application (Uygulama) sekmesine gidin</li>
                      <li>Sol menüden Cookies → linkedin.com seçin</li>
                      <li><code className="bg-background px-1 rounded">li_at</code> değerini bulun ve kopyalayın</li>
                    </ol>
                  </div>
                </div>
              </div>

              {!sessionCookie && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Oturum çerezi ayarlanmamış. Bot çalışmayacaktır.
                </div>
              )}

              {sessionCookie && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Oturum çerezi ayarlanmış
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Hız Sınırlama (Rate Limiting)
              </CardTitle>
              <CardDescription>
                LinkedIn'in bot korumasından kaçınmak için bekleme sürelerini ayarlayın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Minimum Bekleme (saniye)
                  </label>
                  <Input
                    type="number"
                    min={60}
                    max={600}
                    value={minDelay}
                    onChange={(e) => setMinDelay(parseInt(e.target.value) || 120)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Önerilen: 120 saniye (2 dakika)
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Maksimum Bekleme (saniye)
                  </label>
                  <Input
                    type="number"
                    min={120}
                    max={900}
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(parseInt(e.target.value) || 300)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Önerilen: 300 saniye (5 dakika)
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                <strong>Not:</strong> Her işlem arasında {minDelay} - {maxDelay} saniye ({Math.round(minDelay/60)} - {Math.round(maxDelay/60)} dakika) rastgele bekleme yapılacaktır.
              </div>
            </CardContent>
          </Card>

          {/* Daily Limit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                Günlük Limit
              </CardTitle>
              <CardDescription>
                Günlük maksimum bağlantı isteği sayısı
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 25)}
                />
                <p className="text-xs text-muted-foreground">
                  Önerilen: 20-30 arası. LinkedIn'in günlük limiti aşılırsa hesap kısıtlanabilir.
                </p>
              </div>

              {config && (
                <div className="text-sm text-muted-foreground">
                  Bugünkü kullanım: <strong>{config.todayConnectionCount}</strong> / {dailyLimit}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Arama Anahtar Kelimeleri</CardTitle>
              <CardDescription>
                Varsayılan arama anahtar kelimeleri (virgülle ayırın)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="CEO, CTO, CMO, Director, Founder..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link href="/">İptal</Link>
            </Button>
            <Button 
              variant="linkedin" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Ayarları Kaydet
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

