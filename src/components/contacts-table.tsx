'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  GraduationCap,
  MapPin
} from 'lucide-react'
import { Contact } from './dashboard'
import { formatDate, getStatusLabel, getCategoryLabel } from '@/lib/utils'

interface ContactsTableProps {
  contacts: Contact[]
  loading: boolean
  onRefresh: () => void
}

const statusVariants: Record<string, 'pending' | 'accepted' | 'rejected' | 'secondary'> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
}

export function ContactsTable({ contacts, loading, onRefresh }: ContactsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filtreleme
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        contact.firstName.toLowerCase().includes(searchLower) ||
        contact.lastName.toLowerCase().includes(searchLower) ||
        contact.title.toLowerCase().includes(searchLower) ||
        (contact.company?.toLowerCase().includes(searchLower) ?? false)

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || contact.targetCategory === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [contacts, search, statusFilter, categoryFilter])

  // Sayfalama
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage)
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Unique kategoriler
  const categories = [...new Set(contacts.map((c) => c.targetCategory))]

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kişiler ({filteredContacts.length})</span>
        </CardTitle>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 pt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, ünvan veya şirket ara..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="PENDING">Beklemede</SelectItem>
              <SelectItem value="SENT">Gönderildi</SelectItem>
              <SelectItem value="CONNECTED">Bağlandı</SelectItem>
              <SelectItem value="REJECTED">Reddedildi</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : paginatedContacts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {contacts.length === 0 
              ? 'Henüz kayıtlı kişi yok. Botu başlatarak kişi toplamaya başlayın.' 
              : 'Filtrelere uygun kişi bulunamadı.'}
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Kişi</th>
                    <th className="pb-3 font-medium text-muted-foreground">Ünvan</th>
                    <th className="pb-3 font-medium text-muted-foreground">Detaylar</th>
                    <th className="pb-3 font-medium text-muted-foreground">Kategori</th>
                    <th className="pb-3 font-medium text-muted-foreground">Durum</th>
                    <th className="pb-3 font-medium text-muted-foreground">Tarih</th>
                    <th className="pb-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((contact) => (
                    <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-linkedin to-linkedin-dark flex items-center justify-center text-white font-semibold">
                            {contact.firstName[0]}{contact.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm max-w-[200px] truncate" title={contact.title}>
                          {contact.title}
                        </p>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {contact.company && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{contact.company}</span>
                            </div>
                          )}
                          {contact.education && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{contact.education}</span>
                            </div>
                          )}
                          {contact.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate max-w-[150px]">{contact.location}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(contact.targetCategory)}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={statusVariants[contact.status] || 'secondary'}>
                          {getStatusLabel(contact.status)}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(contact.createdAt)}
                        </p>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a
                            href={contact.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredContacts.length)} / {filteredContacts.length} kişi
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

