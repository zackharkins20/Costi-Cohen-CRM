'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { StageBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateContactForm } from '@/components/forms/create-contact-form'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import { DealDetailModal } from '@/components/pipeline/deal-detail-modal'
import { getContacts, getCurrentUser } from '@/lib/queries'
import { formatPhone } from '@/lib/utils'
import { getDocumentCounts } from '@/lib/documents'
import { PROPERTY_STAGES, BUYER_TYPES, type Contact, type Deal, type PropertyStage, type BuyerType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Plus, Users, Mail, Phone, Paperclip } from 'lucide-react'

type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest' | 'stage'
type TypeFilter = 'all' | 'client' | 'other'

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'name_asc', label: 'Name (A-Z)' },
  { key: 'name_desc', label: 'Name (Z-A)' },
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'stage', label: 'Stage' },
]

const STAGE_ORDER: Record<PropertyStage, number> = {
  active_leads: 0,
  proposal_sent: 1,
  agreement_sent: 2,
  agreement_signed: 3,
  retainer_invoice_sent: 4,
  property_search: 5,
  contracts_exchanged: 6,
  settled: 7,
  marketing_only: 8,
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<PropertyStage | 'all'>('all')
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<BuyerType | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [dealDetailOpen, setDealDetailOpen] = useState(false)

  const load = () => {
    getContacts().then(c => {
      setContacts(c)
      getDocumentCounts('contact', c.map(ct => ct.id)).then(setDocCounts)
    })
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = contacts.filter(c => {
      // Search
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !(c.company || '').toLowerCase().includes(q) &&
          !(c.email || '').toLowerCase().includes(q)
        ) return false
      }
      // Stage filter
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false
      // Buyer type filter
      if (buyerTypeFilter !== 'all' && c.buyer_type !== buyerTypeFilter) return false
      // Type filter
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      return true
    })

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'stage':
          return STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
        default:
          return 0
      }
    })

    return result
  }, [contacts, search, stageFilter, buyerTypeFilter, typeFilter, sort])

  return (
    <div>
      <PageHeader title="Contacts" description={`${contacts.length} contacts`}>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-52 h-9"
          />
        </div>

        {/* Stage filter */}
        <Select value={stageFilter} onValueChange={v => setStageFilter(v as PropertyStage | 'all')}>
          <SelectTrigger className="w-48 h-9 text-xs">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {PROPERTY_STAGES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Buyer type filter */}
        <Select value={buyerTypeFilter} onValueChange={v => setBuyerTypeFilter(v as BuyerType | 'all')}>
          <SelectTrigger className="w-44 h-9 text-xs">
            <SelectValue placeholder="All Buyer Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buyer Types</SelectItem>
            {BUYER_TYPES.map(b => (
              <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter pills */}
        <div className="flex gap-1.5">
          {(['all', 'client', 'other'] as const).map(t => {
            const active = typeFilter === t
            const label = t === 'all' ? 'All' : t === 'client' ? 'Client' : 'Other'
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs border rounded-md transition-colors ${
                  active
                    ? 'bg-cc-accent text-white border-cc-accent'
                    : 'bg-transparent text-cc-text-muted border-cc-border hover:border-cc-border-hover hover:text-cc-text-secondary'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(o => (
              <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to start building your pipeline."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Contact
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(contact => {
            const initials = contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <GlassCard
                key={contact.id}
                className="p-5"
                onClick={() => { setSelectedContact(contact); setDetailOpen(true) }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-cc-surface-2 border border-cc-border flex items-center justify-center text-cc-text-primary font-semibold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-cc-text-primary truncate">{contact.name}</p>
                    {contact.company && (
                      <p className="text-xs text-cc-text-secondary truncate">{contact.company}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-cc-text-muted">
                      {contact.email && (
                        <span className="flex items-center gap-1 truncate" title={contact.email}><Mail className="h-3 w-3" /> {contact.email}</span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {formatPhone(contact.phone)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <StageBadge stage={contact.stage} />
                      {contact.buyer_type && (() => {
                        const buyerColors: Record<string, { bg: string; text: string }> = {
                          investor: { bg: '#DBEAFE', text: '#1E40AF' },
                          developer: { bg: '#EDE9FE', text: '#5B21B6' },
                          owner_occupier: { bg: '#D1FAE5', text: '#065F46' },
                        }
                        const btc = buyerColors[contact.buyer_type]
                        const label = BUYER_TYPES.find(b => b.key === contact.buyer_type)?.label
                        return btc && label ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-sm" style={{ backgroundColor: btc.bg, color: btc.text }}>
                            {label}
                          </span>
                        ) : null
                      })()}
                      {docCounts[contact.id] > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-cc-text-muted">
                          <Paperclip className="h-3 w-3" /> {docCounts[contact.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}

      <CreateContactForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        userId={userId}
      />

      <ContactDetailModal
        contact={selectedContact}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
        userId={userId}
        onNavigateToDeal={(deal) => {
          setSelectedDeal(deal)
          setDealDetailOpen(true)
        }}
      />

      <DealDetailModal
        deal={selectedDeal}
        open={dealDetailOpen}
        onClose={() => setDealDetailOpen(false)}
        onUpdated={load}
        userId={userId}
        onNavigateToContact={(contact) => {
          setSelectedContact(contact)
          setDetailOpen(true)
        }}
      />
    </div>
  )
}
