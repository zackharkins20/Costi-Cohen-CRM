'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { GlassCard } from '@/components/ui/glass-card'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import { DealDetailModal } from '@/components/pipeline/deal-detail-modal'
import { getContacts, getDeals, updateContact, getCurrentUser, logActivity } from '@/lib/queries'
import { notifyAllUsers } from '@/lib/notifications'
import { executeWorkflows } from '@/lib/workflows'
import { PROPERTY_STAGES, type Contact, type Deal, type PropertyStage } from '@/lib/types'
import { BUYER_TYPES, type BuyerType } from '@/lib/types'
import { Users, DollarSign, TrendingUp, BarChart3, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { getStageColor } from '@/lib/stage-colors'
import { useTheme } from '@/components/theme-provider'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { DropResult } from '@hello-pangea/dnd'

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [dealDetailOpen, setDealDetailOpen] = useState(false)
  const { theme } = useTheme()

  const load = () => {
    getContacts().then(setContacts)
    getDeals().then(setDeals)
    getCurrentUser().then(u => { if (u) setUserId(u.id) })
  }

  useEffect(() => { load() }, [])

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  )

  const columns = PROPERTY_STAGES.map(stage => ({
    id: stage.key,
    title: stage.label,
    items: filtered.filter(c => c.stage === stage.key),
  }))

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const contactId = result.draggableId
    const newStage = result.destination.droppableId as PropertyStage
    const contact = contacts.find(c => c.id === contactId)
    if (!contact || contact.stage === newStage) return

    // Optimistic update
    setContacts(prev =>
      prev.map(c => c.id === contactId ? { ...c, stage: newStage } : c)
    )
    await updateContact(contactId, { stage: newStage })
    await logActivity({
      entity_type: 'contact',
      entity_id: contactId,
      action: 'stage_change',
      description: `Stage changed from ${contact.stage} to ${newStage}`,
      created_by: userId,
    })
    const stageLabel = PROPERTY_STAGES.find(s => s.key === newStage)?.label ?? newStage
    await notifyAllUsers({
      title: 'Pipeline Stage Changed',
      message: `${contact.name} moved to ${stageLabel}`,
      entity_type: 'contact',
      entity_id: contactId,
    })
    executeWorkflows({
      trigger_type: 'deal_stage_change',
      contact: { id: contactId, name: contact.name, email: contact.email || undefined },
      new_stage: newStage,
      old_stage: contact.stage,
      user: { id: userId || '', name: '' },
    })
  }

  const activeDeals = deals.filter(d => d.stage !== 'settled' && d.stage !== 'marketing_only')
  const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.deal_value || 0), 0)
  const weightedPipeline = deals.reduce((sum, d) => {
    const stageInfo = PROPERTY_STAGES.find(s => s.key === d.stage)
    const probability = stageInfo?.probability ?? 0
    return sum + ((d.deal_value || 0) * probability) / 100
  }, 0)
  const estFees = deals.reduce((sum, d) => {
    if (!d.deal_value || !d.fee_percentage) return sum
    return sum + (d.deal_value * d.fee_percentage) / 100
  }, 0)

  // Build a map of deal values per stage for column headers
  const dealsByContactStage = new Map<string, number>()
  for (const contact of contacts) {
    const contactDeals = deals.filter(d => d.contact_id === contact.id)
    const totalValue = contactDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
    dealsByContactStage.set(contact.id, totalValue)
  }
  const stageValues = PROPERTY_STAGES.reduce((acc, stage) => {
    const stageContacts = contacts.filter(c => c.stage === stage.key)
    acc[stage.key] = stageContacts.reduce((sum, c) => sum + (dealsByContactStage.get(c.id) || 0), 0)
    return acc
  }, {} as Record<string, number>)

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `AU$ ${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `AU$ ${(n / 1_000).toFixed(0)}K`
    return `AU$ ${n.toLocaleString()}`
  }

  return (
    <div>
      <PageHeader title="Pipeline" description="Drag contacts across stages">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cc-text-muted" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56 h-9"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard label="Total Contacts" value={contacts.length} icon={Users} index={0} />
        <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={DollarSign} index={1} />
        <MetricCard label="Weighted Pipeline" value={formatCurrency(weightedPipeline)} icon={BarChart3} index={2} />
        <MetricCard label="Est. Fees" value={formatCurrency(estFees)} icon={TrendingUp} index={3} />
      </div>

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        getItemId={c => c.id}
        columnHeaderExtra={(column) => {
          const stageInfo = PROPERTY_STAGES.find(s => s.key === column.id)
          const value = stageValues[column.id] || 0
          return (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-cc-text-muted">
                {stageInfo?.probability ?? 0}%
              </span>
              <span className="text-[10px] font-medium text-cc-text-secondary">
                AU$ {value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : value.toLocaleString()}
              </span>
            </div>
          )
        }}
        renderCard={(contact) => {
          const contactDeals = deals.filter(d => d.contact_id === contact.id)
          const totalDealValue = contactDeals.reduce((s, d) => s + (d.deal_value || 0), 0)
          const buyerLabel = BUYER_TYPES.find(b => b.key === contact.buyer_type)?.label
          const buyerColors: Record<string, { bg: string; text: string }> = {
            investor: { bg: '#DBEAFE', text: '#1E40AF' },
            developer: { bg: '#EDE9FE', text: '#5B21B6' },
            owner_occupier: { bg: '#D1FAE5', text: '#065F46' },
          }
          const btc = contact.buyer_type ? buyerColors[contact.buyer_type] : null

          return (
            <GlassCard
              className="p-3"
              onClick={() => {
                setSelectedContact(contact)
                setDetailOpen(true)
              }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-sm font-medium text-cc-text-primary truncate">
                    {contact.name}
                    <span className="text-xs text-cc-text-muted font-normal ml-1.5">
                      {format(new Date(contact.created_at), 'MMM yy')}
                    </span>
                  </p>
                </div>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-xs text-cc-text-secondary hover:text-cc-accent truncate"
                  >
                    <Phone className="h-3 w-3 flex-shrink-0" /> {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <p className="text-xs text-cc-text-muted truncate">{contact.email}</p>
                )}
                {totalDealValue > 0 && (
                  <p className="text-xs font-semibold text-cc-text-primary">
                    AU$ {totalDealValue >= 1_000_000 ? `${(totalDealValue / 1_000_000).toFixed(1)}M` : totalDealValue.toLocaleString()}
                  </p>
                )}
                {buyerLabel && btc && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-sm"
                    style={{ backgroundColor: btc.bg, color: btc.text }}
                  >
                    {buyerLabel}
                  </span>
                )}
              </div>
            </GlassCard>
          )
        }}
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
