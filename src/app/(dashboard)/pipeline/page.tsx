'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { MetricCard } from '@/components/ui/metric-card'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { ContactCard } from '@/components/pipeline/contact-card'
import { ContactDetailModal } from '@/components/pipeline/contact-detail-modal'
import { getContacts, updateContact, getCurrentUser, logActivity } from '@/lib/queries'
import { PROPERTY_STAGES, type Contact, type PropertyStage } from '@/lib/types'
import { Users, DollarSign, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { DropResult } from '@hello-pangea/dnd'

export default function PipelinePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [userId, setUserId] = useState<string>()

  const load = () => {
    getContacts().then(setContacts)
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
  }

  const pipelineValue = contacts.reduce((sum, c) => sum + (c.budget_max || 0), 0)
  const estFees = contacts.reduce((sum, c) => {
    if (!c.budget_max || !c.fee_percentage) return sum
    return sum + (c.budget_max * c.fee_percentage) / 100
  }, 0)

  const formatCurrency = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
    return `$${n}`
  }

  return (
    <div>
      <PageHeader title="Pipeline" description="Drag contacts across stages">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cc-text-muted)]" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 w-56 bg-[var(--cc-surface-2)] border-[var(--cc-border)] text-[var(--cc-text-primary)] h-9"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <MetricCard label="Total Contacts" value={contacts.length} icon={Users} />
        <MetricCard label="Pipeline Value" value={formatCurrency(pipelineValue)} icon={DollarSign} />
        <MetricCard label="Est. Fees" value={formatCurrency(estFees)} icon={TrendingUp} />
      </div>

      <KanbanBoard
        columns={columns}
        onDragEnd={handleDragEnd}
        getItemId={c => c.id}
        renderCard={(contact) => (
          <ContactCard
            contact={contact}
            onClick={() => {
              setSelectedContact(contact)
              setDetailOpen(true)
            }}
          />
        )}
      />

      <ContactDetailModal
        contact={selectedContact}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={load}
        userId={userId}
      />
    </div>
  )
}
