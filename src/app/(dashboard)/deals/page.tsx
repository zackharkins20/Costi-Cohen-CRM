'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { GlassCard } from '@/components/ui/glass-card'
import { StageBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateDealForm } from '@/components/forms/create-deal-form'
import { DealDetailModal } from '@/components/pipeline/deal-detail-modal'
import { getDeals, getCurrentUser } from '@/lib/queries'
import { getDocumentCounts } from '@/lib/documents'
import { PROPERTY_STAGES, type Deal, type PropertyStage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, FileText, Paperclip } from 'lucide-react'

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<PropertyStage | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [docCounts, setDocCounts] = useState<Record<string, number>>({})

  const load = () => {
    getDeals().then(d => {
      setDeals(d)
      getDocumentCounts('deal', d.map(dl => dl.id)).then(setDocCounts)
    })
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = deals.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.contact?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchStage = stageFilter === 'all' || d.stage === stageFilter
    return matchSearch && matchStage
  })

  const formatCurrency = (n: number | null) => {
    if (!n) return '—'
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  return (
    <div>
      <PageHeader title="Deals" description={`${deals.length} deals`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56 h-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Deal
        </Button>
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
      ) : (
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
                <StageBadge stage={deal.stage} />
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
      />
    </div>
  )
}
