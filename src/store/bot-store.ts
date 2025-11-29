import { create } from 'zustand'

export interface BotLog {
  id: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION'
  message: string
  timestamp: Date
}

export interface BotStats {
  totalContacts: number
  pendingCount: number
  sentCount: number
  connectedCount: number
  rejectedCount: number
  todayCount: number
  dailyLimit: number
}

interface BotState {
  isRunning: boolean
  logs: BotLog[]
  stats: BotStats
  setIsRunning: (running: boolean) => void
  addLog: (log: Omit<BotLog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
  setStats: (stats: BotStats) => void
  updateStats: (partial: Partial<BotStats>) => void
}

export const useBotStore = create<BotState>((set) => ({
  isRunning: false,
  logs: [],
  stats: {
    totalContacts: 0,
    pendingCount: 0,
    sentCount: 0,
    connectedCount: 0,
    rejectedCount: 0,
    todayCount: 0,
    dailyLimit: 25,
  },
  
  setIsRunning: (running) => set({ isRunning: running }),
  
  addLog: (log) =>
    set((state) => ({
      logs: [
        {
          ...log,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
        ...state.logs.slice(0, 99), // Son 100 log'u tut
      ],
    })),
  
  clearLogs: () => set({ logs: [] }),
  
  setStats: (stats) => set({ stats }),
  
  updateStats: (partial) =>
    set((state) => ({
      stats: { ...state.stats, ...partial },
    })),
}))

