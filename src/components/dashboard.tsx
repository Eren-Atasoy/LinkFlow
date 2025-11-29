'use client'

import { useEffect, useState } from 'react'
import { StatsCards } from './stats-cards'
import { ContactsTable } from './contacts-table'
import { LogPanel } from './log-panel'
import { BotControls } from './bot-controls'
import { useBotStore } from '@/store/bot-store'

export interface Contact {
  id: string
  firstName: string
  lastName: string
  title: string
  company: string | null
  education: string | null
  linkedinUrl: string
  profileImageUrl: string | null
  location: string | null
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  targetCategory: string
  extraNotes: string | null
  createdAt: string
  connectionSentAt: string | null
}

export function Dashboard() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const { setStats, setIsRunning } = useBotStore()

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        setContacts(data.contacts)
        setStats(data.stats)
        
        // Bot durumunu da güncelle
        if (data.botConfig && typeof data.botConfig.isRunning === 'boolean') {
          setIsRunning(data.botConfig.isRunning)
        }
      }
    } catch (error) {
      console.error('Kişiler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
    // Her 2 saniyede bir güncelle (anlık güncelleme için)
    const interval = setInterval(fetchContacts, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        {/* Stats Cards */}
        <StatsCards />

        {/* Bot Controls */}
        <BotControls onRefresh={fetchContacts} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contacts Table - 2/3 genişlik */}
          <div className="lg:col-span-2">
            <ContactsTable 
              contacts={contacts} 
              loading={loading} 
              onRefresh={fetchContacts}
            />
          </div>

          {/* Log Panel - 1/3 genişlik */}
          <div className="lg:col-span-1">
            <LogPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

