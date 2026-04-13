'use client'

import { useEffect, useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { StageBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateDealForm } from '@/components/forms/create-deal-form'
import { DealDetailModal } from '@/components/pipeline/deal-detail-modal'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { getDeals, getCurrentUser } from '@/lib/queries'
import { getDocumentCounts } from '@/lib/documents'
import { getAssetTypeColor } from '@/lib/stage-colors'
import { useTheme } from '@/components/theme-provider'
import { PROPERTY_STAGES, type Deal, type Contact, type PropertyStage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, FileText, Paperclip, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'

type ViewMode = 'card' | 'table'
type SortField = 'title' | 'contact' | 'stage' | 'deal_value' | 'fee' | 'created_at' | 'updated_at'
type SortDir = 'asc' | 'desc'

const STAGE_ORDER: Record<PropertyStage, number> = {
  lead: 0,
  initial_call: 1,
  property_search: 2,
  due_diligence: 3,
  exchange: 4,
  fees_collected: 5,
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<PropertyStage | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactDetailOpen, setContactDetailOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const { theme } = useTheme()

  const load = () => {
    getDeals().then(d => {
      setDeals(d)
      getDocumentCounts('deal', d.map(dl => dl.id)).then(setDocCounts)
    })
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = deals.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
        (d.contact?.name || '').toLowerCase().includes(search.toLowerCase())
      const matchStage = stageFilter === 'all' || d.stage === stageFilter
      return matchSearch && matchStage
    })

    // Sort for table view
    if (viewMode === 'table') {
      result = [...result].sort((a, b) => {
        let cmp = 0
        switch (sortField) {
          case 'title':
            cmp = a.title.localeCompare(b.title)
            break
          case 'contact':
            cmp = (a.contact?.name || '').localeCompare(b.contact?.name || '')
            break
          case 'stage':
            cmp = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]
            break
          case 'deal_value':
            cmp = (a.deal_value || 0) - (b.deal_value || 0)
            break
          case 'fee':
            cmp = (a.fee_amount || 0) - (b.fee_amount || 0)
            break
          case 'created_at':
            cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            break
          case 'updated_at':
            cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
            break
        }
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [deals, search, stageFilter, viewMode, sortField, sortDir])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-cc-text-muted" />
    return sortDir === 'asc'
      ? <ArrowUp className="h-3 w-3 text-cc-text-primary" />
      : <ArrowDown className="h-3 w-3 text-cc-text-primary" />
  }

  const formatCurrency = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  const calcFee = (deal: Deal) => {
    if (deal.fee_amount) return deal.fee_amount
    if (deal.deal_value && deal.fee_percentage) return (deal.deal_value * deal.fee_percentage) / 100
    return null
  }

  return (
    <div>
      <PageHeader title="Deals" description={`${deals.length} deals`}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
            <Input
              placeholder="Search deals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-56 h-9"
            />
          </div>
          {/* View toggle */}
          <div className="flex border border-cc-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-cc-surface-2 text-cc-text-primary' : 'text-cc-text-muted hover:text-cc-text-secondary'}`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-cc-surface-2 text-cc-text-primary' : 'text-cc-text-muted hover:text-cc-text-secondary'}`}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Deal
          </Button>
        </div>
      </PageHeader>

      {/* Stage filter chips */}
      <div className="flex gap-1.5 mb-8 overflow-x-auto pb-1">
        <button
          onClick={() => setStageFilter('all')}
          className={`px-3 py-1.5 text-xs border rounded-md transition-colors whitespace-nowrap ${
            stageFilter === 'all'
              ? 'bg-cc-accent text-white border-cc-accent'
              : 'bg-transparent text-cc-text-secondary border-cc-border-hover hover:border-cc-btn-border hover:text-cc-text-primary'
          }`}
        >
          All Stages
        </button>
        {PROPERTY_STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => setStageFilter(s.key)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-colors whitespace-nowrap ${
              stageFilter === s.key
                ? 'bg-cc-accent text-white border-cc-accent'
                : 'bg-transparent text-cc-text-secondary border-cc-border-hover hover:border-cc-btn-border hover:text-cc-text-primary'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No deals yet"
          description="Create your first deal to start tracking property transactions."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Deal
            </Button>
          }
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(deal => (
            <GlassCard
              key={deal.id}
              className="p-5"
              onClick={() => { setSelectedDeal(deal); setDetailOpen(true) }}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-cc-text-primary truncate flex-1">{deal.title}</p>
                </div>
                {deal.contact && (
                  <p className="text-xs text-cc-text-secondary">{deal.contact.name}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <StageBadge stage={deal.stage} />
                  {deal.contact?.asset_type && (() => {
                    const atc = getAssetTypeColor(deal.contact!.asset_type!, theme === 'dark')
                    return (
                      <span className="text-[10px] px-1.5 py-0.5 font-medium rounded-sm" style={{ backgroundColor: atc.bg, color: atc.text }}>
                        {deal.contact!.asset_type}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-cc-text-primary tracking-[-0.01em]">
                    {formatCurrency(deal.deal_value)}
                  </span>
                  <div className="flex items-center gap-2">
                    {docCounts[deal.id] > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-cc-text-muted">
                        <Paperclip className="h-3 w-3" /> {docCounts[deal.id]}
                      </span>
                    )}
                    {deal.fee_amount && (
                      <span className="text-xs text-cc-text-secondary">
                        Fee: {formatCurrency(deal.fee_amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        /* Table view */
        <GlassCard hover={false} className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort('title')} className="flex items-center gap-1">
                    Deal Name <SortIcon field="title" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('contact')} className="flex items-center gap-1">
                    Contact <SortIcon field="contact" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('stage')} className="flex items-center gap-1">
                    Stage <SortIcon field="stage" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('deal_value')} className="flex items-center gap-1">
                    Deal Value <SortIcon field="deal_value" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('fee')} className="flex items-center gap-1">
                    Est. Fee <SortIcon field="fee" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1">
                    Created <SortIcon field="created_at" />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => toggleSort('updated_at')} className="flex items-center gap-1">
                    Last Activity <SortIcon field="updated_at" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(deal => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer"
                  onClick={() => { setSelectedDeal(deal); setDetailOpen(true) }}
                >
                  <TableCell className="font-medium text-cc-text-primary">
                    {deal.title}
                  </TableCell>
                  <TableCell>
                    {deal.contact?.name || '—'}
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={deal.stage} />
                  </TableCell>
                  <TableCell className="text-cc-text-primary font-medium">
                    {formatCurrency(deal.deal_value)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(calcFee(deal))}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(deal.created_at), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(deal.updated_at), 'dd MMM yyyy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </GlassCard>
      )}

      <CreateDealForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => load()}
        userId={userId}
      />

      <DealDetailModal
        deal={selectedDeal}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
        userId={userId}
        onNavigateToContact={(contact) => {
          setSelectedContact(contact)
          setContactDetailOpen(true)
        }}
      />

      <ContactDetailModal
        contact={selectedContact}
        open={contactDetailOpen}
        onClose={() => setContactDetailOpen(false)}
        onUpdated={load}
        userId={userId}
        onNavigateToDeal={(deal) => {
          setSelectedDeal(deal)
          setDetailOpen(true)
        }}
      />
    </div>
  )
}
