'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { StageBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateContactForm } from '@/components/forms/create-contact-form'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import { DealDetailModal } from '@/components/pipeline/deal-detail-modal'
import { getContacts, getDeals, getCurrentUser } from '@/lib/queries'
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

const BUYER_TYPE_COLORS: Record<string, { light: string; text: string; dark: string; darkText: string; dot: string }> = {
  investor: { light: '#DBEAFE', text: '#1E40AF', dark: '#1E3A5F', darkText: '#93C5FD', dot: '#3B82F6' },
  developer: { light: '#EDE9FE', text: '#5B21B6', dark: '#4C1D95', darkText: '#C4B5FD', dot: '#8B5CF6' },
  owner_occupier: { light: '#D1FAE5', text: '#065F46', dark: '#064E3B', darkText: '#6EE7B7', dot: '#10B981' },
}

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

type BuyerSection = { key: string; label: string; contacts: Contact[] }

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
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
    getDeals().then(setDeals)
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = contacts.filter(c => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.name.toLowerCase().includes(q) &&
          !(c.company || '').toLowerCase().includes(q) &&
          !(c.email || '').toLowerCase().includes(q)
        ) return false
      }
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false
      if (buyerTypeFilter !== 'all' && c.buyer_type !== buyerTypeFilter) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      return true
    })

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

  // Group filtered contacts by buyer type
  const sections = useMemo<BuyerSection[]>(() => {
    const groups: BuyerSection[] = BUYER_TYPES.map(bt => ({
      key: bt.key,
      label: bt.label + 's',
      contacts: filtered.filter(c => c.buyer_type === bt.key),
    }))
    const uncategorised = filtered.filter(c => !c.buyer_type)
    if (uncategorised.length > 0) {
      groups.push({ key: 'uncategorised', label: 'Uncategorised', contacts: uncategorised })
    }
    return groups.filter(g => g.contacts.length > 0)
  }, [filtered])

  // Pipeline values by buyer type (using all contacts + deals, not filtered)
  const buyerTypeStats = useMemo(() => {
    const stats: Record<string, { count: number; pipelineValue: number }> = {}
    for (const bt of BUYER_TYPES) {
      const btContacts = contacts.filter(c => c.buyer_type === bt.key)
      const contactIds = new Set(btContacts.map(c => c.id))
      const btDeals = deals.filter(d => d.contact_id && contactIds.has(d.contact_id) && d.stage !== 'settled' && d.stage !== 'marketing_only')
      stats[bt.key] = {
        count: btContacts.length,
        pipelineValue: btDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0),
      }
    }
    return stats
  }, [contacts, deals])

  const renderContactCard = (contact: Contact) => {
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
  }

  return (
    <div>
      <PageHeader title="Contacts" description={`${contacts.length} contacts`}>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-52 h-9"
          />
        </div>

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

      {/* Summary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {BUYER_TYPES.map(bt => {
          const colors = BUYER_TYPE_COLORS[bt.key]
          const stats = buyerTypeStats[bt.key] || { count: 0, pipelineValue: 0 }
          return (
            <div
              key={bt.key}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-cc-border bg-cc-surface"
              style={{ borderLeftWidth: '3px', borderLeftColor: colors.dot }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-cc-text-secondary">{bt.label}s</p>
                <div className="flex items-baseline gap-3 mt-0.5">
                  <span className="text-lg font-bold text-cc-text-primary">{stats.count}</span>
                  <span className="text-xs text-cc-text-muted">{formatCurrency(stats.pipelineValue)} pipeline</span>
                </div>
              </div>
            </div>
          )
        })}
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
        <div className="space-y-8">
          {sections.map(section => {
            const colors = BUYER_TYPE_COLORS[section.key]
            return (
              <div key={section.key}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    {colors && (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.dot }} />
                    )}
                    {!colors && (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-cc-text-muted" />
                    )}
                    <h2 className="text-sm font-semibold text-cc-text-primary">{section.label}</h2>
                    <span className="text-xs text-cc-text-muted">({section.contacts.length})</span>
                  </div>
                  <div className="flex-1 border-t border-cc-border" />
                </div>

                {/* Contact grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {section.contacts.map(renderContactCard)}
                </div>
              </div>
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
