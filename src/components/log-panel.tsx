'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Info, CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react'
import { useBotStore } from '@/store/bot-store'
import { cn } from '@/lib/utils'

const logIcons = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
  ACTION: Zap,
}

const logColors = {
  INFO: 'text-blue-500',
  SUCCESS: 'text-green-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-red-500',
  ACTION: 'text-purple-500',
}

export function LogPanel() {
  const { logs, clearLogs, isRunning } = useBotStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll to latest log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [logs])

  // Fetch logs from server periodically when bot is running
  useEffect(() => {
    if (!isRunning) return

    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/bot/logs')
        if (response.ok) {
          // Logs will be added via SSE or polling in a production app
        }
      } catch (error) {
        console.error('Log fetch error:', error)
      }
    }

    const interval = setInterval(fetchLogs, 5000)
    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          Bot Logları
          {isRunning && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearLogs}
          disabled={logs.length === 0}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollRef}>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Info className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center">
                Henüz log yok.<br />
                Bot başlatıldığında loglar burada görünecek.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = logIcons[log.type]
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'log-entry flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm',
                      log.type === 'ERROR' && 'bg-red-50 dark:bg-red-950/20',
                      log.type === 'SUCCESS' && 'bg-green-50 dark:bg-green-950/20'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', logColors[log.type])} />
                    <div className="flex-1 min-w-0">
                      <p className="break-words">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.timestamp.toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

